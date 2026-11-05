"""C03: real announcement ledger — never impersonate the announcement date.

This is the honest store of *when a report actually became available*. Three
timestamps that downstream code is tempted to use as the announcement date are
kept strictly separate and are NEVER returned as ``ann_date``:

  - ``report_date`` (报告期 / period_end) — the economic period the report
    covers, not when it was published.
  - ``legal_deadline`` (法定披露截止日) — the statutory deadline, not the
    actual publication date.
  - ``first_collected_ms`` — when *we* first observed the row, not when the
    issuer announced it.

A ledger entry is ``ann_date_verified`` only when it carries a genuine
announcement/disclosure date from a verified source. Entries lacking that
evidence stay ``ann_date=None`` and are reported under ``UNKNOWN`` coverage —
they are never back-dated to a deadline or collection time. Strict PIT queries
(C06) refuse to treat an UNKNOWN entry as available before a decision time.

The ledger is read-only over an observed-disclosure source (a local JSONL of
real disclosure rows). It does not call any SDK that could silently back-fill
remote history, and it never invents an announcement date.
"""
from __future__ import annotations

from datetime import date, datetime


def _to_date(value):
    if value is None:
        return None
    if isinstance(value, (datetime, date)):
        return value.date() if isinstance(value, datetime) else value
    s = str(value).strip()
    if not s:
        return None
    for fmt in ('%Y-%m-%d', '%Y%m%d'):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


class AnnouncementLedger:
    def __init__(self, records=None, source=None, source_version=None):
        # ``records`` is an iterable of observed disclosure rows. Each row may
        # carry ann_date / report_date / legal_deadline / first_collected; only
        # ann_date (a genuine disclosure date) is authoritative.
        self.source = source or 'LOCAL_DISCLOSURE_OBSERVATION'
        self.source_version = source_version or 'observed'
        self._by_key = {}
        for r in (records or []):
            symbol = str(r.get('symbol'))
            period_end = _to_date(r.get('period_end') or r.get('report_date'))
            if not symbol or period_end is None:
                continue
            ann = _to_date(r.get('ann_date'))
            self._by_key[(symbol, period_end)] = {
                'symbol': symbol,
                'period_end': period_end.isoformat(),
                'ann_date': ann.isoformat() if ann else None,
                'ann_date_verified': ann is not None,
                'report_date': period_end.isoformat(),  # period end, NOT announcement
                'legal_deadline': _to_date(r.get('legal_deadline')).isoformat()
                if _to_date(r.get('legal_deadline')) else None,
                'first_collected': _to_date(r.get('first_collected')).isoformat()
                if _to_date(r.get('first_collected')) else None,
                'source': r.get('source', self.source),
                'source_version': r.get('source_version', self.source_version),
            }

    def entry(self, symbol, period_end):
        """Return the normalized ledger entry or an UNKNOWN placeholder.

        An UNKNOWN entry explicitly reports ``ann_date=None`` and
        ``ann_date_verified=False``; it never substitutes a deadline or
        collection time for the announcement date.
        """
        key = (str(symbol), _to_date(period_end))
        if key in self._by_key:
            return dict(self._by_key[key])
        return {
            'symbol': str(symbol),
            'period_end': key[1].isoformat() if key[1] else None,
            'ann_date': None,
            'ann_date_verified': False,
            'report_date': key[1].isoformat() if key[1] else None,
            'legal_deadline': None,
            'first_collected': None,
            'source': self.source,
            'source_version': self.source_version,
        }

    def available_at(self, symbol, period_end, decision_at):
        """Return the announcement date if it is verified and predates decision.

        Fail-closed: a missing / unverified announcement date yields ``None``
        (the report is NOT treated as available before the decision), never a
        deadline or collection time.
        """
        e = self.entry(symbol, period_end)
        if not e['ann_date_verified']:
            return None
        dec = _to_date(decision_at)
        ann = _to_date(e['ann_date'])
        if dec is None or ann is None or ann <= dec:
            return e['ann_date']
        return None

    def coverage(self):
        verified = sum(1 for e in self._by_key.values() if e['ann_date_verified'])
        unknown = len(self._by_key) - verified
        return {
            'total': len(self._by_key),
            'ann_date_verified': verified,
            'ann_date_unknown': unknown,
            'source': self.source,
            'source_version': self.source_version,
        }

    def audit(self):
        """List every entry that lacks a verified announcement date."""
        return [e for e in self._by_key.values() if not e['ann_date_verified']]
