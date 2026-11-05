"""B03: realtime quality gate before native finalization.

The core property: a batch that mixes a fresh in-session row with a stale
halted row must NOT be cleared because its freshest timestamp looks fine. Every
row is judged on its own clock evidence and stale flag.
"""
from datetime import datetime
from zoneinfo import ZoneInfo

from overrides.realtime_quality import (
    gate_row, gate_batch, attach,
    GATE_ADMITTED, GATE_FLAG_INCOMPLETE, GATE_REJECT_PROVENANCE,
    GATE_REJECT_STALE, GATE_REJECT_MISSING,
)

CN = ZoneInfo('Asia/Shanghai')
SERVER = datetime(2026, 11, 5, 11, 29, tzinfo=CN).replace(tzinfo=None)


def fresh_realtime(symbol='600031.SH'):
    return {
        'symbol': symbol, 'clock_evidence': 'TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMM',
        'stale': False, 'freshness_reason': 'IN_SESSION',
        'session_phase': 'MORNING_SESSION', 'wall_clock_lag_minutes': 0,
    }


def lunch_final_snapshot(symbol='600031.SH'):
    return {
        'symbol': symbol, 'clock_evidence': 'TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMM',
        'stale': True, 'freshness_reason': 'LUNCH_BREAK_FINAL_SNAPSHOT',
        'session_phase': 'LUNCH_BREAK', 'wall_clock_lag_minutes': 30,
    }


def halted_stale_in_session(symbol='600031.SH'):
    # last tick hours old but reported as in-session with a stale flag.
    return {
        'symbol': symbol, 'clock_evidence': 'TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMM',
        'stale': True, 'freshness_reason': 'IN_SESSION',
        'session_phase': 'MORNING_SESSION', 'wall_clock_lag_minutes': 95,
    }


def bad_provenance(symbol='600031.SH'):
    return {
        'symbol': symbol, 'clock_evidence': 'DERIVED_FROM_OTHER_SYMBOL',
        'stale': False, 'freshness_reason': 'IN_SESSION',
    }


def depth_row(levels_complete=True, symbol='600031.SH'):
    base = {
        'symbol': symbol, 'clock_evidence': 'TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMMSS',
        'stale': False, 'freshness_reason': 'IN_SESSION',
        'bid_volumes': [1, 2, 3, 4, 5], 'ask_volumes': [1, 2, 3, 4, 5],
    }
    if not levels_complete:
        base['bid_volumes'] = [1, 2, 3]
        base['ask_volumes'] = [1, 2, 3]
    base['levels_complete'] = levels_complete
    return base


def test_fresh_realtime_admitted():
    v, _ = gate_row(fresh_realtime(), SERVER)
    assert v == GATE_ADMITTED


def test_lunch_final_snapshot_is_preserved_not_rejected():
    v, _ = gate_row(lunch_final_snapshot(), SERVER)
    assert v == GATE_ADMITTED  # legitimate final snapshot, keep with stale flag


def test_halted_stale_in_session_rejected():
    v, d = gate_row(halted_stale_in_session(), SERVER)
    assert v == GATE_REJECT_STALE
    assert d['wall_clock_lag_minutes'] == 95


def test_non_authentic_provenance_rejected():
    v, _ = gate_row(bad_provenance(), SERVER)
    assert v == GATE_REJECT_PROVENANCE


def test_incomplete_depth_is_flagged_but_kept():
    v, d = gate_row(depth_row(levels_complete=False), SERVER)
    assert v == GATE_FLAG_INCOMPLETE
    assert d['levels_complete'] is False


def test_complete_depth_admitted():
    v, _ = gate_row(depth_row(levels_complete=True), SERVER)
    assert v == GATE_ADMITTED


def test_mixed_batch_is_not_cleared_on_max_time_alone():
    rows = [fresh_realtime('600031.SH'), halted_stale_in_session('000001.SZ')]
    result = gate_batch(rows, SERVER)
    assert result['batch_passed'] is False
    assert result['counts']['rejected'] == 1
    assert result['counts']['admitted'] == 1  # the good row still survives


def test_all_good_batch_passes():
    rows = [fresh_realtime('600031.SH'), lunch_final_snapshot('000001.SZ'),
            depth_row(levels_complete=True, symbol='510300.SH')]
    result = gate_batch(rows, SERVER)
    assert result['batch_passed'] is True
    assert result['counts']['rejected'] == 0
    assert result['counts']['admitted'] == 3


def test_incomplete_levels_kept_but_batch_still_passes():
    rows = [fresh_realtime('600031.SH'), depth_row(levels_complete=False, symbol='510300.SH')]
    result = gate_batch(rows, SERVER)
    assert result['batch_passed'] is True
    assert result['counts']['flagged_incomplete'] == 1


def test_attach_without_upstream_is_safe_noop():
    status = attach(None)
    assert status['attached'] is False
    assert 'note' in status
