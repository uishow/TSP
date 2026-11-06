"""把盘后管道写入的全市场 ETF 分区收敛回策略池口径。

问题
----
``scripts/sync_etf_from_tdx.py`` 写的 1656 个历史分区只含策略池 52 只 ETF
（从本机通达信 ``.day`` 解析，15 列 schema）。但 TSP 原生 ``sync_index``
阶段会把当日**全市场 1821 只** ETF upsert 进同一张表，于是最近一两个分区
突然变成 1693~1694 行、列还和 history 不同：

- 矩阵列轴从 52 膨胀到 1695，``/api/strategies/run`` 的
  ``exit_signal_hits`` 刷出 1695 条噪音（``exit = 1 - entry``）；
- 池内 2 只 LOF（``161226.SZ`` / ``501018.SH``）反而不在管道写的全量里。

策略只读池内标的，全市场 ETF 当日行对它没有贡献，却破坏了口径一致性。

做法
----
在 ``daily_pipeline.run_now`` 返回后（成功或部分失败都执行）扫描
``kline_etf_enriched/date=*``，凡含**非池内 symbol** 的分区即用桥接
``/query`` 重新取策略池当日日线，按历史分区的 13/15 列 schema 重写
``kline_etf_daily`` 与 ``kline_etf_enriched``。桥接运行在宿主机、能读
TDX vipdoc，且 ``source_policy`` 已白名单 ``host.docker.internal:7818``，
所以不需要把 TDX 目录挂进容器。

- 判定条件刻意只用「存在非池内 symbol」：历史早期年份部分池内 ETF 尚未
  上市，symbol 数天然少于 52，绝不能拿 POOL 差集去重写，否则会灌入不存在
  的行情。
- 每个被改写的分区先备份到
  ``data-local/integrity_backups/etf_converge_<时间戳>/``，可完整还原。
- ``volume`` 沿用历史口径 ``amount / close / 100``（手），
  ``pre_close`` 取前一交易日该 symbol 的收盘价，与同步脚本一致。
- 收敛是 best-effort：任何异常只记 WARNING，不影响管道本身的结果。

可独立执行（重启后立刻收敛、不必等下一次管道）::

    docker exec -i tsp-local /app/.venv/bin/python -m overrides.etf_universe_converge
"""
from __future__ import annotations

import datetime as dt
import functools
import json
import logging
import os
import re
import shutil
import urllib.request
from pathlib import Path

log = logging.getLogger(__name__)

DATA_DIR = Path(os.environ.get("DATA_DIR", "/app/data"))
STRATEGY = DATA_DIR / "strategies" / "custom" / "custom_qx175_etf_rotation.py"
BRIDGE_URL = "http://host.docker.internal:7818/query"
POOL_NAMES = (
    "OVERSEAS_POOL", "COMMODITY_POOL", "DOMESTIC_POOL",
    "A_SHARE_PROXIES", "OVERSEAS_PROXIES",
)
MAX_PARTITIONS_PER_RUN = 10


def pool_symbols() -> set[str]:
    src = STRATEGY.read_text(encoding="utf-8")
    out: set[str] = set()
    for name in POOL_NAMES:
        m = re.search(name + r"\s*=\s*\[(.*?)\]", src, re.S)
        if m:
            out.update(re.findall(r'"(\d{6}\.(?:SH|SZ))"', m.group(1)))
    if not out:
        raise RuntimeError(f"无法从 {STRATEGY} 解析策略池")
    return out


