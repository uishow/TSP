"""C03: announcement ledger never impersonates the announcement date."""
from datetime import date

from bridge.announcement_ledger import AnnouncementLedger


def records():
    return [
        {'symbol': '600031.SH', 'period_end': '2026-09-30', 'ann_date': '2026-10-28',
         'legal_deadline': '2026-10-31', 'first_collected': '2026-10-28'},
        {'symbol': '600031.SH', 'period_end': '2026-06-30', 'ann_date': None,
         'legal_deadline': '2026-08-31', 'first_collected': '2026-08-30'},
    ]


def test_verified_entry_keeps_real_announcement_date():
    led = AnnouncementLedger(records())
    e = led.entry('600031.SH', '2026-09-30')
    assert e['ann_date'] == '2026-10-28'
    assert e['ann_date_verified'] is True


def test_report_date_is_period_end_not_announcement():
    led = AnnouncementLedger(records())
    e = led.entry('600031.SH', '2026-09-30')
    assert e['report_date'] == '2026-09-30'
    assert e['report_date'] != e['ann_date']


def test_missing_announcement_stays_unknown_never_fabricated():
    led = AnnouncementLedger(records())
    e = led.entry('600031.SH', '2026-06-30')
    assert e['ann_date'] is None
    assert e['ann_date_verified'] is False
    # legal deadline and first_collected must NOT leak into ann_date
    assert e['legal_deadline'] == '2026-08-31'
    assert e['first_collected'] == '2026-08-30'


def test_available_at_refuses_unverified_entry():
    led = AnnouncementLedger(records())
    # decision at 2026-09-01: the Q3 report has a real ann_date 2026-10-28 which
    # is AFTER the decision, so it is not yet available; the Q2 report has no
    # ann_date and is fail-closed (None).
    assert led.available_at('600031.SH', '2026-09-30', '2026-09-01') is None
    assert led.available_at('600031.SH', '2026-06-30', '2026-09-01') is None


def test_available_at_returns_verified_date_when_before_decision():
    led = AnnouncementLedger(records())
    assert led.available_at('600031.SH', '2026-09-30', '2026-11-01') == '2026-10-28'


def test_coverage_counts_unknown_separately():
    led = AnnouncementLedger(records())
    cov = led.coverage()
    assert cov['total'] == 2
    assert cov['ann_date_verified'] == 1
    assert cov['ann_date_unknown'] == 1


def test_audit_lists_unknown_entries():
    led = AnnouncementLedger(records())
    unknown = led.audit()
    assert len(unknown) == 1
    assert unknown[0]['period_end'] == '2026-06-30'
