"""Trading-calendar evidence derived ONLY from locally observed index bars.

A04 design boundary (deliberately strict):

* A date is called a trading day only when a **local TDX index daily bar**
  proves it happened. There is no weekday heuristic, no holiday table and no
  vendor calendar.
* A date with no observed bar is UNKNOWN, never "non-trading day" and never
  "trading day": a holiday and a missing bar are indistinguishable from this
  source alone.
* Dates after the last observed session have **no open-day authority at all**.
  Nothing in this module predicts whether a future date will be a session.
* The authority label, source path, content hash and coverage window are kept
  so downstream code can prove what it relied on.

This module never opens a socket and never writes to source data.
"""
from __future__ import annotations

import hashlib
import struct
from datetime import date, datetime, time, timedelta
from pathlib import Path

AUTHORITY = 'LOCAL_TDX_INDEX_OBSERVED_BARS_ONLY'
INDEX_FILE = Path('sh') / 'lday' / 'sh000001.day'
OPEN_MORNING, CLOSE_MORNING = time(9, 30), time(11, 30)
OPEN_AFTERNOON, CLOSE_AFTERNOON = time(13, 0), time(15, 0)
MINUTE_FREQS = {'1m': 1, '5m': 5, '15m': 15, '30m': 30, '60m': 60}


def _as_date(value):
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    text = str(value)[:10]
    return date.fromisoformat(text)


def read_index_sessions(path):
    """Return (frozenset of ISO dates, sha256 of the exact source bytes)."""
    sessions = set()
    digest = hashlib.sha256()
    with Path(path).open('rb') as fh:
        while chunk := fh.read(32):
            digest.update(chunk)
            if len(chunk) != 32:
                raise ValueError('truncated TDX daily bar file: %s' % path)
            raw_day = struct.unpack_from('<I', chunk)[0]
            try:
                sessions.add(datetime.strptime(str(raw_day), '%Y%m%d').date().isoformat())
            except ValueError:
                continue  # an unparseable date is not evidence of a session
    return frozenset(sessions), digest.hexdigest()


class TradingCalendar:
    def __init__(self, tdx=None, sessions=None, source_path=None, source_sha256=None):
        self._tdx = tdx
        self._sessions = frozenset(sessions) if sessions is not None else None
        self._source_path = Path(source_path) if source_path else None
        self._source_sha256 = source_sha256
        self._load_error = None

    def _load(self):
        if self._sessions is not None:
            return
        try:
            if self._tdx is None:
                from .tdx_local import TDXLocal
                self._tdx = TDXLocal()
            path = self._source_path or (Path(self._tdx.vipdoc) / INDEX_FILE)
            if not path.is_file():
                self._source_path = path
                self._sessions = frozenset()
                self._load_error = 'LOCAL_INDEX_FILE_MISSING'
                return
            sessions, digest = read_index_sessions(path)
            self._source_path = path
            self._source_sha256 = digest
            self._sessions = sessions
        except Exception as exc:
            self._sessions = frozenset()
            self._load_error = '%s: %s' % (type(exc).__name__, exc)

    @property
    def sessions(self):
        self._load()
        return self._sessions

    @property
    def first_session(self):
        return min(self.sessions) if self.sessions else None

    @property
    def last_session(self):
        return max(self.sessions) if self.sessions else None

    def status(self):
        self._load()
        return {'authority': AUTHORITY, 'available': bool(self._sessions),
                'source_path': str(self._source_path) if self._source_path else None,
                'source_sha256': self._source_sha256,
                'first_session': self.first_session, 'last_session': self.last_session,
                'session_count': len(self._sessions),
                'weekday_rule_used': False, 'holiday_authority': False,
                'future_open_day_authority': False,
                'load_error': self._load_error,
                'note': 'Only observed local index bars are authoritative; '
                        'unobserved dates are UNKNOWN, never inferred trading days.'}

    def classify(self, value):
        """Three-valued, evidence-first classification. Never guesses."""
        day = _as_date(value)
        sessions = self.sessions
        if not sessions:
            return {'date': day.isoformat(), 'state': 'UNKNOWN_NO_AUTHORITY',
                    'trading_day': None, 'reason': self._load_error or 'no observed local sessions'}
        key = day.isoformat()
        if key > self.last_session:
            return {'date': key, 'state': 'UNKNOWN_FUTURE_NO_AUTHORITY',
                    'trading_day': None,
                    'reason': 'after last observed session; no future open-day authority'}
        if key < self.first_session:
            return {'date': key, 'state': 'UNKNOWN_BEFORE_COVERAGE',
                    'trading_day': None, 'reason': 'before local index coverage'}
        if key in sessions:
            return {'date': key, 'state': 'OBSERVED_TRADING_DAY', 'trading_day': True,
                    'reason': 'local TDX index daily bar observed'}
        return {'date': key, 'state': 'UNKNOWN_NOT_OBSERVED_IN_INDEX_HISTORY',
                'trading_day': None,
                'reason': 'could be a holiday OR a missing bar; not inferred either way'}

    def is_observed_trading_day(self, value):
        return self.classify(value)['trading_day'] is True

    def last_observed_on_or_before(self, value):
        day = _as_date(value).isoformat()
        candidates = [s for s in self.sessions if s <= day]
        return max(candidates) if candidates else None


