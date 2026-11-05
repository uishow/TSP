"""Full-market realtime routing: eltdx only, date-verified, fail-closed.

Tests use a fixed intra-session wall clock on TODAY's date, so the TDX
handshake date check stays valid no matter when the suite is executed.
"""
from datetime import datetime, timedelta
from types import SimpleNamespace as N
from unittest.mock import Mock
from zoneinfo import ZoneInfo

import pytest

from bridge.live_sources import LiveSources, LiveSourceError, quote_session_state
from bridge.router import Router

CN = ZoneInfo('Asia/Shanghai')
IN_SESSION = datetime.now(CN).replace(hour=10, minute=30, second=0, microsecond=0)


def handshake(at=None):
    at = at or IN_SESSION
    return N(server_datetime=at.replace(tzinfo=None), server_date_1=at.date())


def rank_row(code='sh600031', *, clock=None, volume=552044, price=18.67):
    # Default tick clock matches the fixed 10:30 session time.
    if clock is None:
        clock = 10301234
    raw = N(server_time_raw=clock, open_price=18.98, high_price=19.1, low_price=18.62)
    return N(full_code=code, name='三一重工', last_price=price, pre_close=18.84,
             change_pct=-0.9023, amount=1038068544.0, volume_hand=volume, raw=raw)


def source(rows, h=None, backend='eltdx'):
    client = N(session=N(handshake=lambda: h or handshake()),
               helpers=N(realtime_rank=lambda **kw: N(rows=tuple(rows))))
    return LiveSources(backend=backend, client_factory=lambda: client,
                       min_interval=0, retries=1)


def at(hour, minute):
    return datetime.now(CN).replace(hour=hour, minute=minute, second=0, microsecond=0)


# -- session boundary authority -------------------------------------------
def test_quote_session_state_anchors_breaks_at_the_last_boundary():
    assert quote_session_state(at(8, 30)) == (None, 'BEFORE_SESSION', False)
    assert quote_session_state(at(10, 30)) == (630, 'MORNING_SESSION', True)
    assert quote_session_state(at(12, 0)) == (690, 'LUNCH_BREAK', False)
    assert quote_session_state(at(14, 0)) == (840, 'AFTERNOON_SESSION', True)
    assert quote_session_state(at(15, 40)) == (900, 'AFTER_CLOSE', False)


# -- original contract regression -----------------------------------------
def test_units_clock_and_provenance():
    rows = [rank_row(), rank_row('sz000001', volume=0), rank_row('sh600000', clock=1)]
    out = source(rows).market_snapshot()
    assert len(out) == 1  # halted and stale clocks are excluded, never zero-filled
    r = out[0]
    assert r['symbol'] == '600031.SH' and r['source'] == 'eltdx:category_rank'
    assert r['change_pct'] == pytest.approx(-0.009023)  # upstream gives percent, TSP wants ratio
    assert r['volume'] == 552044 and r['amount'] == 1038068544.0
    assert r['open'] == 18.98 and r['high'] == 19.1 and r['low'] == 18.62
    assert isinstance(r['timestamp'], int) and r['timestamp'] > 1_700_000_000_000
    assert r['stale'] is False
    assert r['session_phase'] == 'MORNING_SESSION'
    assert r['freshness_reason'] == 'IN_SESSION'
    assert r['clock_evidence'] == 'TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMM'


def test_ranking_pagination_duplicates_are_deduplicated():
    # eltdx ranking pages overlap; duplicate (date,symbol) rows break MarketDataMatrix.
    out = source([rank_row(), rank_row()]).market_snapshot()
    assert len(out) == 1 and out[0]['symbol'] == '600031.SH'


def test_other_trading_date_is_refused():
    yesterday = datetime.now(CN) - timedelta(days=1)
    h = N(server_datetime=yesterday.replace(tzinfo=None), server_date_1=yesterday.date())
    with pytest.raises(LiveSourceError, match='server date'):
        source([rank_row()], h).market_snapshot()


def test_inconsistent_handshake_is_refused():
    now = datetime.now(CN)
    h = N(server_datetime=now.replace(tzinfo=None), server_date_1=now.date() - timedelta(days=1))
    with pytest.raises(LiveSourceError, match='consistent'):
        source([rank_row()], h).market_snapshot()


def test_all_unverifiable_rows_fail_loudly():
    with pytest.raises(LiveSourceError, match='no date-verified rows'):
        source([rank_row(volume=0)]).market_snapshot()


def test_before_session_still_fails_closed():
    with pytest.raises(LiveSourceError, match='before the opening session'):
        source([rank_row()], handshake(at(8, 30))).market_snapshot()


def test_axdata_cannot_supply_full_market():
    with pytest.raises(LiveSourceError, match='eltdx'):
        source([rank_row()], backend='axdata').market_snapshot()


# -- lunch break / after close: final snapshot must stay available ----------
def test_lunch_break_keeps_final_morning_snapshot_but_marks_it_stale():
    out = source([rank_row(clock=11301234)], handshake(at(12, 0))).market_snapshot()
    assert len(out) == 1
    r = out[0]
    assert r['session_phase'] == 'LUNCH_BREAK'
    assert r['quote_boundary_hhmm'] == '11:30'
    assert r['source_event_hhmm'] == '11:30'
    assert r['stale'] is True and r['wall_clock_lag_minutes'] == 30
    assert r['freshness_reason'] == 'LUNCH_BREAK_FINAL_SNAPSHOT'


def test_after_close_keeps_closing_snapshot_but_marks_it_stale():
    out = source([rank_row(clock=15001234)], handshake(at(15, 40))).market_snapshot()
    assert len(out) == 1
    assert out[0]['session_phase'] == 'AFTER_CLOSE'
    assert out[0]['quote_boundary_hhmm'] == '15:00'
    assert out[0]['freshness_reason'] == 'AFTER_HOURS_FINAL_SNAPSHOT'
    assert out[0]['stale'] is True


def test_halted_issue_from_previous_session_is_still_rejected():
    # A row whose last tick is 09:30 must not be revived as a 12:00 quote.
    with pytest.raises(LiveSourceError, match='no date-verified rows'):
        source([rank_row(clock=9301234)], handshake(at(12, 0))).market_snapshot()


def test_tick_clock_running_ahead_of_the_session_is_rejected():
    with pytest.raises(LiveSourceError, match='no date-verified rows'):
        source([rank_row(clock=13001234)], handshake(at(10, 30))).market_snapshot()


def test_router_sends_empty_symbols_to_market_snapshot():
    live = N(realtime=Mock(return_value=[{'symbol': '600031.SH'}]),
             market_snapshot=Mock(return_value=[{'symbol': '600031.SH',
                                                'clock_evidence': 'TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMM'}]))
    router = Router(local=N(), live=live)
    out = router.query('realtime')
    assert live.market_snapshot.called and not live.realtime.called
    assert out['metadata']['clock_evidence'] == 'TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMM'
    router.query('realtime', symbols=['600031.SH'])
    assert live.realtime.called
