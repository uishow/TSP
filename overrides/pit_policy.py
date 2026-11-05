"""C07: PIT policy — intercept historical look-back on latest/current state.

Some upstream paths answer a *historical* question (e.g. "what were this
stock's shares on 2024-06-01?") with the *current* shares, the *current* index
membership, or a report's *period end* in place of its announcement date. That
silently invents history and corrupts any backtest that depends on those
fields.

This policy decides by the fields a request *actually* depends on:

  - PIT-sensitive domains (financial, equity, membership, adjustment): a
    historical decision point may only be served from a version that was
    published on/before it (C06). Looking back with the latest/current value is
    BLOCKED unless PIT evidence exists.
  - Non-PIT domains (raw price/return that carries no corporate-action or
    membership dependency): ALLOW — these must not be false-flagged.

The policy is conservative and explicit; it never downgrades a request and
returns a named verdict so the caller can fail closed.
"""
from __future__ import annotations

from bridge.pit import PITStore

# Domains whose historical accuracy depends on point-in-time publication state.
PIT_SENSITIVE_DOMAINS = {'financial', 'equity', 'membership', 'adjustment'}
# Domains that are safe to read for any historical point without PIT concern
# (no corporate-action / membership / announcement-date dependency).
NON_PIT_DOMAINS = {'price', 'raw_price', 'minute', 'daily'}

ALLOW = 'ALLOW'
BLOCK = 'BLOCK_NO_PIT_EVIDENCE'


def is_pit_sensitive(intent):
    """True when the request's result depends on a PIT-sensitive field."""
    domain = intent.get('domain')
    if domain in NON_PIT_DOMAINS:
        return False
    if domain in PIT_SENSITIVE_DOMAINS:
        return True
    # Unknown domain: treat as sensitive and require explicit evidence rather
    # than silently allowing a possible look-back.
    return True


class PITPolicy:
    def __init__(self, store=None):
        self.store = store or PITStore()

    def evaluate(self, intent, decision_at=None):
        """Return (verdict, detail) for one historical-data request.

        ``intent`` describes what the request will consume: at minimum a
        ``domain`` and a ``symbol``. ``decision_at`` is the historical point the
        request is answering for; if omitted, the intent must carry it.
        """
        domain = intent.get('domain')
        symbol = intent.get('symbol')
        dec = decision_at or intent.get('decision_at')
        if not is_pit_sensitive(intent):
            return ALLOW, {'domain': domain, 'reason': 'non-PIT domain, no look-back risk'}
        # PIT-sensitive: must have a version available on/before the decision.
        av, payload = self.store.available_at_decision(domain, symbol, dec)
        if av is None:
            return BLOCK, {
                'domain': domain, 'symbol': symbol, 'decision_at': str(dec),
                'reason': 'no PIT version available before decision; refusing '
                          'look-back on latest/current state',
            }
        return ALLOW, {'domain': domain, 'symbol': symbol, 'served_available_at': av}

    def evaluate_batch(self, intents):
        results = [self.evaluate(i) for i in intents]
        blocked = [r for r in results if r[0] == BLOCK]
        return {
            'results': results,
            'all_allowed': len(blocked) == 0,
            'blocked_count': len(blocked),
        }


def attach(app=None, store=None):
    """Best-effort hook: wrap the upstream backtest / financial entry point.

    A historical query that would look back with latest equity / current
    membership / period-end in place of an announcement date must be refused.
    If the upstream entry point is resolvable we evaluate each historical
    intent and fail closed on any blocked one; otherwise we record a note. The
    hook never downgrades data and never fabricates PIT history.

    When ``store`` is not supplied, the fuyao-fed PIT store (verified recent
    disclosure dates only) is loaded so the policy can ALLOW recent-period
    backtests and BLOCK historical look-backs with no evidence.
    """
    status = {'attached': False, 'note': 'no upstream PIT-sensitive entry point resolved'}
    if app is None:
        # Still resolve the store so callers/tests get a ready, evidence-backed
        # policy even outside the container app lifecycle.
        if store is None:
            try:
                from bridge.fuyao_pit import load_fuyao_pit
                _, store = load_fuyao_pit()
            except Exception:
                store = None
        return status
    if store is None:
        try:
            from bridge.fuyao_pit import load_fuyao_pit
            _, store = load_fuyao_pit()
        except Exception:
            store = None
    policy = PITPolicy(store)
    target = getattr(app, 'run_backtest_with_intent', None) \
        or getattr(app, 'query_financial_pit', None)
    if callable(target):
        def _gated(intent, *a, **kw):
            verdict, detail = policy.evaluate(intent)
            if verdict == BLOCK:
                raise RuntimeError(f'PIT policy blocked historical look-back: {detail["reason"]}')
            return target(intent, *a, **kw)
        if hasattr(app, 'run_backtest_with_intent'):
            app.run_backtest_with_intent = _gated
        else:
            app.query_financial_pit = _gated
        status = {'attached': True, 'note': 'wrapped upstream PIT-sensitive entry point'}
    return status
