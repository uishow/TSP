"""Regression coverage for local index daily backfill."""
import sys
from datetime import date
from pathlib import Path

import polars as pl

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import backfill_index_daily as bi  # noqa: E402

SYMBOLS = ('000001.SH', '399001.SZ')


def _rows():
    out = []
    for day in ('2026-11-03', '2026-11-04'):
        for symbol in SYMBOLS:
            out.append({'symbol': symbol, 'date': day, 'open': 3600.0,
                        'high': 3700.0, 'low': 3590.0, 'close': 3680.0,
                        'volume': 1.0, 'amount': 2.0})
    return out


def _root(tmp_path):
    (tmp_path / '.env').write_text('TSP_BRIDGE_TOKEN=dummy\n')
    return tmp_path


def test_frame_for_aligns_partition_schema():
    frame = bi.frame_for(_rows(), date(2026, 11, 3))
    assert frame.height == 2
    assert dict(frame.schema) == bi.SCHEMA
    assert frame['date'].to_list() == [date(2026, 11, 3)] * 2
    assert frame['quote_ts'].null_count() == 2
    assert bi.frame_for(_rows(), date(2026, 10, 1)) is None


def test_dry_run_writes_nothing(tmp_path):
    root = _root(tmp_path)
    actions = bi.run(root, '2026-11-03', '2026-11-04', rows=_rows(), symbols=SYMBOLS)
    assert {a['action'] for a in actions} == {'would_write'}
    assert bi.session_count(root) == 0


def test_apply_writes_missing_sessions_and_is_idempotent(tmp_path):
    root = _root(tmp_path)
    first = bi.run(root, '2026-11-03', '2026-11-04', rows=_rows(),
                   apply=True, symbols=SYMBOLS)
    assert sum(1 for a in first if a['action'] == 'written') == 2
    assert bi.session_count(root) == 2
    part = root / 'data-local' / 'kline_index_daily' / 'date=2026-11-04' / 'part.parquet'
    stored = pl.read_parquet(part)
    assert dict(stored.schema) == bi.SCHEMA
    assert stored.height == 2 and stored['date'].dtype == pl.Date
    second = bi.run(root, '2026-11-03', '2026-11-04', rows=_rows(),
                    apply=True, symbols=SYMBOLS)
    assert all(a['action'] == 'skip_complete' for a in second)
    assert pl.read_parquet(part).height == 2
