"""TSP 本地财务「核心指标」换算补全（不改数据源，仅运行时换算）。

现象：个股页「核心指标」卡片大面积显示 –, 根因两类:
  A. 字段名错位: UI 读 eps_basic, 但 metrics 表只有 eps_observation (其值为 null 的是 eps_basic)。
  B. 衍生指标从未写入: roe / roa / net_margin / debt_to_asset_ratio / *yoy
     在 metrics 表中全为 null (field_mapping_verified=false), 而原始利润表/资产负债表
     字段齐全, 可由原始数据换算。

  另: 财务页「股本」Tab 读 total_shares / float_shares, 但本地 shares 表缺 float_shares
  列(流通股本存于 circulating_shares), 且 total_shares 仅最新期有值 -> 股本大面积 –。
  故本 override 同时补全 shares 表的 float_shares <- circulating_shares。

做法: 包装 financials 模块的 get_financial_df 全局名 (get_metrics 等通过该模块全局名
调用, 而非 FastAPI 捕获的 endpoint, 故无需改路由)。仅当 table=="metrics"/"shares"
时在返回前换算补全; 其余表原样返回。原始 parquet 一个字节都不改。

【2026-11-09 扩展】回测读取线: 原版 load_fundamental_snapshot (backtest/fundamentals.py)
直接读 metrics 原始 parquet, 绕过上面的换算, 且原始 announce_date 100% 空 ->
快照恒空 -> 7 个财务因子全 null。本 override 在 install() 中额外包装
app.backtest.fundamentals.load_fundamental_snapshot, 复用同一条换算 + 派生 announce_date,
使回测也能吃到 6 比率列、gross_margin 与推导的 bps。该包装带升级安全守卫
(目标模块/符号不存在则跳过, 不阻断启动)。

换算口径 (本地推算, 可能与官方算法有细微差异, 已在报告中标注):
  - eps_basic   <- eps_observation        (当 eps_basic 为 null)
  - eps_diluted <- eps_diluted_observation (当 eps_diluted 为 null 且存在)
  - roe  = 归母净利润 / 净资产(total_equity)
  - roa  = 归母净利润 / 总资产(total_assets)
  - net_margin = 归母净利润 / 营收(revenue)
  - gross_margin = (revenue - operating_cost) / revenue   (income 表两列均 <0.4% 空, 可直接推算)
  - debt_to_asset_ratio = 负债(total_liabilities) / 总资产(total_assets)
  - revenue_yoy / net_income_yoy = 去年同期同 fiscal_period 同比增速
  - bps = 净资产(total_equity) / 总股本(total_shares)（metrics 表 87.5% 空，二开层推导补全：
    股本表仅最新期有 total_shares，取该标的最新可用值近似，维度 元/股）
"""
from __future__ import annotations

import logging
from pathlib import Path

import polars as pl

log = logging.getLogger(__name__)

# 模块级缓存: 避免每个请求重读 income/balance (数据变化靠 mtime 失效)。
_state = {
    "data_dir": None,
    "income_map": None,
    "balance_map": None,
    "yoy_map": None,
    "shares_map": None,
    "mtime": 0,
}

_INC_COLS = [
    "symbol", "period_end", "fiscal_year", "fiscal_period",
    "revenue", "net_income", "net_income_attributable", "total_profit",
    "operating_cost",  # 用于推算 gross_margin = (revenue - operating_cost) / revenue
]
_BAL_COLS = [
    "symbol", "period_end",
    "total_assets", "total_equity", "equity", "total_liabilities",
]


def _num(v):
    try:
        if v is None:
            return None
        f = float(v)
        return f
    except Exception:
        return None


def _safe_div(num, den):
    num = _num(num)
    den = _num(den)
    if num is None or den in (None, 0):
        return None
    return num / den


