"""七星超级175 V3.14 · ETF 动量轮动 — TSP 日频移植版

源策略: 「七星超级加175v311 V3.14 双风险规避定版（聚宽）」作者 任侠
源文件: 七星超级175聚宽v3.141-qmt (1).txt (2455 行)

【移植范围】日频核心骨架，可在 TSP 自定义策略引擎 (matrix_native) 内运行:
  1. 三组 ETF 池 (海外 QDII / 商品 / A股)，代码由 XSHG/XSHE 转为 SH/SZ
  2. 动量得分: 26 日加权 log 线性回归 → 年化收益 × 加权 R²
     (权重 np.linspace(1,2,W)，与原版 get_annualized_returns 完全一致)
  3. 候选过滤: R²≥0.35、近3日无单日跌幅>3%、10日短期动量≥0、
     均线结构 (价>MA10 且 MA5>MA10)、买入得分下限 0.20
  4. 双风险规避四格池: A股弱 × 海外弱 → 正常/海外弱/A股弱/双弱
  5. 每日取有效池内得分最高的 1 只 (holdings_num=1)，非目标标的置 exit
     实现每日轮动；无合格标的时空仓 (enable_defensive_etf=False)

【风险规避的移植取舍】
  原版 A 股弱用 6 个指数 (000001/000300/399001/399101/399006/000510) 的
  「现价<MA10」或「MA5<MA10 死叉」计数 ≥3/6；海外弱用 4 个 QDII 代理
  (159509/513500/513400/513520) 的 MA10/MA5 结构 ≥2/4。
  本移植版改为**使用矩阵内对应的宽基 ETF 代理**计算，好处:
    - 完全在 market 矩阵内按 t 对齐，天然无未来函数 (只用 <= t 的收盘价)
    - 不读外部指数数据源，不依赖 get_index_daily 的默认 end=today
    - 数据一旦同步即可运行
  代理: A股弱用 510300/510500/510050/159915/588080/512100；
        海外弱用 159509/513500/513400/513520。
  原版带 20 日状态机与进出迟滞，日频引擎无法表达，此处用当日即时判断。

【未移植 (TSP 日频矩阵引擎无法表达，需明确知晓)】
  - 分钟级守卫: 13:09 卖出 / 13:10 买入、盘中现价双轨复检、
    日内高点→现价 2% 回撤守卫、盈利保护 11:00 检查
  - 溢价率过滤 (需要 ETF 净值数据，本地无)
  - 停牌/可交易性 (需要分钟成交数据)
  - 有害卖出冷却、弱 QDII 簇相关性守卫、轮动卖海外冷却
  - 震荡期拉普拉斯/高斯滤波与滤波器切换状态机
  - 精确成交时点: TSP 回测按信号次日开盘成交，非原版 13:10 现价

【本地 ETF 数据】data-local/kline_etf_daily 与 kline_etf_enriched 由
scripts/sync_etf_from_tdx.py 从本机通达信 vipdoc 离线同步 (52 只 × 244 个
交易日, 2025-11-04~2026-11-05)。价格单位为 1/1000 元, volume 按
amount/close/100 反推为「手」, 与 TSP 股票口径一致。
注意: 本地 adj_factor_etf 为空, close 与 raw_close 相同, **未做前复权**；
ETF 分红除息日会留下价格跳空, 与聚宽 fq='pre' 的前复权价存在差异。
若更换机器或清空 data-local, 需重跑该同步脚本, 否则 asset_type=etf
的策略会因「无可用数据日期」而无法运行。
"""

import numpy as np

from app.backtest.matrix import (
    MarketDataMatrix,
    SignalMatrix,
    make_signal_matrix,
)

# ── ETF 池 (TSP 代码格式) ────────────────────────────────────────────────
OVERSEAS_POOL = [
    "513100.SH", "159509.SZ", "513290.SH", "513500.SH", "159529.SZ",
    "513400.SH", "513520.SH", "513030.SH", "513080.SH", "513310.SH",
    "513730.SH", "159792.SZ", "513130.SH", "513050.SH", "159920.SZ",
    "513690.SH", "511380.SH", "511010.SH", "511220.SH",
]
COMMODITY_POOL = [
    "518880.SH", "159980.SZ", "159985.SZ", "501018.SH",
    "161226.SZ", "159981.SZ", "512400.SH",
]
DOMESTIC_POOL = [
    "510300.SH", "510500.SH", "510050.SH", "510210.SH", "159915.SZ",
    "588080.SH", "512100.SH", "563360.SH", "563300.SH", "512890.SH",
    "159967.SZ", "588020.SH", "512040.SH", "159201.SZ", "515790.SH",
    "563230.SH", "515880.SH", "512660.SH", "561380.SH", "159667.SZ",
    "159559.SZ", "159819.SZ", "159381.SZ", "159732.SZ", "159995.SZ",
    "512220.SH",
]
ALL_POOL = OVERSEAS_POOL + COMMODITY_POOL + DOMESTIC_POOL

