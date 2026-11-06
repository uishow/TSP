"""把本机通达信 vipdoc 的 ETF .day 日线同步为 TSP 的 ETF parquet 分区。

用途: TSP 的 asset_type="etf" 策略依赖 kline_etf_daily / kline_etf_enriched，
      但本地部署默认没有这两处数据 (ETF 维表 instruments_etf 已有)。本脚本
      离线补齐, 不访问任何外网行情源。

两段式执行 (宿主机无 polars, 容器内无 vipdoc 挂载):

  1) 宿主机模式 — 解析 .day 二进制, 产出中间 CSV:
     python3 scripts/sync_etf_from_tdx.py --mode host

  2) 容器模式 — 读中间 CSV, 用 polars 写 parquet 分区:
     docker exec -i -e TSP_SOURCE_POLICY=0 tsp-local \
       /app/.venv/bin/python - --mode container < scripts/sync_etf_from_tdx.py

数据口径:
  - 价格: 通达信 ETF .day 的 OHLC 是 int, 单位 1/1000 元 (基金报价 3 位小数)。
  - amount: 元, 照抄。
  - volume: TSP 股票口径是"手"(amount / close / 100)。通达信 ETF 的 vol 字段
    在不同品种间单位不一致 (有的记"份"、有的记"手"), 故统一用
    amount / close / 100 反推, 保证与 amount 自洽。
  - 复权: 本地 adj_factor_etf 为空, 因此 close 与 raw_close 相同, 均为不复权价。
    ETF 分红除息日会留下价格跳空, 与聚宽 fq='pre' 的前复权价有差异。
  - 交易日集合: 取池内 ETF 自身 .day 记录的日期并集, 不再对齐股票的
    kline_daily/date=*。原因: 股票本地日线只从 2025-11-04 起, 对齐会把 ETF
    历史一起截断成 244 天, 导致 K 段稳健优化 / walk-forward 的前几段落在数据
    之前并报 "matrix parquet range contains no market data"。上限由 .day 自身
    决定 (最新交易日), 下限由 --start 控制, 默认 2020-01-01 (约 1657 个交易日,
    足够覆盖 3~5 年区间 + 65 根预热); 可用 --start 2005-01-01 补全量。
  - source = tdx_local, 与 instruments_etf.parquet 的来源标注一致。

 parquet 列严格对齐现有股票样本的 schema (2026-11-05 实测)。
"""
from __future__ import annotations

import argparse
import csv
import os
import re
import struct
import sys
from pathlib import Path

TDX_ROOT = Path(
    "/Users/beryllewis/Library/Application Support/CrossOver/Bottles/"
    "通达信/drive_c/tdx-new/vipdoc"
)
PROJECT = Path(__file__).resolve().parent.parent
DATA = PROJECT / "data-local"
STAGING = DATA / "etf_import_staging" / "rows.csv"
STRATEGY = DATA / "strategies" / "custom" / "custom_qx175_etf_rotation.py"

# 容器内路径 (两段式执行时由容器模式使用)
CONTAINER_STAGING = Path("/app/data/etf_import_staging/rows.csv")
CONTAINER_DATA = Path("/app/data")

RECORD = struct.Struct("<IIIIIfII")  # date, open, high, low, close, amount, volume, reserved


def pool_symbols() -> list[str]:
    """从策略文件读取 ETF 池; 若策略不存在, 回退读 instruments_etf 全表。"""
    if STRATEGY.exists():
        src = STRATEGY.read_text(encoding="utf-8")
        out: list[str] = []
        for name in ("OVERSEAS_POOL", "COMMODITY_POOL", "DOMESTIC_POOL"):
            m = re.search(name + r"\s*=\s*\[(.*?)\]", src, re.S)
            if m:
                out += re.findall(r'"(\d{6}\.(?:SH|SZ))"', m.group(1))
        # 风险代理也一并纳入 (可能不在三组池里)
        for name in ("A_SHARE_PROXIES", "OVERSEAS_PROXIES"):
            m = re.search(name + r"\s*=\s*\[(.*?)\]", src, re.S)
            if m:
                out += re.findall(r'"(\d{6}\.(?:SH|SZ))"', m.group(1))
        return sorted(set(out))
    raise FileNotFoundError(f"找不到策略文件: {STRATEGY}")