def _bridge_rows(symbols: list[str], day: str) -> list[dict]:
    token = os.environ.get("TSP_BRIDGE_TOKEN") or ""
    payload = json.dumps({
        "dataset": "daily",
        "asset_type": "etf",
        "symbols": symbols,
        "start_time": day,
        "end_time": day,
    }).encode()
    req = urllib.request.Request(
        BRIDGE_URL,
        data=payload,
        headers={"Content-Type": "application/json", "Authorization": "Bearer " + token},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.load(resp)
    rows = [r for r in (data.get("rows") or []) if r.get("symbol") in symbols]
    return rows


def _partition_dirs(table: str) -> dict[str, Path]:
    root = DATA_DIR / table
    return {
        p.name[5:]: p
        for p in root.glob("date=*")
        if p.is_dir() and p.name.startswith("date=")
    }


def _offending_dates(pool: set[str]) -> list[str]:
    """只挑含非池内 symbol 的分区（即被管道写过全量的日期）。"""
    import polars as pl

    bad: list[str] = []
    for day, path in sorted(_partition_dirs("kline_etf_enriched").items()):
        part = path / "part.parquet"
        if not part.exists():
            continue
        syms = set(pl.read_parquet(part).select("symbol")["symbol"].to_list())
        if syms - pool:
            bad.append(day)
    return bad[:MAX_PARTITIONS_PER_RUN]


def _prev_close_map(day: str) -> dict[str, float]:
    import polars as pl

    dirs = _partition_dirs("kline_etf_daily")
    earlier = [d for d in sorted(dirs) if d < day]
    if not earlier:
        return {}
    part = dirs[earlier[-1]] / "part.parquet"
    if not part.exists():
        return {}
    df = pl.read_parquet(part).select(["symbol", "close"])
    return dict(zip(df["symbol"].to_list(), df["close"].to_list()))


def _schemas():
    import polars as pl

    daily = {
        "symbol": pl.Utf8, "close": pl.Float64, "open": pl.Float64,
        "high": pl.Float64, "low": pl.Float64, "volume": pl.Float64,
        "amount": pl.Float64, "quote_ts": pl.Int64, "date": pl.Date,
        "asset_type": pl.Utf8, "source": pl.Utf8,
        "pre_close": pl.Float64, "change_pct": pl.Float64,
    }
    enriched = {
        "symbol": pl.Utf8, "date": pl.Date, "open": pl.Float64,
        "high": pl.Float64, "low": pl.Float64, "close": pl.Float64,
        "volume": pl.Float64, "amount": pl.Float64,
        "raw_close": pl.Float64, "raw_high": pl.Float64, "raw_low": pl.Float64,
        "turnover_rate": pl.Float64,
        "consecutive_limit_ups": pl.UInt32, "consecutive_limit_downs": pl.UInt32,
        "quote_ts": pl.Int64,
    }
    return daily, enriched


def _frames(rows: list[dict], day: str, prev_close: dict[str, float]):
    import polars as pl

    daily_schema, enriched_schema = _schemas()
    d = dt.date.fromisoformat(day)
    drows, erows = [], []
    for r in rows:
        sym = r["symbol"]
        o, h, l, c = (float(r[k]) for k in ("open", "high", "low", "close"))
        amt = float(r.get("amount") or 0.0)
        vol = (amt / c / 100.0) if (amt > 0 and c > 0) else 0.0
        pre = prev_close.get(sym)
        if pre is None or pre <= 0:
            pre = o
        chg = (c / pre - 1.0) if pre > 0 else 0.0
        drows.append({
            "symbol": sym, "close": c, "open": o, "high": h, "low": l,
            "volume": vol, "amount": amt, "quote_ts": None, "date": d,
            "asset_type": "etf", "source": "tdx_local",
            "pre_close": pre, "change_pct": chg,
        })
        erows.append({
            "symbol": sym, "date": d, "open": o, "high": h, "low": l, "close": c,
            "volume": vol, "amount": amt,
            "raw_close": c, "raw_high": h, "raw_low": l,
            "turnover_rate": None, "consecutive_limit_ups": 0,
            "consecutive_limit_downs": 0, "quote_ts": None,
        })
    daily = pl.from_dicts(drows, schema=daily_schema).sort("symbol")
    enriched = pl.from_dicts(erows, schema=enriched_schema).sort("symbol")
    return daily, enriched


def converge(*, dry_run: bool = False) -> dict:
    """把含非池内 symbol 的分区收敛回策略池口径，返回统计。"""
    pool = pool_symbols()
    dates = _offending_dates(pool)
    stats = {"pool": len(pool), "dates": dates, "rewritten": [], "backup": None}
    if not dates or dry_run:
        return stats

    stamp = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_root = DATA_DIR / "integrity_backups" / f"etf_converge_{stamp}"
    backup_root.mkdir(parents=True, exist_ok=True)
    stats["backup"] = str(backup_root)

    for day in dates:
        rows = _bridge_rows(sorted(pool), day)
        if not rows:
            log.warning("ETF_CONVERGE: %s 桥接无数据，跳过该分区", day)
            continue
        daily, enriched = _frames(rows, day, _prev_close_map(day))
        for table, frame in (("kline_etf_daily", daily), ("kline_etf_enriched", enriched)):
            part = DATA_DIR / table / f"date={day}" / "part.parquet"
            if not part.exists():
                continue
            dst = backup_root / table / f"date={day}"
            dst.mkdir(parents=True, exist_ok=True)
            shutil.copy2(part, dst / "part.parquet")
            frame.write_parquet(part, compression="zstd")
        stats["rewritten"].append({"date": day, "rows": len(rows)})
        log.warning("ETF_CONVERGE: %s -> %d 行（策略池 %d 只）", day, len(rows), len(pool))
    return stats


def install() -> None:
    """包装 run_now，管道结束后自动收敛（best-effort）。"""
    from app.jobs import daily_pipeline

    previous = daily_pipeline.run_now
    if getattr(previous, "_tsp_etf_converge_wrapped", False):
        return

    @functools.wraps(previous)
    def wrapper(*args, **kwargs):
        try:
            return previous(*args, **kwargs)
        finally:
            try:
                result = converge()
                log.warning("ETF_UNIVERSE_CONVERGE: %s", json.dumps(result, ensure_ascii=False))
            except Exception as exc:  # noqa: BLE001 — 收敛失败不能拖垮管道
                log.warning("ETF_UNIVERSE_CONVERGE failed (soft): %s", exc)

    wrapper._tsp_etf_converge_wrapped = True
    daily_pipeline.run_now = wrapper
    log.warning("ETF_UNIVERSE_CONVERGE: post-pipeline hook installed")


if __name__ == "__main__":
    logging.basicConfig(level=logging.WARNING)
    print(json.dumps(converge(), ensure_ascii=False, indent=2))
