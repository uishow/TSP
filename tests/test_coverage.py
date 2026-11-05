"""D02: bar coverage and gap detection."""
from datetime import datetime, timedelta
from bridge.coverage import session_bar_counts, coverage_report


def _minute_days(days, per_day):
    """Generate valid per-minute timestamps: 120 bars/session (matches coverage)."""
    out = []
    for d in days:
        base = datetime.strptime(d, '%Y-%m-%d')
        for h, m in [(9, 30), (13, 0)]:
            start = base.replace(hour=h, minute=m, second=0)
            n = 120 if per_day is None else per_day
            for i in range(n):
                out.append({'datetime': (start + timedelta(minutes=i)).isoformat(timespec='seconds')})
    return out


def test_session_bar_counts():
    assert session_bar_counts('1m')['total'] == 240
    assert session_bar_counts('5m')['total'] == 48
    assert session_bar_counts('1m')['morning'] == 120
    assert session_bar_counts('1m')['afternoon'] == 120


def test_coverage_complete_day():
    daily = [{'date': '2024-01-02'}, {'date': '2024-01-03'}]
    minutes = _minute_days(['2024-01-02', '2024-01-03'], None)
    rep = coverage_report('600031.SH', '1m', daily, minutes)
    assert rep['days_complete'] == 2
    assert rep['days_missing'] == 0
    assert rep['days_partial'] == 0
    assert rep['total_observed'] == 480


def test_coverage_missing_day_flagged_not_filled():
    daily = [{'date': '2024-01-02'}, {'date': '2024-01-03'}]
    minutes = _minute_days(['2024-01-02'], None)  # only day 1
    rep = coverage_report('600031.SH', '1m', daily, minutes)
    assert rep['days_complete'] == 1
    assert rep['days_missing'] == 1
    missing = [p for p in rep['per_day'] if p['status'] == 'SUSPENDED_OR_MISSING']
    assert missing and missing[0]['gap'] == 240
    assert rep['zero_fill'] is False


def test_coverage_partial_gap():
    daily = [{'date': '2024-01-02'}]
    base = datetime(2024, 1, 2)
    minutes = [{'datetime': (base.replace(hour=9, minute=30) + timedelta(minutes=i)).isoformat(timespec='seconds')}
               for i in range(120)]  # morning only; afternoon missing
    rep = coverage_report('600031.SH', '1m', daily, minutes)
    assert rep['days_partial'] == 1
    assert rep['per_day'][0]['status'] == 'PARTIAL_GAP'
    assert rep['per_day'][0]['gap'] == 120


def test_coverage_excludes_unlisted_days():
    daily = [{'date': '2024-01-02'}]
    minutes = []
    rep = coverage_report('600031.SH', '1m', daily, minutes)
    assert rep['trading_days_with_daily'] == 1
    assert rep['days_missing'] == 1  # flagged but NOT counted as expected-and-zero-filled
    assert rep['total_expected'] == 240
