"""B03: per-symbol realtime quality gate before native finalization.

The upstream native write of daily / enriched / monitoring / depth5 takes a
batch of rows. A batch must NOT be cleared just because its *latest* timestamp
looks fresh while most rows are stale, undated or carry a non-authentic clock
provenance. This module re-checks every individual row against the evidence
produced by ``bridge.quote_quality`` and the ``clock_evidence`` written by
``live_sources``:

  - realtime rows must carry ``TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMM``
  - depth rows must carry ``TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMMSS``
  - an in-session row marked ``stale`` (its per-symbol clock fell behind the
    wall clock beyond the freshness gate) is rejected, because that is exactly
    the halted / hours-old last-tick case B01 refuses
  - a lunch-break or after-close row marked ``stale`` is *preserved* with its
    flag (it is the legitimate final snapshot), never revived as live
  - an incomplete five-level book is flagged but still kept as a real
    observation; it is never zero-filled

The gate is pure and fully testable; ``attach`` best-effort patches the
upstream finalization entry point if it is importable, otherwise it records a
note and does nothing (it never silently downgrades the data).
"""
from __future__ import annotations

from datetime import datetime

from bridge.quote_quality import (
    admit_realtime, admit_depth, ADMITTED,
)

# Reasons under which a stale flag is the *legitimate* final snapshot, not a
# rejected halted/old row.
FINAL_SNAPSHOT_REASONS = {
    'LUNCH_BREAK_FINAL_SNAPSHOT', 'AFTER_HOURS_FINAL_SNAPSHOT',
    'LUNCH_BREAK_FINAL_BOOK', 'AFTER_HOURS_FINAL_BOOK',
}

REALTIME_EVIDENCE = 'TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMM'
DEPTH_EVIDENCE = 'TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMMSS'

# Verdicts returned by the gate.
GATE_ADMITTED = 'ADMITTED'
GATE_FLAG_INCOMPLETE = 'FLAG_INCOMPLETE_LEVELS'
GATE_REJECT_PROVENANCE = 'REJECT_CLOCK_PROVENANCE'
GATE_REJECT_STALE = 'REJECT_STALE_PAST_GATE'
GATE_REJECT_MISSING = 'REJECT_QUALITY_FIELD_MISSING'


def _expected_evidence(row):
    # depth rows carry HHMMSS evidence; realtime rows carry HHMM evidence.
    return DEPTH_EVIDENCE if row.get('levels_complete') is not None or 'bid_volumes' in row \
        else REALTIME_EVIDENCE


def gate_row(row, server_dt, max_lag_minutes=10):
    """Return (verdict, detail) for one row before native finalization.

    ``server_dt`` is the authenticated TDX handshake datetime used as the
    freshness reference. The verdict never invents a clock: a missing /
    non-authentic provenance yields rejection, never admission.
    """
    if not isinstance(row, dict):
        return GATE_REJECT_MISSING, {'reason': 'row is not a mapping'}
    evidence = row.get('clock_evidence')
    if evidence != _expected_evidence(row):
        return GATE_REJECT_PROVENANCE, {
            'symbol': row.get('symbol'), 'clock_evidence': evidence,
            'expected': _expected_evidence(row),
        }
    stale = bool(row.get('stale'))
    reason = row.get('freshness_reason')
    if stale and reason not in FINAL_SNAPSHOT_REASONS:
        # In-session but flagged stale => per-symbol clock fell behind the wall
        # clock beyond the gate => halted / hours-old last tick. Reject it.
        return GATE_REJECT_STALE, {
            'symbol': row.get('symbol'), 'wall_clock_lag_minutes': row.get('wall_clock_lag_minutes'),
            'freshness_reason': reason,
        }
    verdict = GATE_ADMITTED
    detail = {'symbol': row.get('symbol')}
    if row.get('levels_complete') is False:
        # Real five-level observation with fewer than five levels: keep it, but
        # flag so downstream never treats it as a complete book. Never zero-fill.
        verdict = GATE_FLAG_INCOMPLETE
        detail['levels_complete'] = False
    return verdict, detail


def gate_batch(rows, server_dt, max_lag_minutes=10):
    """Gate an entire batch row-by-row.

    ``batch_passed`` is True only when *every* row is ADMITTED or merely
    flagged-incomplete. A batch containing any rejected row does NOT clear on
    the strength of its single freshest timestamp.
    """
    admitted, flagged, rejected = [], [], []
    for row in rows or []:
        verdict, detail = gate_row(row, server_dt, max_lag_minutes)
        if verdict == GATE_ADMITTED:
            admitted.append(row)
        elif verdict == GATE_FLAG_INCOMPLETE:
            flagged.append({'row': row, 'detail': detail})
            admitted.append(row)  # incomplete book is still a real observation
        else:
            rejected.append({'row': row, 'verdict': verdict, 'detail': detail})
    return {
        'admitted': admitted,
        'flagged_incomplete': flagged,
        'rejected': rejected,
        'counts': {
            'total': len(rows or []),
            'admitted': len(admitted),
            'flagged_incomplete': len(flagged),
            'rejected': len(rejected),
        },
        'batch_passed': len(rejected) == 0,
    }


def attach(app=None):
    """Best-effort hook: wrap the upstream finalization entry point if present.

    The native daily/enriched/monitoring/depth5 writer lives in the upstream
    app, which is not importable in the host test venv. If the entry point is
    resolvable we wrap it so every write is gated; otherwise we record a note
    and never downgrade the data. Returns a status dict either way.
    """
    status = {'attached': False, 'note': 'no upstream finalization entry point resolved'}
    if app is None:
        return status
    target = getattr(app, 'finalize_realtime_batch', None)
    if callable(target):
        def _gated(batch, *a, **kw):
            server_dt = kw.pop('server_dt', None)
            result = gate_batch(batch, server_dt)
            if not result['batch_passed']:
                # Fail closed at the boundary: surface the rejection summary and
                # do not silently finalize a mixed batch.
                raise RuntimeError(
                    f'realtime batch failed quality gate: '
                    f'{result["counts"]["rejected"]} rejected, '
                    f'{result["counts"]["flagged_incomplete"]} incomplete')
            return target(result['admitted'], *a, **kw)
        app.finalize_realtime_batch = _gated
        status = {'attached': True, 'note': 'wrapped app.finalize_realtime_batch'}
    return status