def _mtime(data_dir):
    try:
        best = 0.0
        for t in ("income", "balance_sheet"):
            p = Path(data_dir) / "financials" / t / "part.parquet"
            if p.exists():
                best = max(best, p.stat().st_mtime)
        return best
    except Exception:
        return 0.0


def _build_maps(orig, data_dir):
    inc = orig(data_dir, "income")
    bal = orig(data_dir, "balance_sheet")
    sha = orig(data_dir, "shares")
    inc_cols = [c for c in _INC_COLS if c in inc.columns]
    bal_cols = [c for c in _BAL_COLS if c in bal.columns]
    inc = inc.select(inc_cols)
    bal = bal.select(bal_cols)
    income_map = {}
    yoy_map = {}
    for r in inc.to_dicts():
        sym = r.get("symbol")
        pe = r.get("period_end")
        if sym and pe:
            income_map[(sym, pe)] = r
            yoy_map.setdefault(sym, {}).setdefault(r.get("fiscal_period"), []).append(
                (r.get("fiscal_year"), r)
            )
    balance_map = {
        (r.get("symbol"), r.get("period_end")): r
        for r in bal.to_dicts()
        if r.get("symbol") and r.get("period_end")
    }
    # shares: 仅最新报告期有 total_shares（覆盖率约 12.5%）。
    # 为让 bps 可推导，取每个标的 period_end 最大（最新）的非空 total_shares。
    shares_map = {}
    if "total_shares" in sha.columns:
        for r in sha.select(
            [c for c in ("symbol", "period_end", "total_shares") if c in sha.columns]
        ).to_dicts():
            sym = r.get("symbol")
            ts = r.get("total_shares")
            if sym and ts is not None:
                pe = r.get("period_end")
                cur = shares_map.get(sym)
                if cur is None or (pe is not None and (cur[0] is None or pe > cur[0])):
                    shares_map[sym] = (pe, ts)
    return income_map, balance_map, yoy_map, shares_map


def _yoy(yoy_map, sym, fp, fy, inc):
    if not (sym and fp and fy):
        return None, None
    prev_list = yoy_map.get(sym, {}).get(fp)
    if not prev_list:
        return None, None
    prev = None
    for (py, pr) in prev_list:
        if py == fy - 1:
            prev = pr
            break
    if prev is None:
        return None, None
    rev_c = _num(inc.get("revenue"))
    rev_p = _num(prev.get("revenue"))
    ni_c = _num(inc.get("net_income_attributable")) or _num(inc.get("net_income"))
    ni_p = _num(prev.get("net_income_attributable")) or _num(prev.get("net_income"))
    rev_yoy = (rev_c - rev_p) / abs(rev_p) if (rev_c is not None and rev_p not in (None, 0)) else None
    ni_yoy = (ni_c - ni_p) / abs(ni_p) if (ni_c is not None and ni_p not in (None, 0)) else None
    return rev_yoy, ni_yoy


