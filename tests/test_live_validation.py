"""E01: live-session validator refuses to impersonate acceptance from history."""
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import validate_live_session as v  # noqa: E402


def plan():
    return {
        'date': '2026-11-05',
        'window_start': '2026-11-05T09:30:00+08:00',
        'window_end': '2026-11-05T15:00:00+08:00',
        'symbols': ['600031.SH', '000001.SZ'],
        'expected_bars_per_symbol': 240,
        'max_latency_ms': 2000,
        'max_errors': 0,
    }


def captured_in_window():
    return {
        'captured_range': ['2026-11-05T09:31:00+08:00', '2026-11-05T15:00:00+08:00'],
        'rows': [
            {'symbol': '600031.SH', 'event_time': '2026-11-05T10:00:00+08:00', 'latency_ms': 800},
            {'symbol': '000001.SZ', 'event_time': '2026-11-05T10:00:00+08:00', 'latency_ms': 900},
        ],
        'errors': [],
        'recoveries': [],
        'resource': {'cpu_pct': 12.4, 'mem_mb': 210},
    }


def test_missing_capture_is_missed_not_backfilled():
    report = v.validate_session(plan(), None)
    assert report['status'] == 'MISSED'
    assert 'backfill' in report['reason'].lower()


def test_capture_outside_window_is_rejected():
    cap = captured_in_window()
    cap['captured_range'] = ['2026-11-04T09:31:00+08:00', '2026-11-04T15:00:00+08:00']
    report = v.validate_session(plan(), cap)
    assert report['status'] == 'REJECTED_NOT_LIVE'


def test_full_coverage_passes():
    report = v.validate_session(plan(), captured_in_window())
    assert report['status'] == 'PASSED'
    assert report['denominator'] == 2
    assert report['coverage'] == 2
    assert report['missing'] == []
    assert report['coverage_ratio'] == 1.0


def test_partial_coverage_is_partial_not_passed():
    cap = captured_in_window()
    cap['rows'] = [{'symbol': '600031.SH', 'event_time': '2026-11-05T10:00:00+08:00', 'latency_ms': 800}]
    report = v.validate_session(plan(), cap)
    assert report['status'] == 'PARTIAL'
    assert report['missing'] == ['000001.SZ']
    assert report['failed_checks']['coverage'] is True


def test_rows_outside_window_count_as_anomalies():
    cap = captured_in_window()
    cap['rows'].append({'symbol': '600031.SH', 'event_time': '2026-11-04T10:00:00+08:00', 'latency_ms': 800})
    report = v.validate_session(plan(), cap)
    # one of the two in-window symbols now missing because the appended row is
    # an out-of-window anomaly and not a real coverage hit for that symbol.
    assert report['anomalies_outside_window'] == 1
