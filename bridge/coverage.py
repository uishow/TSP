"""D02: expected bar coverage and gap detection.

Given the daily bars a symbol actually has (which prove it was listed and traded
on those dates) and the minute bars we observed, this module reports how many
bars each session should contain and which are missing. Days the symbol was not
listed have no expectation at all; days with a daily bar but zero minute bars
are flagged SUSPENDED_OR_MISSING (undecidable between a real halt and a missing
file) rather than silently filled with zeros.

The session durations are exchange constants, not a trading-calendar authority.
Whether a date is a trading day is still proven by the A04 calendar elsewhere.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime, date

MORNING_OPEN = 9 * 60 + 30
MORNING_CLOSE = 11 * 60 + 30
AFTERNOON_OPEN = 13 * 60
AFTERNOON_CLOSE = 15 * 60


def _freq_minutes(freq):
    m = {'1m': 1, '5m': 5, '15m': 15, '30m': 30, '60m': 60}.get(freq)
    if m is None:
        raise ValueError('Unsupported frequency for coverage')
    return m


def session_bar_counts(freq):
    """Expected 1m/5m/... bars across both continuous-auction sessions."""
    m = _freq_minutes(freq)
    morning = (MORNING_CLOSE - MORNING_OPEN) // m
    afternoon = (AFTERNOON_CLOSE - AFTERNOON_OPEN) // m
    return {'morning': morning, 'afternoon': afternoon, 'total': morning + afternoon}


def _as_date(value):
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    s = str(value)[:10]
    return datetime.strptime(s, '%Y-%m-%d').date()


def daily_trading_dates(daily_bars):
    """Sorted set of dates for which a daily bar exists (proves listing + trade)."""
    return sorted({_as_date(r['date'] if 'date' in r else r['datetime']) for r in daily_bars})


def _group_minute_by_day(minute_bars, freq):
    out = defaultdict(set)
    for r in minute_bars:
        dt = _as_date(r['datetime'])
        # group by the full minute timestamp so two bars in different sessions
        # never collapse, and malformed HH:MM substrings never collide.
        out[dt].add(str(r.get('datetime')))
    return {d: len(s) for d, s in out.items()}


def coverage_report(symbol, freq, daily_bars, minute_bars):
    """Per-day expected vs observed counts; missing bars flagged, never filled.

    Returns a report with a per-day list and summary tallies. Days without a
    daily bar are not in scope (undecidable whether data should exist).
    """
    expected = session_bar_counts(freq)['total']
    trading = daily_trading_dates(daily_bars)
    observed = _group_minute_by_day(minute_bars, freq)
    per_day = []
    for d in trading:
        obs = observed.get(d, 0)
        gap = expected - obs
        if obs == 0:
            status = 'SUSPENDED_OR_MISSING'  # undecidable; flagged, not filled
        elif gap > 0:
            status = 'PARTIAL_GAP'
        else:
            status = 'COMPLETE'
        per_day.append({'date': d.isoformat(), 'expected': expected, 'observed': obs,
                        'gap': gap, 'status': status})
    gaps = [p for p in per_day if p['status'] != 'COMPLETE']
    return {
        'symbol': symbol,
        'freq': freq,
        'expected_per_session': expected,
        'trading_days_with_daily': len(trading),
        'days_complete': sum(1 for p in per_day if p['status'] == 'COMPLETE'),
        'days_partial': sum(1 for p in per_day if p['status'] == 'PARTIAL_GAP'),
        'days_missing': sum(1 for p in per_day if p['status'] == 'SUSPENDED_OR_MISSING'),
        'total_expected': expected * len(trading),
        'total_observed': sum(observed.get(d, 0) for d in trading),
        'zero_fill': False,
        'undecidable_excluded': True,
        'per_day': per_day,
    }