def _enrich(orig, data_dir, df):
    if df.is_empty():
        return df
    mtime = _mtime(data_dir)
    if (
        _state["data_dir"] != data_dir
        or _state["income_map"] is None
        or _state["mtime"] != mtime
    ):
        (_state["income_map"], _state["balance_map"], _state["yoy_map"], _state["shares_map"]) = _build_maps(orig, data_dir)
        _state["data_dir"] = data_dir
        _state["mtime"] = mtime
    inc_map = _state["income_map"]
    bal_map = _state["balance_map"]
    yoy_map = _state["yoy_map"]

    out = []
    for r in df.to_dicts():
        sym = r.get("symbol")
        pe = r.get("period_end")
        inc = inc_map.get((sym, pe)) or {}
        bal = bal_map.get((sym, pe)) or {}

        # A. EPS 字段名错位兜底
        r["eps_basic"] = r.get("eps_basic") if r.get("eps_basic") is not None else r.get("eps_observation")
        r["eps_diluted"] = (
            r.get("eps_diluted") if r.get("eps_diluted") is not None else r.get("eps_diluted_observation")
        )

        # B. 衍生比率 (仅在原值为 null 时换算, 不覆盖已有值)
        ni = _num(inc.get("net_income_attributable")) or _num(inc.get("net_income"))
        te = _num(bal.get("total_equity")) or _num(bal.get("equity"))
        ta = _num(bal.get("total_assets"))
        tl = _num(bal.get("total_liabilities"))
        rev = _num(inc.get("revenue"))

        r["roe"] = r.get("roe") if r.get("roe") is not None else _safe_div(ni, te)
        r["roa"] = r.get("roa") if r.get("roa") is not None else _safe_div(ni, ta)
        r["net_margin"] = r.get("net_margin") if r.get("net_margin") is not None else _safe_div(ni, rev)
        r["debt_to_asset_ratio"] = (
            r.get("debt_to_asset_ratio") if r.get("debt_to_asset_ratio") is not None else _safe_div(tl, ta)
        )

        # 同比 (去年同期同 fiscal_period)
        rev_yoy, ni_yoy = _yoy(yoy_map, sym, inc.get("fiscal_period"), inc.get("fiscal_year"), inc)
        r["revenue_yoy"] = r.get("revenue_yoy") if r.get("revenue_yoy") is not None else rev_yoy
        r["net_income_yoy"] = r.get("net_income_yoy") if r.get("net_income_yoy") is not None else ni_yoy

        # gross_margin = (revenue - operating_cost) / revenue
        # income 表同时含 revenue 与 operating_cost（缺失率均 <0.4%）, 可直接推算,
        # 不再保持 null（原注释"缺 gross_profit 字段"已过时）。
        rev = _num(inc.get("revenue"))
        opc = _num(inc.get("operating_cost"))
        gm = r.get("gross_margin")
        if gm is None and rev is not None and opc is not None and rev != 0:
            gm = (rev - opc) / rev
        r["gross_margin"] = gm

        # bps = 净资产(total_equity) / 总股本(total_shares)。
        # 原始 metrics 表 bps 87.5% 为空；用资产负债表净资产 + 股本表总股本推导。
        # 股本表仅最新期有 total_shares（约 12.5% 行），取该标的可用的最新值作近似
        # （股本变动缓慢，对历史期用最新股本是轻度近似，维度：元/股，优于留空）。
        if r.get("bps") is None:
            te = _num(bal.get("total_equity")) or _num(bal.get("equity"))
            sh = _state.get("shares_map") or {}
            st = sh.get(sym)
            ts = st[1] if isinstance(st, tuple) else st
            r["bps"] = _safe_div(te, ts)

        out.append(r)
    return pl.DataFrame(out)


def _enrich_shares(df):
    """股本 Tab 字段名错位修复（不改数据源）。

    UI 股本 Tab 配置: [{总股本, total_shares}, {流通股本, float_shares}]。
    本地 shares 表缺 float_shares 列(流通股本实际存于 circulating_shares),
    且 total_shares 仅最新报告期有值。这里在读取时补 float_shares <- circulating_shares
    (仅当 float_shares 缺失且 circulating_shares 有值); total_shares 有值则保留。
    原始 parquet 不改。
    """
    if df.is_empty():
        return df
    out = []
    for r in df.to_dicts():
        if r.get("float_shares") is None:
            r["float_shares"] = r.get("circulating_shares")
        out.append(r)
    return pl.DataFrame(out)


