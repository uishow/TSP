#!/usr/bin/env python3
"""Backfill index daily bars from the LOCAL read-only bridge into date partitions.

``/api/overview/market`` derives index change_pct from the last two
``kline_index_daily`` sessions. With ``pipeline_pull_index`` disabled, only the
realtime-written current-day partition exists, so every index card shows "-".
This fills the missing sessions from the same local tdx_local_day source. No
vendor connection, no zero-fill, no overwrite of an existing complete partition.
"""
from __future__ import annotations

import argparse
import json
import os
import urllib.request
from datetime import date, timedelta
from pathlib import Path

import polars as pl

ROOT = Path(__file__).resolve().parents[1]
BRIDGE = 'http://127.0.0.1:7818'
SYMBOLS = ('000001.SH', '399001.SZ', '399006.SZ', '000680.SH')
SCHEMA = {'symbol': pl.String, 'close': pl.Float64, 'open': pl.Float64,
          'high': pl.Float64, 'low': pl.Float64, 'volume': pl.Float64,
          'amount': pl.Float64, 'quote_ts': pl.Int64, 'date': pl.Date}


def bridge_token(root: Path = ROOT) -> str:
    for line in (root / '.env').read_text(encoding='utf-8').splitlines():
        if line.startswith('TSP_BRIDGE_TOKEN='):
            return line.split('=', 1)[1].strip().strip('\'"')
    raise RuntimeError('TSP_BRIDGE_TOKEN missing from .env')


def fetch_rows(start: str, end: str, symbols=SYMBOLS, root: Path = ROOT,
               bridge: str = BRIDGE):
    payload = {'dataset': 'daily', 'symbols': list(symbols),
               'start_time': start, 'end_time': end, 'asset_type': 'index'}
    request = urllib.request.Request(
        bridge + '/query', data=json.dumps(payload).encode(),
        headers={'Content-Type': 'application/json',
                 'Authorization': 'Bearer ' + bridge_token(root)})
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open(request, timeout=60) as response:
        return json.load(response)['rows']


def frame_for(rows, day: date):
    selected = [r for r in rows if str(r.get('date'))[:10] == day.isoformat()]
    if not selected:
        return None
    return pl.DataFrame({
        'symbol': pl.Series([r.get('symbol') for r in selected], dtype=pl.String),
        'close': pl.Series([r.get('close') for r in selected], dtype=pl.Float64),
        'open': pl.Series([r.get('open') for r in selected], dtype=pl.Float64),
        'high': pl.Series([r.get('high') for r in selected], dtype=pl.Float64),
        'low': pl.Series([r.get('low') for r in selected], dtype=pl.Float64),
        'volume': pl.Series([r.get('volume') for r in selected], dtype=pl.Float64),
        'amount': pl.Series([r.get('amount') for r in selected], dtype=pl.Float64),
        'quote_ts': pl.Series([None] * len(selected), dtype=pl.Int64),
        'date': pl.Series([day] * len(selected), dtype=pl.Date),
    })


def session_count(root: Path = ROOT) -> int:
    target = root / 'data-local' / 'kline_index_daily'
    return sum(1 for p in target.glob('date=*')
               if p.is_dir() and (p / 'part.parquet').is_file())


def run(root: Path, start: str, end: str, rows=None, apply=False, symbols=SYMBOLS):
    rows = fetch_rows(start, end, symbols, root) if rows is None else rows
    days = sorted({date.fromisoformat(str(r['date'])[:10]) for r in rows})
    target = root / 'data-local' / 'kline_index_daily'
    actions = []
    for day in days:
        frame = frame_for(rows, day)
        if frame is None:
            continue
        part = target / f'date={day.isoformat()}' / 'part.parquet'
        existing = pl.read_parquet(part).height if part.is_file() else 0
        if existing >= frame.height:
            actions.append({'date': day.isoformat(), 'action': 'skip_complete',
                            'rows': existing})
            continue
        if not apply:
            actions.append({'date': day.isoformat(), 'action': 'would_write',
                            'rows': frame.height})
            continue
        part.parent.mkdir(parents=True, exist_ok=True)
        temporary = part.with_suffix('.parquet.tmp')
        frame.write_parquet(temporary)
        os.replace(temporary, part)
        actions.append({'date': day.isoformat(), 'action': 'written',
                        'rows': frame.height})
    return actions


def main():
    parser = argparse.ArgumentParser(description='Backfill local index daily sessions (dry run by default)')
    parser.add_argument('--root', default=str(ROOT))
    parser.add_argument('--start', default=(date.today() - timedelta(days=30)).isoformat())
    parser.add_argument('--end', default=date.today().isoformat())
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--json', action='store_true')
    args = parser.parse_args()
    actions = run(Path(args.root), args.start, args.end, apply=args.apply)
    if args.json:
        print(json.dumps(actions, ensure_ascii=False))
    else:
        for item in actions:
            print(item)
        print(f"partitions={session_count(Path(args.root))} "
              f"written={sum(1 for a in actions if a['action'] == 'written')} "
              f"skipped={sum(1 for a in actions if a['action'] == 'skip_complete')}")
        if not args.apply:
            print('DRY RUN: pass --apply to write')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