def trading_days(wanted: list[str], start_floor: str) -> set[str]:
    """取池内 ETF .day 的日期并集 (YYYYMMDD), 下限为 start_floor。

    不再以股票 kline_daily 分区为基准: 那只覆盖 2025-11-04 起, 会把 ETF 的
    可用历史一起截短。ETF 自身的 .day 就是 A 股交易日日历, 无需外部对齐。
    """
    floor = start_floor.replace("-", "")
    if len(floor) != 8 or not floor.isdigit():
        raise ValueError(f"--start 必须是 YYYY-MM-DD: {start_floor}")
    days: set[str] = set()
    for sym in wanted:
        code, ex = sym.split(".")
        prefix = "sh" if ex == "SH" else "sz"
        path = TDX_ROOT / prefix / "lday" / f"{prefix}{code}.day"
        if not path.exists():
            continue
        raw = path.read_bytes()
        for i in range(len(raw) // RECORD.size):
            d, o, h, l, c, _amt, _vol, _res = RECORD.unpack_from(raw, i * RECORD.size)
            key = str(d)
            if key >= floor and min(o, h, l, c) > 0:
                days.add(key)
    if not days:
        raise RuntimeError("ETF .day 未解析出任何交易日, 拒绝写入")
    return days


def host_mode(start_floor: str = "2020-01-01") -> None:
    wanted = pool_symbols()
    days = trading_days(wanted, start_floor)
    day_keys = days
    STAGING.parent.mkdir(parents=True, exist_ok=True)

    rows: list[dict] = []
    missing: list[str] = []
    per_symbol: dict[str, int] = {}
    for sym in wanted:
        code, ex = sym.split(".")
        prefix = "sh" if ex == "SH" else "sz"
        path = TDX_ROOT / prefix / "lday" / f"{prefix}{code}.day"
        if not path.exists():
            missing.append(sym)
            continue
        raw = path.read_bytes()
        n = len(raw) // RECORD.size
        series: list[tuple[str, float, float, float, float, float]] = []
        for i in range(n):
            d, o, h, l, c, amt, _vol, _res = RECORD.unpack_from(raw, i * RECORD.size)
            key = str(d)
            if key not in day_keys or min(o, h, l, c) <= 0:
                continue
            iso = f"{key[:4]}-{key[4:6]}-{key[6:]}"
            close = c / 1000.0
            # volume = 手数, 与 TSP 股票口径一致
            volume = (amt / close / 100.0) if (amt > 0 and close > 0) else 0.0
            series.append((iso, o / 1000.0, h / 1000.0, l / 1000.0, close, amt, volume))
        series.sort(key=lambda r: r[0])
        prev_close = None
        for iso, o, h, l, c, amt, volume in series:
            pre = prev_close if prev_close is not None else c
            chg = (c / pre - 1.0) if pre > 0 else 0.0
            rows.append({
                "symbol": sym, "date": iso,
                "open": f"{o:.6f}", "high": f"{h:.6f}",
                "low": f"{l:.6f}", "close": f"{c:.6f}",
                "volume": f"{volume:.2f}", "amount": f"{amt:.2f}",
                "pre_close": f"{pre:.6f}", "change_pct": f"{chg:.6f}",
            })
            prev_close = c
        per_symbol[sym] = len(series)

    with STAGING.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "symbol", "date", "open", "high", "low", "close",
            "volume", "amount", "pre_close", "change_pct",
        ])
        writer.writeheader()
        writer.writerows(rows)

    print(f"[host] 池标的 {len(wanted)} 只, 缺失 {len(missing)}: {missing}")
    print(f"[host] 交易日 {len(days)} 天, 输出 {len(rows)} 行 -> {STAGING}")
    zero = [s for s, n in per_symbol.items() if n == 0]
    print(f"[host] 有效标的 {sum(1 for n in per_symbol.values() if n)} / {len(per_symbol)}"
          + (f", 零行: {zero}" if zero else ""))


def container_mode() -> None:
    import datetime as dt

    import polars as pl

    if not CONTAINER_STAGING.exists():
        raise FileNotFoundError(f"中间文件不存在: {CONTAINER_STAGING}")
    df = pl.read_csv(
        CONTAINER_STAGING,
        schema_overrides={
            "symbol": pl.Utf8, "date": pl.Utf8,
            "open": pl.Float64, "high": pl.Float64, "low": pl.Float64,
            "close": pl.Float64, "volume": pl.Float64, "amount": pl.Float64,
            "pre_close": pl.Float64, "change_pct": pl.Float64,
        },
    )
    if df.is_empty():
        raise RuntimeError("中间 CSV 为空, 拒绝写入")
    df = df.with_columns(pl.col("date").str.to_date("%Y-%m-%d"))

    daily_dir = CONTAINER_DATA / "kline_etf_daily"
    enriched_dir = CONTAINER_DATA / "kline_etf_enriched"
    daily_dir.mkdir(parents=True, exist_ok=True)
    enriched_dir.mkdir(parents=True, exist_ok=True)

    dates = sorted(df["date"].unique().to_list())
    written = 0
    for d in dates:
        part = df.filter(pl.col("date") == d)
        tag = d.isoformat()

        daily = part.select(
            pl.col("symbol"),
            pl.col("close"), pl.col("open"), pl.col("high"), pl.col("low"),
            pl.col("volume"), pl.col("amount"),
            pl.lit(None, dtype=pl.Int64).alias("quote_ts"),
            pl.col("date"),
            pl.lit("etf", dtype=pl.Utf8).alias("asset_type"),
            pl.lit("tdx_local", dtype=pl.Utf8).alias("source"),
            pl.col("pre_close"), pl.col("change_pct"),
        ).sort("symbol")

        enriched = part.select(
            pl.col("symbol"), pl.col("date"),
            pl.col("open"), pl.col("high"), pl.col("low"), pl.col("close"),
            pl.col("volume"), pl.col("amount"),
            pl.col("close").alias("raw_close"),
            pl.col("high").alias("raw_high"),
            pl.col("low").alias("raw_low"),
            pl.lit(None, dtype=pl.Float64).alias("turnover_rate"),
            pl.lit(0, dtype=pl.UInt32).alias("consecutive_limit_ups"),
            pl.lit(0, dtype=pl.UInt32).alias("consecutive_limit_downs"),
            pl.lit(None, dtype=pl.Int64).alias("quote_ts"),
        ).sort("symbol")

        for root, frame in ((daily_dir, daily), (enriched_dir, enriched)):
            out = root / f"date={tag}"
            out.mkdir(parents=True, exist_ok=True)
            frame.write_parquet(out / "part.parquet", compression="zstd")
        written += 1

    print(f"[container] 写入 {written} 个日期分区, {df.height} 行")
    print(f"[container] daily schema: {daily.schema}")
    print(f"[container] enriched schema: {enriched.schema}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["host", "container"], default="host")
    parser.add_argument(
        "--start", default="2020-01-01",
        help="ETF 历史起始下限 YYYY-MM-DD (仅 host 模式), 默认 2020-01-01",
    )
    args = parser.parse_args()
    if args.mode == "host":
        host_mode(args.start)
    else:
        container_mode()


if __name__ == "__main__":
    main()
