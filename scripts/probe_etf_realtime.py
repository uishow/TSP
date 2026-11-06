#!/usr/bin/env python3
"""Shadow probe: observe host-bridge ETF realtime coverage WITHOUT touching TSP.

Why this exists
---------------
P5: TSP reports ``etf_symbol_count=0``. The root cause is NOT the
``realtime_pull_etf`` preference (that flag is only read on the unreachable
TickFlow branch in ``quote_service.py``). The local custom-source branch calls
``provider.get_realtime()`` with no symbols; the bridge then falls back to
``market_snapshot()``, which only asks eltdx for the ``沪深A股`` category.

An explicit-symbol ETF query does work, but every row currently comes back with
``stale=True`` and ``SOURCE_CLOCK_UNKNOWN``/missing timestamp. Such rows are
**observations only**: they must NOT be used to trigger intraday alerts, must
NOT be written into ``kline_etf_daily`` partitions, and must NOT be presented
as a verified realtime clock. Wiring them into the production realtime loop
would also overwrite the carefully maintained 52-symbol daily ETF partition.

So this script is deliberately READ-ONLY and OUT-OF-BAND. Use it during a
trading session to measure whether ETF coverage and clock provenance ever
become good enough to justify a real integration.

Usage
-----
    .venv/bin/python scripts/probe_etf_realtime.py
    .venv/bin/python scripts/probe_etf_realtime.py --date 2026-11-06 --limit 52

Exit codes: 0 = probe completed (regardless of data quality), 2 = request error.
Nothing is written; no TSP preference, config, or data file is modified.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BRIDGE = "http://127.0.0.1:7818"


def load_token() -> str:
    env_file = ROOT / ".env"
    token = os.environ.get("TSP_BRIDGE_TOKEN", "").strip()
    if not token and env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.startswith("TSP_BRIDGE_TOKEN="):
                token = line.split("=", 1)[1].strip().strip('"').strip("'")
                break
    if not token:
        raise SystemExit("TSP_BRIDGE_TOKEN not found (.env or environment)")
    return token


def load_symbols(date: str, limit: int) -> list[str]:
    """Read the strategy-pool symbols from the latest ETF daily partition."""
    try:
        import polars as pl
    except ImportError:
        raise SystemExit("polars required: use .venv/bin/python scripts/probe_etf_realtime.py")
    part = ROOT / "data-local" / "kline_etf_daily" / f"date={date}" / "part.parquet"
    if not part.exists():
        raise SystemExit(f"partition not found: {part}")
    syms = (
        pl.read_parquet(part)
        .select("symbol")
        .unique()
        .sort("symbol")["symbol"]
        .to_list()
    )
    syms = [str(s) for s in syms if s]
    return syms[:limit] if limit else syms


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--date", default="2026-11-06", help="ETF daily partition date (default: 2026-11-06)")
    ap.add_argument("--limit", type=int, default=52, help="max symbols (bridge hard limit 200)")
    ap.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    args = ap.parse_args()

    syms = load_symbols(args.date, args.limit)
    payload = {
        "dataset": "realtime",
        "symbols": syms,
        "asset_type": "etf",
        "latest_only": True,
        "freq": "1m",
        "table": "raw",
        "require_latest": False,
    }
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    req = urllib.request.Request(
        BRIDGE + "/query",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "Authorization": "Bearer " + load_token()},
        method="POST",
    )
    t0 = time.time()
    try:
        with opener.open(req, timeout=20) as resp:
            body = json.loads(resp.read())
            http = resp.status
    except urllib.error.HTTPError as exc:
        print(f"BRIDGE HTTP {exc.code}: {exc.read().decode()[:400]}", file=sys.stderr)
        return 2
    except Exception as exc:  # noqa: BLE001
        print(f"BRIDGE ERROR: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 2
    elapsed = round((time.time() - t0) * 1000, 1)

    rows = body.get("rows") or body.get("data") or []
    if isinstance(rows, dict):
        rows = rows.get("rows", [])
    if not isinstance(rows, list):
        rows = []

    def field(row, *names):
        for n in names:
            if n in row:
                return row[n]
        return None

    stale = Counter(str(field(r, "stale")) for r in rows)
    quality = Counter(str(field(r, "quality_flag", "quality", "clock_evidence")) for r in rows)
    with_ts = sum(1 for r in rows if field(r, "timestamp", "time", "datetime") not in (None, ""))
    symbols_seen = len({field(r, "symbol") for r in rows if field(r, "symbol")})

    summary = {
        "observation_only": True,
        "warning": "Rows are NOT verified realtime: do not use for alerts, do not write to partitions.",
        "date_partition": args.date,
        "requested_symbols": len(syms),
        "http": http,
        "elapsed_ms": elapsed,
        "rows": len(rows),
        "distinct_symbols": symbols_seen,
        "rows_with_timestamp": with_ts,
        "stale_distribution": dict(stale),
        "quality_distribution": dict(quality),
        "sample": rows[:3],
        "bridge_meta": {k: v for k, v in body.items() if k not in ("rows", "data")},
    }
    if args.json:
        print(json.dumps(summary, ensure_ascii=False, indent=2, default=str))
    else:
        print("=" * 68)
        print("ETF REALTIME SHADOW PROBE  ·  观察值 / 非定版 / 禁用于告警与落盘")
        print("=" * 68)
        print(f"  partition date      : {args.date}")
        print(f"  requested symbols   : {len(syms)}")
        print(f"  bridge HTTP / ms    : {http} / {elapsed}")
        print(f"  returned rows       : {len(rows)}  (distinct symbols {symbols_seen})")
        print(f"  rows with timestamp : {with_ts}")
        print(f"  stale distribution  : {dict(stale)}")
        print(f"  quality/clock       : {dict(quality)}")
        print(f"  sample              : {json.dumps(rows[:2], ensure_ascii=False, default=str)[:400]}")
        print("-" * 68)
        print("  判定：任一 stale=True 或 SOURCE_CLOCK_UNKNOWN 即不满足 B03 质量门。")
        print("  只有全部行具备可验证时钟证据、且盘中复测通过，才讨论接入生产实时链路。")
        print("  本脚本只读：未修改任何偏好、配置、分区或 TSP 运行时状态。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
