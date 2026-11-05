"""C06: PIT query refuses anachronistic and fabricated history."""
from bridge.pit import PITStore


def test_serves_only_versions_available_before_decision():
    s = PITStore()
    s.add_version('financial', '600031.SH', '2026-04-30', {'eps': 1.0})
    s.add_version('financial', '600031.SH', '2026-10-28', {'eps': 1.2})
    av, payload = s.available_at_decision('financial', '600031.SH', '2026-09-01')
    assert av == '2026-04-30'  # the later Q3 report is not yet published
    assert payload['eps'] == 1.0


def test_no_version_before_decision_fails_closed():
    s = PITStore()
    s.add_version('financial', '600031.SH', '2026-10-28', {'eps': 1.2})
    av, payload = s.available_at_decision('financial', '600031.SH', '2026-01-01')
    assert av is None and payload is None


def test_strict_backtest_flags_gap_and_records_rejection():
    s = PITStore()
    s.add_version('financial', '600031.SH', '2026-04-30', {'eps': 1.0})
    result = s.strict_backtest('financial', '600031.SH',
                               ['2026-01-01', '2026-03-01', '2026-09-01'])
    assert result['fully_covered'] is False
    # 2026-09-01 is served by the 2026-04-30 version; only the two dates before
    # any publication are genuine gaps.
    assert set(result['gaps']) == {'2026-01-01', '2026-03-01'}
    cov = s.rejection_coverage()
    assert cov['count'] == 2


def test_strict_backtest_fully_covered_when_evidence_exists():
    s = PITStore()
    s.add_version('financial', '600031.SH', '2026-01-15', {'eps': 0.9})
    s.add_version('financial', '600031.SH', '2026-04-30', {'eps': 1.0})
    result = s.strict_backtest('financial', '600031.SH',
                               ['2026-02-01', '2026-05-01'])
    assert result['fully_covered'] is True
    assert result['gaps'] == []


def test_add_version_rejects_missing_available_at():
    s = PITStore()
    try:
        s.add_version('financial', '600031.SH', None, {'eps': 1.0})
        assert False, 'expected ValueError'
    except ValueError:
        pass


def test_unknown_domain_rejected():
    s = PITStore()
    try:
        s.add_version('phantom', '600031.SH', '2026-01-01', {})
        assert False, 'expected ValueError'
    except ValueError:
        pass
