"""C06: point-in-time query — serve only what was actually available.

A strict backtest must not peek at a value that was published *after* the
decision it is meant to inform. For every domain (financial, equity, membership,
adjustment) this store serves only the latest version whose ``available_at``
predates the decision time. If no version was available at a decision point,
the query fails closed (returns ``None``) and the gap is recorded in
``rejection_coverage`` — it is never filled with a later, anachronistic version
and no historical version is fabricated.

The store is fed *observed* availability dates (e.g. from the C03 ledger for
financials). It performs no network calls and invents nothing.
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


class PITStore:
    DOMAINS = ('financial', 'equity', 'membership', 'adjustment')

    def __init__(self):
        # domain -> symbol -> list[(available_at: date, payload: dict)]
        self._versions = {d: {} for d in self.DOMAINS}
        self._rejections = []  # (domain, symbol, decision_at, reason)

    def add_version(self, domain, symbol, available_at, payload):
        if domain not in self._versions:
            raise ValueError(f'Unknown PIT domain: {domain}')
        av = _to_date(available_at)
        if av is None:
            raise ValueError('add_version requires an observed available_at date')
        self._versions[domain].setdefault(str(symbol), []).append((av, dict(payload)))
        self._versions[domain][str(symbol)].sort(key=lambda t: t[0])

    def available_at_decision(self, domain, symbol, decision_at):
        """Return the latest payload published on/before ``decision_at``.

        Fail-closed: when nothing was published yet, returns ``(None, None)``
        rather than a later version. The caller may not substitute a deadline
        or current value.
        """
        dec = _to_date(decision_at)
        versions = self._versions.get(domain, {}).get(str(symbol), [])
        chosen = None
        for av, payload in versions:
            if dec is not None and av <= dec:
                chosen = (av, payload)
            else:
                break
        if chosen is None:
            return None, None
        return chosen[0].isoformat(), chosen[1]

    def strict_backtest(self, domain, symbol, decision_dates):
        """Validate a backtest interval: every decision point needs PIT evidence.

        Returns a summary; records every gap in ``rejection_coverage``. When any
        decision point lacks an available version, ``fully_covered`` is False and
        the missing points are itemized — the backtest must not proceed on
        fabricated history.
        """
        gaps = []
        served = []
        for d in decision_dates:
            av, payload = self.available_at_decision(domain, symbol, d)
            if av is None:
                gaps.append(_to_date(d).isoformat() if _to_date(d) else str(d))
                self._rejections.append((domain, str(symbol), str(d),
                                         'NO_PIT_EVIDENCE_BEFORE_DECISION'))
            else:
                served.append((str(d), av))
        return {
            'domain': domain,
            'symbol': str(symbol),
            'fully_covered': len(gaps) == 0,
            'decision_points': len(decision_dates),
            'served': served,
            'gaps': gaps,
        }

    def rejection_coverage(self):
        return {
            'count': len(self._rejections),
            'items': [{'domain': d, 'symbol': s, 'decision_at': dec, 'reason': r}
                      for (d, s, dec, r) in self._rejections],
        }