# 风险规避代理 (矩阵内可用，替代原版 6 指数 / 4 QDII 代理)
A_SHARE_PROXIES = [
    "510300.SH", "510500.SH", "510050.SH",
    "159915.SZ", "588080.SH", "512100.SH",
]
OVERSEAS_PROXIES = ["159509.SZ", "513500.SH", "513400.SH", "513520.SH"]

META = {
    "id": "custom_qx175_etf_rotation",
    "name": "七星超级175 V3.14 · ETF动量轮动",
    "description": "26日加权对数回归动量(年化×R²) + R²/跌幅/均线结构过滤 + A股弱×海外弱四格池，每日持有得分最高的1只ETF",
    "tags": ["ETF", "动量轮动", "双风险规避", "日频"],
    "asset_types": ["etf"],
    "timeframes": ["1d"],
    # ETF 不能用股票的引擎级默认基础过滤 (price_min=3 / 市值 / 成交额 /
    # exclude_st / boards)。引擎虽有 _basic_filter_for_asset 在运行期中和,
    # 但 _matrix_field_columns 会先按未中和的 bf 解析出 total_shares 等
    # 字段需求。这里在源头全部置空, 保证 ETF 维表缺列时也不受影响。
    "basic_filter": {
        "price_min": None,
        "price_max": None,
        "market_cap_min": None,
        "market_cap_max": None,
        "float_cap_min": None,
        "float_cap_max": None,
        "amount_min": None,
        "amount_max": None,
        "turnover_min": None,
        "turnover_max": None,
        "exclude_st": False,
        "exclude_new_days": 0,
        "boards": [],
    },
    "params": [
        {"id": "lookback_days", "label": "动量回看天数", "type": "int", "default": 25, "min": 10, "max": 60, "step": 1},
        {"id": "r2_threshold", "label": "R² 下限", "type": "float", "default": 0.35, "min": 0.0, "max": 1.0, "step": 0.05},
        {"id": "buy_min_score", "label": "买入得分下限", "type": "float", "default": 0.20, "min": 0.0, "max": 5.0, "step": 0.05},
        {"id": "rank_max_score", "label": "排名得分上限", "type": "float", "default": 10000.0, "min": 10.0, "max": 100000.0, "step": 100.0},
        {"id": "daily_loss_limit", "label": "近3日单日跌幅下限(比率)", "type": "float", "default": 0.97, "min": 0.85, "max": 1.0, "step": 0.01},
        {"id": "short_lookback", "label": "短期动量回看天数", "type": "int", "default": 10, "min": 3, "max": 30, "step": 1},
        {"id": "trend_ma_period", "label": "趋势均线周期", "type": "int", "default": 10, "min": 5, "max": 30, "step": 1},
        {"id": "enable_trend_filter", "label": "启用均线趋势结构过滤", "type": "bool", "default": True},
        {"id": "enable_regime", "label": "启用双风险规避四格池", "type": "bool", "default": True},
        {"id": "a_weak_enter_count", "label": "A股弱触发代理数(≥N/6)", "type": "int", "default": 3, "min": 1, "max": 6, "step": 1},
        {"id": "o_weak_enter_count", "label": "海外弱触发代理数(≥N/4)", "type": "int", "default": 2, "min": 1, "max": 4, "step": 1},
    ],
    # 关键: scoring 必须为空, 让引擎保留 compute_signals 自算的 score。
    # META.scoring 是固定字段白名单且权重和须=1.0, 无法承载自定义动量得分。
    "scoring": {},
    "order_by": "score",
    "descending": True,
    "limit": 1,
}

