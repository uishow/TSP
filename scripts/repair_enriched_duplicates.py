"""One-shot / repeatable repair for dirty kline_*_enriched partitions.

A previous full-market realtime refresh wrote duplicate (date, symbol) rows into
the derived enriched partitions. Those rows survive even after the source daily
partition is clean, because the incremental enriched path reads the previous
enriched frame as its recursion baseline. This tool backs up every affected
partition first, then rewrites it with one row per (date, symbol).

Usage:
    .venv/bin/python scripts/repair_enriched_duplicates.py            # repair all dates
    .venv/bin/python scripts/repair_enriched_duplicates.py 2026-11-04 # one date
    .venv/bin/python scripts/repair_enriched_duplicates.py --check    # report only
"""
from __future__ import annotations

import os
import sys
from datetime import datetime
from pathlib import Path

import polars as pl

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data-local'
TABLES = ('kline_daily_enriched', 'kline_etf_enriched', 'kline_index_enriched')


def key_columns(df: pl.DataFrame) -> list[str]:
    return ['date', 'symbol'] if 'date' in df.columns and 'symbol' in df.columns else ['symbol']


def inspect(path: Path) -> tuple[pl.DataFrame, list[str], int]:
    df = pl.read_parquet(path)
    keys = key_columns(df)
    if not all(k in df.columns for k in keys):
        return df, [], 0
    return df, keys, df.height - df.unique(subset=keys).height


def main(argv: list[str]) -> int:
    check_only = '--check' in argv
    dates = [a for a in argv if a != '--check']
    stamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    changed = 0
    for table in TABLES:
        base = DATA / table
        if not base.is_dir():
            continue
        partitions = sorted(p for p in base.glob('date=*/part.parquet') if p.is_file())
        for path in partitions:
            if dates and not any(path.parent.name == f'date={d}' for d in dates):
                continue
            df, keys, duplicates = inspect(path)
            if not duplicates:
                print(f'OK      {path.relative_to(ROOT)}: {df.height} rows, 0 duplicates')
                continue
            print(f'DIRTY   {path.relative_to(ROOT)}: {df.height} rows, {duplicates} duplicate {keys}')
            if check_only:
                continue
            backup_dir = base / '_backup'
            if not backup_dir.is_dir():
                backup_dir.mkdir()
            backup = backup_dir / f'{path.parent.name}-{stamp}.parquet'
            df.write_parquet(backup)
            clean = df.unique(subset=keys, keep='last', maintain_order=True).sort(keys)
            tmp = path.with_name('part.parquet.repair-tmp')
            clean.write_parquet(tmp)
            os.replace(tmp, path)
            print(f'FIXED   -> {clean.height} rows; backup {backup.relative_to(ROOT)}')
            changed += 1
    print(f'{"CHECK" if check_only else "REPAIR"} complete: {changed} partitions rewritten')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