def _derive_announce_date(df: pl.DataFrame) -> pl.DataFrame:
    """为 metrics 帧补 announce_date 列。

    原始 metrics 表 announce_date 100% 为空, 而 load_fundamental_snapshot 会
    过滤掉 announce_date 为空的行 → 快照恒空 → 7 个财务因子全 null。

    派生策略（保守、不偷看未来）:
      - 优先用 fuyao_announce_date_candidate（扶摇交叉核验的真实公告日, 约 12.5% 有值）;
      - 其余回退 period_end（报告期截止日, 当天数据已确定, 作为最保守下界）。
    两列统一转成 'YYYY-MM-DD' 字符串, 与下游 load_fundamental_snapshot 的
    cast(Utf8).str.slice(0,10).str.to_date() 处理一致。
    """
    if df.is_empty():
        return df
    has_pe = "period_end" in df.columns
    has_cand = "fuyao_announce_date_candidate" in df.columns
    if not has_pe and not has_cand:
        return df  # 无可用来源, 保留原 announce_date（可能全空）
    pe = pl.col("period_end").cast(pl.Utf8).str.slice(0, 10)
    if has_cand:
        cand = (
            pl.col("fuyao_announce_date_candidate").cast(pl.Utf8).str.slice(0, 10)
        )
        ad = (
            pl.when(cand.is_not_null() & (cand != ""))
            .then(cand)
            .otherwise(pe)
        )
    else:
        ad = pe
    return df.with_columns(ad.alias("announce_date"))


def install():
    import app.api.financials as fin
    import app.services.financial_sync as fsync

    # 捕获原始函数, 避免包装内递归。
    orig = fsync.get_financial_df

    def _wrapped(data_dir, table):
        df = orig(data_dir, table)
        if table == "metrics":
            return _enrich(orig, data_dir, df)
        if table == "shares":
            return _enrich_shares(df)
        return df

    # get_metrics / get_shares 在 financials 模块内通过模块全局名调用 get_financial_df,
    # 故重绑该模块全局名即可生效, 无需改动 FastAPI 路由。
    fin.get_financial_df = _wrapped

    # ---- 回测读取线（load_fundamental_snapshot）----
    # 原版该函数在 backtest/fundamentals.py 内直接读 metrics 原始 parquet,
    # 绕过上面的 _enrich, 因此看不到换算后的 6 比率列, 且原始 announce_date 100% 空
    # → 快照恒空 → 7 个财务因子全 null。这里把同一条换算也接到回测线:
    # 复用已包装的 fin.get_financial_df（含 6 比率 + 新增 gross_margin + bps）,
    # 派生 announce_date, 再照搬原函数的 _announce 构造与过滤, 保持下游形状不变。
    try:
        import app.backtest.fundamentals as bf
    except Exception:  # noqa: BLE001 — 未来版本若移除该模块, 安全跳过
        bf = None

    if bf is not None and hasattr(bf, "load_fundamental_snapshot"):
        def _wrapped_load_fundamental_snapshot(data_dir):
            # 走已包装的 get_financial_df, 拿到换算后的 metrics（含 6 比率 + gross_margin + bps）
            df = fin.get_financial_df(data_dir, "metrics")
            if df is None or df.is_empty():
                return None
            df = _derive_announce_date(df)
            needed = {
                "symbol", "announce_date", "bps",
                "roe", "gross_margin", "net_margin",
                "revenue_yoy", "net_income_yoy", "debt_to_asset_ratio",
            }
            if not needed.issubset(df.columns):
                return None
            snapshot = (
                df.select(sorted(needed))
                .filter(pl.col("announce_date").is_not_null())
                .with_columns(
                    pl.col("announce_date").cast(pl.Utf8).str.slice(0, 10).str.to_date().alias("_announce")
                )
                .sort(["symbol", "_announce"])
            )
            return snapshot if not snapshot.is_empty() else None

        bf.load_fundamental_snapshot = _wrapped_load_fundamental_snapshot
        log.warning(
            "FINANCIALS_METRICS_ENRICH: installed "
            "(UI + backtest read-path enrichment of core metrics & ratios; data source untouched; upgrade-safe)"
        )
    else:
        log.warning(
            "FINANCIALS_METRICS_ENRICH: backtest hook skipped "
            "(app.backtest.fundamentals.load_fundamental_snapshot not found) — UI enrichment still active"
        )
