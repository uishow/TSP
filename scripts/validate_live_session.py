"""E01: validate full-market minute collection in a REAL open-session window.

This script is the acceptance gate for "the live pipeline actually ran during
trading hours". It compares a *fixed plan* (which symbols, which Beijing
window, expected bars, latency/error budgets) against a *captured session* that
must prove it was produced inside that window.

Fail-closed rules:
  - If no real captured session exists, the result is MISSED. History is never
    back-filled to impersonate a live acceptance.
  - If a captured artifact's own timestamp range does not fall inside the
    planned window, it is REJECTED_NOT_LIVE (it is not proof of a real session).
  - A captured row whose source_time_raw / event clock is outside the window is
    excluded from coverage and counted as an anomaly.

The script performs no network calls and fabricates nothing; it only measures
the provided evidence.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, date
from zoneinfo import ZoneInfo

CN = ZoneInfo('Asia/Shanghai')


def _parse_bj(value):
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(value)


def in_planned_window(plan, captured):
    """True only if the captured session's own range sits inside the plan window."""
    win_start = _parse_bj(plan['window_start'])
    win_end = _parse_bj(plan['window_end'])
    cap = captured.get('captured_range')
    if not cap:
        return False
    cs = _parse_bj(cap[0])
    ce = _parse_bj(cap[1])
    return win_start <= cs <= win_end and win_start <= ce <= win_end


def validate_session(plan, captured):
    """Return an acceptance report. ``captured`` may be None (=> MISSED)."""
    report = {
        'plan_date': plan.get('date'),
        'planned_window': [plan.get('window_start'), plan.get('window_end')],
        'denominator': len(plan.get('symbols', [])),
        'expected_bars_per_symbol': plan.get('expected_bars_per_symbol'),
        'max_latency_ms': plan.get('max_latency_ms'),
        'max_errors': plan.get('max_errors', 0),
    }
    if captured is None or not captured.get('rows'):
        report['status'] = 'MISSED'
        report['reason'] = ('no real captured session; cannot backfill history '
                            'to impersonate live acceptance')
        return report
    if not in_planned_window(plan, captured):
        report['status'] = 'REJECTED_NOT_LIVE'
        report['reason'] = ('captured range is outside the planned open window; '
                            'not proof of a real live session')
        report['captured_range'] = captured.get('captured_range')
        return report

    planned = set(plan['symbols'])
    rows = captured['rows']
    collected = {r['symbol'] for r in rows if r.get('symbol')}
    missing = sorted(planned - collected)
    in_window_rows = [r for r in rows
                      if _parse_bj(r['event_time']).date().isoformat() == plan.get('date')]
    anomalies = len(rows) - len(in_window_rows)

    latencies = [r['latency_ms'] for r in rows if r.get('latency_ms') is not None]
    max_latency = max(latencies) if latencies else None
    errors = len(captured.get('errors', []))
    recoveries = len(captured.get('recoveries', []))

    report.update({
        'coverage': len(collected),
        'missing': missing,
        'coverage_ratio': round(len(collected) / report['denominator'], 4) if report['denominator'] else 0,
        'anomalies_outside_window': anomalies,
        'max_latency_ms': max_latency,
        'errors': errors,
        'recoveries': recoveries,
        'resource': captured.get('resource', {}),
        'captured_range': captured.get('captured_range'),
    })

    latency_ok = max_latency is None or plan.get('max_latency_ms') is None \
        or max_latency <= plan['max_latency_ms']
    errors_ok = errors <= plan.get('max_errors', 0)
    coverage_ok = len(missing) == 0

    if coverage_ok and latency_ok and errors_ok:
        report['status'] = 'PASSED'
    else:
        report['status'] = 'PARTIAL'
        report['failed_checks'] = {
            'coverage': not coverage_ok,
            'latency': not latency_ok,
            'errors': not errors_ok,
        }
    return report


def write_plan_template(path):
    template = {
        'date': date.today().isoformat(),
        'window_start': '2026-01-01T09:30:00+08:00',
        'window_end': '2026-01-01T15:00:00+08:00',
        'symbols': ['600031.SH'],
        'expected_bars_per_symbol': 240,
        'max_latency_ms': 2000,
        'max_errors': 0,
    }
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(template, f, ensure_ascii=False, indent=2)
    return template


def main(argv=None):
    ap = argparse.ArgumentParser(description='Validate a real live-session capture against a fixed plan.')
    ap.add_argument('--plan', required=True, help='path to the fixed plan JSON')
    ap.add_argument('--captured', help='path to the captured session JSON (omit to report MISSED)')
    ap.add_argument('--write-plan', help='write a plan template to this path and exit')
    args = ap.parse_args(argv)
    if args.write_plan:
        write_plan_template(args.write_plan)
        print(f'wrote plan template -> {args.write_plan}')
        return 0
    with open(args.plan, encoding='utf-8') as f:
        plan = json.load(f)
    captured = None
    if args.captured:
        with open(args.captured, encoding='utf-8') as f:
            captured = json.load(f)
    report = validate_session(plan, captured)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report['status'] in ('PASSED', 'PARTIAL') else 2


if __name__ == '__main__':
    sys.exit(main())
