"""B1/B2: fuyao recent disclosure dates are genuinely applied to the PIT system.

These tests assert that:
  * only ANNOUNCE_DATE_CANDIDATE rows become PIT evidence (backfill/conflict
    excluded);
  * recent (2026) decisions resolve to the verified disclosure date;
  * historical (2025-earlier) decisions are BLOCKED (no fabricated history);
  * the router exposes a real PIT financial query entry point.
"""
from datetime import date
from types import SimpleNamespace as N

from bridge.fuyao_pit import load_fuyao_pit, fuyao_pit_summary, CANDIDATE_QUALITY


def test_summary_reports_recent_only_enabled():
    s = fuyao_pit_summary()
    assert s['available'] is True
    assert s['state'] == 'ENABLED_RECENT_ONLY'
    # The verified set is large but strictly excludes back-filled/conflict rows.
    assert s['verified_recent_count'] >= 16000
    assert s['excluded_not_pit_count'] > 0
    by = s['by_quality']
    assert by.get(CANDIDATE_QUALITY, 0) == s['verified_recent_count']
    assert by.get('HISTORICAL_BACKFILL_SUSPECT', 0) > 0
    assert by.get('CROSS_TABLE_CONFLICT', 0) > 0


def test_only_candidate_rows_become_pit_evidence():
    ledger, store = load_fuyao_pit()
    cov = ledger.coverage()
    # Every ledger entry we loaded is verified (we only fed candidates).
    assert cov['ann_date_unknown'] == 0
    assert cov['ann_date_verified'] >= 16000
    # 000001.SZ 2025-12-31 is a known cross-table conflict -> NOT in ledger.
    e = ledger.entry('000001.SZ', '2025-12-31')
    assert e['ann_date_verified'] is False
    assert e['ann_date'] is None


def test_recent_decision_resolves_to_verified_disclosure():
    ledger, store = load_fuyao_pit()
    # 000001.SZ 2026-03-31 was disclosed 2026-04-25 (verified candidate).
    av = ledger.available_at('000001.SZ', '2026-03-31', '2026-05-01')
    assert av == '2026-04-25'
    # PIT store serves the latest version on/before the decision.
    served_av, payload = store.available_at_decision(
        'financial', '000001.SZ', '2026-05-01')
    assert served_av == '2026-04-25'
    assert payload['period_end'] == '2026-03-31'


def test_decision_before_disclosure_is_blocked():
    ledger, store = load_fuyao_pit()
    # Decision on 2026-04-01 is before the 2026-04-25 disclosure -> not available.
    av = ledger.available_at('000001.SZ', '2026-03-31', '2026-04-01')
    assert av is None
    served_av, payload = store.available_at_decision(
        'financial', '000001.SZ', '2026-04-01')
    assert served_av is None
    assert payload is None


def test_historical_decision_has_no_pit_evidence():
    ledger, store = load_fuyao_pit()
    # A 2025 period has no verified disclosure date -> strict backtest blocked.
    served_av, payload = store.available_at_decision(
        'financial', '000001.SZ', '2025-12-31')
    assert served_av is None


def test_router_query_financial_pit_allows_recent_blocks_history():
    from bridge.router import Router
    r = Router(local=object())  # dummy local; pit/fuyao read parquet directly
    # Recent decision -> ALLOW with the verified disclosure date.
    row, detail = r.query_financial_pit('000001.SZ', '2026-05-01', table='income')
    assert detail['verdict'] == 'ALLOW'
    assert detail['served_available_at'] == '2026-04-25'
    assert detail['period_end'] == '2026-03-31'
    # Historical decision -> BLOCK, never an anachronistic value.
    blocked_row, blocked_detail = r.query_financial_pit(
        '000001.SZ', '2025-06-01', table='income')
    assert blocked_row is None
    assert blocked_detail['verdict'] == 'BLOCK_NO_PIT_EVIDENCE'


def test_pit_policy_allows_recent_blocks_history():
    from overrides.pit_policy import PITPolicy
    _, store = load_fuyao_pit()
    pol = PITPolicy(store)
    allow_v, allow_d = pol.evaluate(
        {'domain': 'financial', 'symbol': '000001.SZ'}, decision_at='2026-05-01')
    assert allow_v == 'ALLOW'
    block_v, block_d = pol.evaluate(
        {'domain': 'financial', 'symbol': '000001.SZ'}, decision_at='2025-06-01')
    assert block_v == 'BLOCK_NO_PIT_EVIDENCE'
