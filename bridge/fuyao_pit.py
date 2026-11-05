"""B1 bridge: feed fuyao VERIFIED recent disclosure dates into the PIT system.

Only rows whose ``report_date_quality == 'ANNOUNCE_DATE_CANDIDATE'`` become PIT
evidence. That quality label (assigned by ``bridge/fuyao_offline.py``) already
means the three financial statements agree on the date AND the lag between
``period_end`` and ``report_date`` falls inside the statutory disclosure window
(10–130 days). Everything else — back-filled older periods (lag 389–479 days),
cross-table conflicts, missing dates — is EXCLUDED and never claimed as PIT.

Result: recent-period (2026) PIT backtests are honestly enabled; historical
(2025-earlier) disclosure dates remain unavailable and stay fail-closed. No
historical version is fabricated.
"""
from __future__ import annotations

from pathlib import Path

from .announcement_ledger import AnnouncementLedger
from .pit import PITStore

CANDIDATE_QUALITY = 'ANNOUNCE_DATE_CANDIDATE'
ROOT = Path(__file__).resolve().parents[1]
FUYAO_DIR = ROOT / 'data-local' / 'fuyao'
SOURCE = 'fuyao:3-statement-crosscheck'
SOURCE_VERSION = 'verified_recent_only'


def load_fuyao_pit(fuyao_dir=None):
    """Build (ledger, store) from fuyao's verified recent disclosure dates.

    Returns empty containers if the candidate parquet is absent. The store
    carries PIT versions for the ``financial`` domain; ``available_at`` equals
    the verified disclosure date, so a strict backtest can only see a report
    once it was actually public.
    """
    d = Path(fuyao_dir) if fuyao_dir else FUYAO_DIR
    import polars as pl

    cand_path = d / 'financial_announce_candidates.parquet'
    if not cand_path.is_file():
        return AnnouncementLedger(), PITStore()
    df = pl.read_parquet(cand_path)
    verified = df.filter(pl.col('report_date_quality') == CANDIDATE_QUALITY)
    records = []
    for r in verified.to_dicts():
        ann = r.get('announce_date_candidate')
        if not ann:
            continue
        period_end = r.get('period_end') or r.get('report_date')
        records.append({
            'symbol': r['symbol'],
            'period_end': period_end,
            'ann_date': ann,
            'report_date': r.get('report_date') or period_end,
            'source': SOURCE,
            'source_version': SOURCE_VERSION,
        })
    ledger = AnnouncementLedger(
        records=records, source=SOURCE, source_version=SOURCE_VERSION)
    store = PITStore()
    for r in records:
        store.add_version(
            'financial', r['symbol'], r['ann_date'],
            {'period_end': r['period_end'], 'report_date': r.get('report_date'),
             'announce_date': r['ann_date'], 'source': SOURCE},
        )
    return ledger, store


def fuyao_pit_summary(fuyao_dir=None):
    """Counts for ``/status``: verified (usable) vs excluded (not PIT)."""
    d = Path(fuyao_dir) if fuyao_dir else FUYAO_DIR
    import polars as pl

    cand_path = d / 'financial_announce_candidates.parquet'
    if not cand_path.is_file():
        return {'available': False, 'reason': 'no candidate parquet'}
    df = pl.read_parquet(cand_path)
    counts = df.group_by('report_date_quality').len().to_dicts()
    by_quality = {c['report_date_quality']: c['len'] for c in counts}
    verified = by_quality.get(CANDIDATE_QUALITY, 0)
    excluded = sum(v for k, v in by_quality.items() if k != CANDIDATE_QUALITY)
    return {
        'available': True,
        'state': 'ENABLED_RECENT_ONLY',
        'verified_recent_count': verified,
        'excluded_not_pit_count': excluded,
        'by_quality': by_quality,
        'coverage': 'RECENT_2026_DISCLOSURE_DATES_ONLY',
        'historical_disclosure_dates': 'UNAVAILABLE_BACKFILLED_OR_CONFLICT',
        'note': ('仅最近若干期(2026)经三表交叉验证、滞后在披露窗口内的披露日作为 PIT 证据；'
                 '2025 及更早被回填/冲突的行已排除，不进入 PIT。'),
    }
