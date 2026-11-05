"""B01: realtime quote quality hierarchy and admission verdicts.

The per-symbol clock ``clock_raw`` is an 8-digit HHMMSS value as produced by the
TDX ``server_time_raw`` field (e.g. 11290000 == 11:29:00). ``admit_realtime``
derives HHMM via ``clock_raw // 10000``, so every fixture below uses the real
8-digit shape, never a 6-digit HHMM.
"""
from datetime import datetime
from zoneinfo import ZoneInfo
from bridge.quote_quality import (
    admit_realtime, admit_depth, evidence_hierarchy,
    ADMITTED, HALTED, UNDATED, BAD_CLOCK, STALE, CLOCK_SKEW, UNKNOWN_SESSION,
    quote_session_state,
)

CN = ZoneInfo('Asia/Shanghai')
# 2026-11-05 11:29 (morning session) and 11:50 (lunch break) and 09:05 (before open)
MORNING = datetime(2026, 11, 5, 11, 29, tzinfo=CN).replace(tzinfo=None)
LUNCH = datetime(2026, 11, 5, 11, 50, tzinfo=CN).replace(tzinfo=None)
PREOPEN = datetime(2026, 11, 5, 9, 5, tzinfo=CN).replace(tzinfo=None)


def test_session_state_boundaries():
    assert quote_session_state(MORNING) == (689, 'MORNING_SESSION', True)
    assert quote_session_state(LUNCH) == (690, 'LUNCH_BREAK', False)
    assert quote_session_state(PREOPEN) == (None, 'BEFORE_SESSION', False)


def test_admit_realtime_morning_in_session():
    # 11:29:00 tick during the 11:29 morning wall clock -> admissible.
    v, d = admit_realtime('600031.SH', 10.0, 9.8, 1000, 11290000, MORNING)
    assert v == ADMITTED
    assert d['session_phase'] == 'MORNING_SESSION'
    assert d['in_session'] is True


def test_admit_realtime_halted_zero_price_rejected():
    v, _ = admit_realtime('600031.SH', 0, 9.8, 1000, 11290000, MORNING)
    assert v == HALTED
    v, _ = admit_realtime('600031.SH', 10.0, 9.8, 0, 11290000, MORNING)
    assert v == HALTED


def test_admit_realtime_undated_clock_rejected():
    v, _ = admit_realtime('600031.SH', 10.0, 9.8, 1000, 0, MORNING)
    assert v == UNDATED
    v, _ = admit_realtime('600031.SH', 10.0, 9.8, 1000, None, MORNING)
    assert v == UNDATED


def test_admit_realtime_malformed_clock_rejected():
    v, _ = admit_realtime('600031.SH', 10.0, 9.8, 1000, 999999, MORNING)
    assert v == BAD_CLOCK


def test_admit_realtime_stale_past_boundary_rejected():
    # 11:00:00 tick during lunch (reference anchored at 11:30) -> 30 min lag -> STALE.
    v, d = admit_realtime('600031.SH', 10.0, 9.8, 1000, 11000000, LUNCH)
    assert v == STALE
    assert d['wall_clock_lag_minutes'] == 30


def test_admit_realtime_clock_ahead_of_session_rejected():
    # 11:35:00 tick during the 11:29 morning wall clock -> ahead -> CLOCK_SKEW.
    v, _ = admit_realtime('600031.SH', 10.0, 9.8, 1000, 11350000, MORNING)
    assert v == CLOCK_SKEW


def test_admit_realtime_before_open_rejected():
    v, _ = admit_realtime('600031.SH', 10.0, 9.8, 1000, 9050000, PREOPEN)
    assert v == UNKNOWN_SESSION


def test_admit_depth_stale_and_undated():
    from datetime import timedelta
    session = datetime(2026, 11, 5, 11, 50).replace(tzinfo=None)
    event = datetime(2026, 11, 5, 11, 29).replace(tzinfo=None)
    v, d = admit_depth('600031.SH', 10.0, event, session)
    assert v == STALE
    v, _ = admit_depth('600031.SH', 10.0, None, session)
    assert v == UNDATED


def test_evidence_hierarchy_describes_three_layers():
    h = evidence_hierarchy()
    assert 'session_date' in h['layers'] and 'event_time' in h['layers']
    assert h['fail_closed'] is True
    assert ADMITTED not in h['rejections']
