"""B01: realtime quote quality hierarchy and admission verdicts.

This is the single, testable definition of *what makes a realtime quote
admissible*. Three time layers are kept distinct and never conflated:

  - session date : proven by the TDX handshake (authoritative trading date)
  - event time   : the per-symbol HHMM(HHMMSS) clock on the quote record
  - observed_at  : when we pulled the snapshot (acquisition time, never quote time)

A quote is ADMITTED only when price/prev/volume are positive, the per-symbol
clock is present and within the last session boundary's freshness gate, and the
session date matches Beijing's date. Everything else is explicitly rejected
with a named verdict so the caller can fail closed instead of silently keeping
a halted, undated, cross-day or clock-skewed row.
"""
from __future__ import annotations

from datetime import datetime, timedelta, time as dt_time
from zoneinfo import ZoneInfo

CN = ZoneInfo('Asia/Shanghai')

# Beijing continuous-auction clock, in minutes since midnight. These are
# exchange session boundaries, NOT a trading-calendar authority: whether the
# date itself is a trading day is still proven by the TDX handshake date check.
MORNING_OPEN = 9 * 60 + 15
MORNING_CLOSE = 11 * 60 + 30
AFTERNOON_OPEN = 13 * 60
AFTERNOON_CLOSE = 15 * 60


def quote_session_state(dt):
    """Return (reference_minutes, phase, in_session) for a Beijing wall clock.

    ``reference_minutes`` is the last instant at which a fresh quote could
    legitimately have been produced. During the lunch break and after the close
    the exchange stops publishing, so comparing a per-symbol tick clock against
    the *wall clock* would wrongly reject the final morning / closing snapshot.
    Anchoring the freshness gate at the last session boundary keeps the final
    snapshot available while still excluding halted issues whose last tick is
    hours old. No calendar or future-session authority is implied here.
    """
    t = dt.hour * 60 + dt.minute
    if t < MORNING_OPEN:
        return None, 'BEFORE_SESSION', False
    if t <= MORNING_CLOSE:
        return t, 'MORNING_SESSION', True
    if t < AFTERNOON_OPEN:
        return MORNING_CLOSE, 'LUNCH_BREAK', False
    if t <= AFTERNOON_CLOSE:
        return t, 'AFTERNOON_SESSION', True
    return AFTERNOON_CLOSE, 'AFTER_CLOSE', False


def hhmm(minutes):
    return '%02d:%02d' % divmod(minutes, 60)


# Named admission verdicts. Only ADMITTED rows may become today's data.
ADMITTED = 'ADMITTED'
HALTED = 'HALTED_NO_PRICE_OR_VOLUME'
UNDATED = 'UNDATED_CLOCK'
BAD_CLOCK = 'MALFORMED_CLOCK'
STALE = 'STALE_PAST_SESSION_BOUNDARY'
CLOCK_SKEW = 'CLOCK_AHEAD_OF_SESSION'
CROSS_DAY = 'CROSS_DAY_SERVER_DATE_MISMATCH'
UNKNOWN_SESSION = 'SESSION_NOT_OPEN'


def admit_realtime(symbol, price, prev_close, volume, clock_raw, server_dt, max_lag_minutes=10):
    """Return (verdict, detail) for one realtime row against the handshake clock.

    ``server_dt`` is the authenticated TDX session datetime; ``clock_raw`` is the
    per-symbol HHMM integer (e.g. 113000). The verdict never invents an event
    time: a missing/implausible clock yields UNDATED/BAD_CLOCK, not admission.
    """
    if not price or price <= 0 or not prev_close or prev_close <= 0 or not volume or volume <= 0:
        return HALTED, {'symbol': symbol, 'price': price, 'prev_close': prev_close, 'volume': volume}
    if not isinstance(clock_raw, int) or clock_raw <= 0:
        return UNDATED, {'symbol': symbol, 'clock_raw': clock_raw}
    hh, mm = divmod(clock_raw // 10000, 100)
    if not (0 <= hh < 24 and 0 <= mm < 60):
        return BAD_CLOCK, {'symbol': symbol, 'clock_raw': clock_raw}
    reference, phase, in_session = quote_session_state(server_dt)
    if reference is None:
        return UNKNOWN_SESSION, {'symbol': symbol, 'session_phase': phase}
    minutes = hh * 60 + mm
    if minutes > reference + 2:
        return CLOCK_SKEW, {'symbol': symbol, 'minutes': minutes, 'reference': reference,
                            'session_phase': phase}
    if reference - minutes > max_lag_minutes:
        return STALE, {'symbol': symbol, 'minutes': minutes, 'reference': reference,
                       'wall_clock_lag_minutes': reference - minutes, 'session_phase': phase}
    return ADMITTED, {'symbol': symbol, 'minutes': minutes, 'reference': reference,
                     'session_phase': phase, 'in_session': in_session,
                     'quote_boundary_hhmm': hhmm(reference)}


def admit_depth(symbol, price, event_dt, session_dt, max_lag_minutes=10):
    """Return (verdict, detail) for one depth record.

    ``event_dt`` is the per-symbol HHMMSS combined with the handshake date; a row
    is rejected when undated or clock runs ahead of the session. Staleness is the
    only soft state (kept but labelled), because a five-level book is still a
    genuine observation from the final snapshot.
    """
    if not price or price <= 0:
        return HALTED, {'symbol': symbol, 'price': price}
    if event_dt is None:
        return UNDATED, {'symbol': symbol}
    if event_dt > session_dt + timedelta(minutes=5):
        return CLOCK_SKEW, {'symbol': symbol, 'event_dt': event_dt.isoformat()}
    lag = (session_dt - event_dt).total_seconds() / 60.0
    if lag > max_lag_minutes:
        return STALE, {'symbol': symbol, 'lag_minutes': round(lag, 2)}
    return ADMITTED, {'symbol': symbol, 'lag_minutes': round(lag, 2)}


def evidence_hierarchy():
    """Human-readable description of the three time layers and the gate."""
    return {
        'layers': {
            'session_date': 'TDX handshake server_date_1 == Beijing date; authoritative trading date',
            'event_time': 'per-symbol HHMM(HHMMSS) on the quote/depth record; never asserted as '
                          'second-level proof, retained as evidence',
            'observed_at': 'acquisition time; never presented as quote event time',
        },
        'admission': 'ADMITTED requires positive price/prev/volume, a present per-symbol clock, '
                     'and a clock within the last session boundary freshness gate',
        'rejections': [HALTED, UNDATED, BAD_CLOCK, STALE, CLOCK_SKEW, CROSS_DAY, UNKNOWN_SESSION],
        'fail_closed': True,
    }