def completed_bar_bounds(day, minutes):
    """Bar-ending timestamps inside the two A-share sessions for one day."""
    out = []
    for start, end in ((OPEN_MORNING, CLOSE_MORNING), (OPEN_AFTERNOON, CLOSE_AFTERNOON)):
        cursor = datetime.combine(day, start)
        limit = datetime.combine(day, end)
        while True:
            cursor += timedelta(minutes=minutes)
            if cursor > limit:
                break
            out.append(cursor)
    return out


def expected_boundary(now, freq, calendar):
    """Expected latest *completed* bar/session, with calendar evidence attached.

    ``calendar_verified=False`` means the current session is not yet proven by
    a local index bar (normal during trading hours); the boundary is then a
    clock-based expectation, NOT a claim that the day is a trading day.
    """
    now = now if isinstance(now, datetime) else datetime.fromisoformat(str(now))
    day = now.date()
    state = calendar.classify(day)
    verified = state['trading_day'] is True
    if freq in ('daily', '1d'):
        if now.time() >= CLOSE_AFTERNOON:
            boundary, kind = day.isoformat(), 'COMPLETED_SESSION_IF_TRADING_DAY'
        else:
            previous = calendar.last_observed_on_or_before(day - timedelta(days=1))
            boundary, kind = previous, 'LAST_OBSERVED_COMPLETED_SESSION'
            verified = verified or previous is not None
        return {'dataset': 'daily', 'freq': freq, 'boundary': boundary,
                'boundary_kind': kind, 'calendar_state': state['state'],
                'calendar_verified': verified,
                'current_session_authority': 'PROVEN' if state['trading_day'] is True
                                              else 'FUTURE_DAY_AUTHORITY_ABSENT',
                'note': 'A missing current-session bar is never filled or assumed.'}
    if freq not in MINUTE_FREQS:
        raise ValueError('unsupported frequency: %s' % freq)
    minutes = MINUTE_FREQS[freq]
    bounds = [b for b in completed_bar_bounds(day, minutes) if b <= now]
    if bounds:
        boundary, kind = max(bounds).isoformat(), 'COMPLETED_INTRADAY_BAR'
    else:
        previous = calendar.last_observed_on_or_before(day - timedelta(days=1))
        boundary, kind = ((previous + 'T15:00:00') if previous else None,
                          'LAST_OBSERVED_SESSION_CLOSE')
        verified = verified or previous is not None
    return {'dataset': 'minute', 'freq': freq, 'boundary': boundary,
            'boundary_kind': kind, 'calendar_state': state['state'],
            'calendar_verified': verified,
            'current_session_authority': 'PROVEN' if state['trading_day'] is True
                                          else 'FUTURE_DAY_AUTHORITY_ABSENT',
            'note': 'Intraday boundary is clock-derived; session existence needs calendar evidence.'}
