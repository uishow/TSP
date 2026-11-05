"""A04: evidence-only trading calendar; no weekday guess, no future authority."""
from __future__ import annotations

import struct
from datetime import datetime

import pytest

from bridge.calendar import (
    AUTHORITY, TradingCalendar, completed_bar_bounds, expected_boundary,
    read_index_sessions,
)

# 11-05 (a Thursday) has no bar while 11-06 does: from this source alone a
# holiday and a missing bar are indistinguishable -> must stay UNKNOWN.
SESSIONS = ('2026-10-30', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-06')


def cal():
    return TradingCalendar(sessions=SESSIONS, source_path='/probe/index.day',
                           source_sha256='probe-hash')


def test_observed_day_is_the_only_positive_claim():
    c = cal()
    assert c.classify('2026-11-03')['state'] == 'OBSERVED_TRADING_DAY'
    assert c.is_observed_trading_day('2026-11-03')
    assert c.classify('2026-11-03')['trading_day'] is True


def test_weekday_without_a_bar_is_unknown_not_a_trading_day():
    # 2026-11-05 is a Thursday inside the coverage window but has no bar.
    result = cal().classify('2026-11-05')
    assert result['state'] == 'UNKNOWN_NOT_OBSERVED_IN_INDEX_HISTORY'
    assert result['trading_day'] is None
    assert 'holiday OR a missing bar' in result['reason']


def test_weekend_is_not_inferred_either():
    result = cal().classify('2026-10-31')
    assert result['trading_day'] is None
    assert result['state'] == 'UNKNOWN_NOT_OBSERVED_IN_INDEX_HISTORY'


def test_future_and_pre_coverage_dates_have_no_authority():
    c = cal()
    future = c.classify('2026-12-01')
    assert future['state'] == 'UNKNOWN_FUTURE_NO_AUTHORITY'
    assert 'future open-day authority' in future['reason']
    assert c.classify('1990-01-01')['state'] == 'UNKNOWN_BEFORE_COVERAGE'


def test_status_records_source_version_and_disabled_authorities():
    status = cal().status()
    assert status['authority'] == AUTHORITY
    assert status['source_sha256'] == 'probe-hash'
    assert status['first_session'] == '2026-10-30'
    assert status['last_session'] == '2026-11-06'
    assert status['session_count'] == 5
    assert status['weekday_rule_used'] is False
    assert status['holiday_authority'] is False
    assert status['future_open_day_authority'] is False


def test_missing_source_fails_closed():
    c = TradingCalendar(source_path='/definitely/not/here/index.day')
    assert c.sessions == frozenset()
    assert c.status()['available'] is False
    assert c.status()['load_error'] == 'LOCAL_INDEX_FILE_MISSING'
    assert c.classify('2026-11-04')['state'] == 'UNKNOWN_NO_AUTHORITY'
    assert c.last_observed_on_or_before('2026-11-04') is None


def test_binary_index_reader_and_content_hash(tmp_path):
    path = tmp_path / 'sh000001.day'
    payload = b''.join(struct.pack('<IIIIIfII', day, 100, 200, 50, 150, 1000.0, 10, 0)
                       for day in (20261102, 20261103, 20261104))
    path.write_bytes(payload)
    sessions, digest = read_index_sessions(path)
    assert sessions == frozenset({'2026-11-02', '2026-11-03', '2026-11-04'})
    assert len(digest) == 64
    loaded = TradingCalendar(source_path=path)
    assert loaded.status()['source_sha256'] == digest
    assert loaded.is_observed_trading_day('2026-11-04')
    with pytest.raises(ValueError):
        path.write_bytes(payload[:-3])
        read_index_sessions(path)


def test_completed_bar_bounds_match_a_share_sessions():
    from datetime import date
    day = date(2026, 11, 4)
    five = completed_bar_bounds(day, 5)
    assert len(five) == 48
    assert five[0].isoformat() == '2026-11-04T09:35:00'
    assert five[23].isoformat() == '2026-11-04T11:30:00'
    assert five[24].isoformat() == '2026-11-04T13:05:00'
    assert five[-1].isoformat() == '2026-11-04T15:00:00'
    assert len(completed_bar_bounds(day, 1)) == 240
    assert completed_bar_bounds(day, 60)[-1].isoformat() == '2026-11-04T15:00:00'


def test_expected_daily_boundary_before_and_after_close():
    c = cal()
    before = expected_boundary(datetime(2026, 11, 5, 8, 0), 'daily', c)
    assert before['boundary'] == '2026-11-04'
    assert before['boundary_kind'] == 'LAST_OBSERVED_COMPLETED_SESSION'
    assert before['calendar_verified'] is True
    after = expected_boundary(datetime(2026, 11, 4, 16, 0), 'daily', c)
    assert after['boundary'] == '2026-11-04'
    assert after['calendar_verified'] is True


def test_current_session_boundary_is_clock_derived_not_calendar_proven():
    c = cal()  # 2026-11-05 has no observed bar
    intraday = expected_boundary(datetime(2026, 11, 5, 10, 12), '5m', c)
    assert intraday['boundary'] == '2026-11-05T10:10:00'
    assert intraday['calendar_verified'] is False
    assert intraday['current_session_authority'] == 'FUTURE_DAY_AUTHORITY_ABSENT'
    lunch = expected_boundary(datetime(2026, 11, 5, 12, 0), '5m', c)
    assert lunch['boundary'] == '2026-11-05T11:30:00'
    premarket = expected_boundary(datetime(2026, 11, 5, 8, 0), '5m', c)
    assert premarket['boundary'] == '2026-11-04T15:00:00'
    with pytest.raises(ValueError):
        expected_boundary(datetime(2026, 11, 5, 10, 0), '2m', c)


def test_real_local_index_file_when_available():
    from bridge.tdx_local import TDXLocal
    tdx = TDXLocal()
    path = tdx.vipdoc / 'sh' / 'lday' / 'sh000001.day'
    if not path.is_file():
        pytest.skip('local TDX index file not available on this host')
    c = TradingCalendar(tdx=tdx)
    status = c.status()
    assert status['available'] and status['session_count'] > 1000
    assert c.is_observed_trading_day(status['last_session'])
    assert c.classify('2099-01-01')['state'] == 'UNKNOWN_FUTURE_NO_AUTHORITY'
