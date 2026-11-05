"""C07: PIT policy blocks look-back on latest/current state, not pure price."""
from bridge.pit import PITStore
from overrides.pit_policy import PITPolicy, is_pit_sensitive, ALLOW, BLOCK, attach


def store():
    s = PITStore()
    s.add_version('equity', '600031.SH', '2026-04-30', {'shares': 8_000_000_000})
    s.add_version('membership', '600031.SH', '2026-05-15', {'in_index': True})
    return s


def test_pure_price_study_is_not_false_flagged():
    pol = PITPolicy(store())
    v, d = pol.evaluate({'domain': 'price', 'symbol': '600031.SH',
                         'decision_at': '2024-01-01'})
    assert v == ALLOW
    assert is_pit_sensitive({'domain': 'price'}) is False


def test_equity_lookback_without_evidence_is_blocked():
    pol = PITPolicy(store())
    v, d = pol.evaluate({'domain': 'equity', 'symbol': '600031.SH',
                         'decision_at': '2024-01-01'})
    assert v == BLOCK
    assert 'look-back' in d['reason']


def test_equity_lookback_with_evidence_is_allowed():
    pol = PITPolicy(store())
    v, d = pol.evaluate({'domain': 'equity', 'symbol': '600031.SH',
                         'decision_at': '2026-06-01'})
    assert v == ALLOW
    assert d['served_available_at'] == '2026-04-30'


def test_membership_lookback_without_evidence_is_blocked():
    pol = PITPolicy(store())
    v, _ = pol.evaluate({'domain': 'membership', 'symbol': '600031.SH',
                         'decision_at': '2024-01-01'})
    assert v == BLOCK


def test_batch_reports_blocked_count():
    pol = PITPolicy(store())
    res = pol.evaluate_batch([
        {'domain': 'price', 'symbol': '600031.SH', 'decision_at': '2024-01-01'},
        {'domain': 'equity', 'symbol': '600031.SH', 'decision_at': '2024-01-01'},
        {'domain': 'membership', 'symbol': '600031.SH', 'decision_at': '2026-06-01'},
    ])
    assert res['blocked_count'] == 1
    assert res['all_allowed'] is False


def test_attach_without_upstream_is_safe_noop():
    status = attach(None)
    assert status['attached'] is False
    assert 'note' in status