EXECUTION_BACKEND = "matrix_native"
ENTRY_SIGNALS = ["qx175_momentum_top1"]
EXIT_SIGNALS = ["qx175_rotation_exit"]
LOOKBACK_DAYS = 25
REQUIRED_FEATURES = ["close"]


def _pool_mask(symbols, pool):
    """按 market.symbols 构造 (A,) 布尔掩码。"""
    wanted = set(pool)
    return np.array([str(s) in wanted for s in symbols], dtype=bool)


def _moving_average(close, period):
    """只用 <= t 的收盘价，按 t 对齐，无未来函数。"""
    rows, cols = close.shape
    out = np.full((rows, cols), np.nan, dtype=np.float64)
    for t in range(period - 1, rows):
        out[t] = np.nanmean(close[t - period + 1:t + 1, :], axis=0)
    return out


class QX175EtfRotationMatrixStrategy:
    def required_fields(self) -> frozenset[str]:
        return frozenset({"close"})

    def required_warmup_bars(self, params: dict) -> int:
        return max(60, int(params.get("lookback_days", 25)) + 40)

    def compute_signals(self, market: MarketDataMatrix, params: dict) -> SignalMatrix:
        close = np.asarray(market.close, dtype=np.float64)
        rows, cols = close.shape
        symbols = list(market.symbols)

        lookback = int(params.get("lookback_days", 25))
        window = lookback + 1                      # 26 根收盘价做回归
        r2_min = float(params.get("r2_threshold", 0.35))
        buy_min = float(params.get("buy_min_score", 0.20))
        rank_max = float(params.get("rank_max_score", 10000.0))
        loss_limit = float(params.get("daily_loss_limit", 0.97))
        short_lb = int(params.get("short_lookback", 10))
        ma_period = int(params.get("trend_ma_period", 10))
        use_trend = bool(params.get("enable_trend_filter", True))
        use_regime = bool(params.get("enable_regime", True))
        a_need = int(params.get("a_weak_enter_count", 3))
        o_need = int(params.get("o_weak_enter_count", 2))

        price = np.where(np.isfinite(close) & (close > 0), close, np.nan)
        logp = np.where(np.isfinite(price), np.log(np.where(np.isfinite(price), price, 1.0)), np.nan)

        # ── 1. 加权对数线性回归: 年化收益 × 加权 R² ──────────────────────
        # 与原版一致: x=0..W-1, w=linspace(1,2,W), y=log(close)
        x = np.arange(window, dtype=np.float64)
        w = np.linspace(1.0, 2.0, window)
        sw = w.sum()
        sx = (w * x).sum()
        sxx = (w * x * x).sum()
        denom = sw * sxx - sx * sx
        wx = w * x

        score = np.zeros((rows, cols), dtype=np.float64)
        r2_all = np.zeros((rows, cols), dtype=np.float64)
        window_valid = np.zeros((rows, cols), dtype=bool)
        for t in range(window - 1, rows):
            y = logp[t - window + 1:t + 1, :]           # (W, A)
            valid = np.isfinite(y).all(axis=0)
            yc = np.where(np.isfinite(y), y, 0.0)
            sy = (yc * w[:, None]).sum(axis=0)
            sxy = (yc * wx[:, None]).sum(axis=0)
            slope = (sw * sxy - sx * sy) / denom
            intercept = (sy - slope * sx) / sw
            ybar = sy / sw
            fit = slope[None, :] * x[:, None] + intercept[None, :]
            ss_res = (w[:, None] * (yc - fit) ** 2).sum(axis=0)
            ss_tot = (w[:, None] * (yc - ybar[None, :]) ** 2).sum(axis=0)
            r2 = 1.0 - ss_res / np.maximum(ss_tot, 1e-12)
            annualized = np.exp(np.clip(slope * 250.0, -50.0, 50.0)) - 1.0
            s = annualized * np.clip(r2, 0.0, 1.0)
            score[t] = np.where(valid, np.nan_to_num(s, nan=0.0, posinf=0.0, neginf=0.0), 0.0)
            r2_all[t] = np.where(valid, r2, 0.0)
            window_valid[t] = valid

        # ── 2. 均线 (只用 <= t 数据) ─────────────────────────────────────
        ma5 = _moving_average(price, 5)
        ma10 = _moving_average(price, ma_period)

        # 近 3 日单日跌幅 / 短期动量 (按 t 对齐)
        def ratio(lag):
            out = np.ones((rows, cols), dtype=np.float64)
            if lag >= rows:
                return out
            prev = np.roll(price, lag, axis=0)
            with np.errstate(divide="ignore", invalid="ignore"):
                r = price / prev
            out[lag:] = np.where(np.isfinite(r[lag:]), r[lag:], 1.0)
            return out

        r1 = ratio(1)
        r2 = ratio(2)
        r3 = ratio(3)
        no_crash = (r1 >= loss_limit) & (r2 >= loss_limit) & (r3 >= loss_limit)
        short_ret = ratio(short_lb)
        short_ok = short_ret >= 1.0
        trend_ok = (price > ma10) & (ma5 > ma10)

        # ── 3. 双风险规避四格池 ──────────────────────────────────────────
        idx = {str(s): j for j, s in enumerate(symbols)}
        mask_all = _pool_mask(symbols, ALL_POOL)
        mask_overseas_commodity = _pool_mask(symbols, OVERSEAS_POOL + COMMODITY_POOL)
        mask_domestic_commodity = _pool_mask(symbols, DOMESTIC_POOL + COMMODITY_POOL)
        mask_commodity = _pool_mask(symbols, COMMODITY_POOL)

        a_weak = np.zeros(rows, dtype=bool)
        o_weak = np.zeros(rows, dtype=bool)
        if use_regime:
            for label, proxies, need, target in (
                ("a", A_SHARE_PROXIES, a_need, None),
                ("o", OVERSEAS_PROXIES, o_need, None),
            ):
                below = np.zeros(rows, dtype=np.float64)
                ma_weak = np.zeros(rows, dtype=np.float64)
                used = 0
                for code in proxies:
                    j = idx.get(code)
                    if j is None:
                        continue
                    used += 1
                    below += (price[:, j] < ma10[:, j]).astype(np.float64)
                    ma_weak += (ma5[:, j] < ma10[:, j]).astype(np.float64)
                if used:
                    hit = (below >= need) | (ma_weak >= need)
                    if label == "a":
                        a_weak = hit
                    else:
                        o_weak = hit

        pool_ok = np.where(
            (a_weak & o_weak)[:, None], mask_commodity[None, :],
            np.where(
                a_weak[:, None], mask_overseas_commodity[None, :],
                np.where(
                    o_weak[:, None], mask_domestic_commodity[None, :],
                    mask_all[None, :],
                ),
            ),
        )

        # ── 4. 候选过滤 + 每日取 top1 ────────────────────────────────────
        ok = (
            window_valid
            & (r2_all >= r2_min)
            & no_crash
            & short_ok
            & (score >= buy_min)
            & (score <= rank_max)
            & np.isfinite(price)
            & pool_ok
        )
        if use_trend:
            ok &= trend_ok

        rank_score = np.where(ok, score, -1.0)
        best = np.argmax(rank_score, axis=1)
        row_ids = np.arange(rows)
        has_pick = rank_score[row_ids, best] > 0.0

        entry = np.zeros((rows, cols), dtype=np.uint8)
        entry[row_ids[has_pick], best[has_pick]] = 1
        # 轮动退出必须覆盖「全部非当日目标」的标的, 不能只发
        # prev_entry & (1-entry)。回测按 T+1 开盘成交且有 max_positions
        # 限制, 引擎的实际持仓与策略「上一日 top1」会错位; 只给策略
        # 自己认为的昨日目标发 exit 时, 引擎实际持有的标的可能永远
        # 收不到卖信号 (实测: 一笔持仓卡了 194 个交易日直到 end)。
        # 回测引擎只对持仓标的消费 exit, 因此这里多出的信号不会影响
        # 交易正确性; 代价是扫描页会列出未选中标的的卖出候选。
        exit_ = (1 - entry).astype(np.uint8)

        score_out = np.clip(np.nan_to_num(score, nan=0.0, posinf=0.0, neginf=0.0), -1e6, 1e6)

        return make_signal_matrix(
            market.shape,
            entry=entry,
            exit=exit_,
            score=score_out.astype(np.float32),
            entry_signal_code=np.where(entry, 0, -1).astype(np.int16),
            exit_signal_code=np.where(exit_, 0, -1).astype(np.int16),
            entry_signal_ids=("qx175_momentum_top1",),
            exit_signal_ids=("qx175_rotation_exit",),
        )


MATRIX_STRATEGY = QX175EtfRotationMatrixStrategy()
