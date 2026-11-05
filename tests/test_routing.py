from datetime import datetime
import pytest
from bridge.router import Router, SourceUnavailable, prefer_newer

class Local:
    def daily(self, **kw): return [{'symbol':'600031.SH','date':'2026-11-03','close':10,'source':'free-stockdb'}]
    def minute(self, **kw): return []
    def instruments(self, **kw): return [{'symbol':'600031.SH'}]
    def boards(self): return []
class Live:
    calls=0
    def daily(self, **kw):
        self.calls+=1
        return [{'symbol':'600031.SH','date':'2026-11-04','close':11,'source':'eltdx'}]
    def minute(self, **kw): raise RuntimeError('offline')
    def realtime(self, **kw): return []

def query(**kw):
    return dict(dataset='daily',symbols=['600031.SH'],start_time='2026-11-01',end_time='2026-11-04',**kw)
def test_historical_does_not_contact_live():
    live=Live();r=Router(Local(),live).query(**query())
    assert live.calls==0 and r['rows'][0]['source']=='free-stockdb'
    assert r['metadata']['latest_event']=='2026-11-03'
def test_explicit_latest_merges_by_event_key():
    live=Live();r=Router(Local(),live,now=lambda:datetime(2026,11,4,16)).query(**query(require_latest=True))
    assert live.calls==1 and len(r['rows'])==2
    assert r['metadata']['source_versions']
def test_live_failure_cannot_be_successful_empty():
    with pytest.raises(SourceUnavailable): Router(Local(),Live(),now=lambda:datetime(2026,11,4,16)).query(dataset='minute',symbols=['600031.SH'],start_time='2026-11-04',end_time='2026-11-04',require_latest=True)
def test_no_zero_insertion_and_preserve_local_conflict():
    rows, conflicts=prefer_newer([{'symbol':'600031.SH','date':'2026-11-03','close':10,'source':'local'}],[{'symbol':'600031.SH','date':'2026-11-03','close':11,'source':'eltdx'}])
    assert rows[0]['close']==11 and conflicts[0]['previous']['close']==10
    assert 'volume' not in rows[0]
def test_missing_dataset_fails():
    with pytest.raises(ValueError): Router(Local(),Live()).query(dataset='url',url='https://evil.test')
def test_future_rows_are_filtered():
    r=Router(Local(),Live()).query(dataset='daily',symbols=['600031.SH'],start_time='2026-11-01',end_time='2026-11-02')
    assert r['rows']==[]

def test_premarket_yesterday_complete_data_avoids_remote_refresh():
    from bridge.router import needs_refresh
    rows=[{'symbol':'600031.SH','date':'2026-11-03'}]
    assert needs_refresh(rows,['600031.SH'],'daily',datetime(2026,11,4,8,0)) is False
    assert needs_refresh(rows,['600031.SH'],'daily',datetime(2026,11,4,16,0)) is True

def test_minute_lunch_and_missing_symbol_checks():
    from bridge.router import needs_refresh
    rows=[{'symbol':'600031.SH','datetime':'2026-11-04T11:30:00'}]
    assert needs_refresh(rows,['600031.SH'],'minute',datetime(2026,11,4,12,0)) is False
    assert needs_refresh(rows,['600031.SH','000001.SZ'],'minute',datetime(2026,11,4,12,0)) is True

def test_daily_start_midnight_does_not_drop_first_day():
    r=Router(Local(),Live()).query(dataset='daily',symbols=['600031.SH'],start_time='2026-11-03T00:00:00',end_time='2026-11-03T23:59:59')
    assert len(r['rows'])==1

class SessionLocal:
    def __init__(self,rows): self._rows=list(rows)
    def daily(self,**kw): return list(self._rows)
    def minute(self,**kw): return list(self._rows)
    def instruments(self,**kw): return []
    def boards(self): return []
class EmptyLive:
    def __init__(self): self.calls=0
    def daily(self,**kw): self.calls+=1; return []
    def minute(self,**kw): self.calls+=1; return []
    def realtime(self,**kw): return []

def test_after_hours_local_daily_skips_empty_live_refresh():
    from bridge.router import after_hours_local_daily
    rows=[{'symbol':'600031.SH','date':'2026-11-04','close':18.69,'source':'free_stockdb'},
          {'symbol':'000001.SZ','date':'2026-11-03','close':11.77,'source':'free_stockdb'}]
    now=lambda:datetime(2026,11,4,23,32)
    assert after_hours_local_daily(rows,now()) is True
    live=EmptyLive()
    r=Router(SessionLocal(rows),live,now=now).query(
        dataset='daily',symbols=['600031.SH','000001.SZ'],
        start_time='2026-11-03',end_time='2026-11-04',require_latest=True)
    assert live.calls==0
    assert r['rows']==rows
    assert r['metadata']['latest_refresh']=='SKIPPED_AFTER_HOURS_LOCAL_DAILY_COVERS_SESSION'
    assert r['metadata']['missing_values']=='null; never zero-filled'

def test_after_hours_without_session_bar_still_fails_closed():
    rows=[{'symbol':'600031.SH','date':'2026-11-03','close':18.84,'source':'free_stockdb'}]
    live=EmptyLive()
    with pytest.raises(SourceUnavailable):
        Router(SessionLocal(rows),live,now=lambda:datetime(2026,11,4,23,32)).query(
            dataset='daily',symbols=['600031.SH'],start_time='2026-11-03',
            end_time='2026-11-04',require_latest=True)
    assert live.calls==1

def test_minute_after_hours_still_requires_live():
    rows=[{'symbol':'600031.SH','datetime':'2026-11-04T14:59:00','close':18.69,'source':'free_stockdb'}]
    live=EmptyLive()
    with pytest.raises(SourceUnavailable):
        Router(SessionLocal(rows),live,now=lambda:datetime(2026,11,4,23,32)).query(
            dataset='minute',symbols=['600031.SH'],start_time='2026-11-04',
            end_time='2026-11-04',require_latest=True)

def test_after_hours_guard_limited_to_session_close():
    from bridge.router import after_hours_local_daily
    rows=[{'symbol':'600031.SH','date':'2026-11-04'}]
    assert after_hours_local_daily(rows,datetime(2026,11,4,14,0)) is False
    assert after_hours_local_daily(rows,datetime(2026,11,7,23,32)) is False


# -- A05: calendar-aware freshness evidence (advisory, not admission) -------
def _probe_calendar():
    from bridge.calendar import TradingCalendar
    return TradingCalendar(sessions=['2026-11-03', '2026-11-04'],
                           source_path='/probe/index.day', source_sha256='probe')


def test_assess_freshness_is_per_symbol_and_reports_suspended_candidates():
    from bridge.router import assess_freshness
    rows = [{'symbol': '600031.SH', 'date': '2026-11-04'},
            {'symbol': '000001.SZ', 'date': '2026-11-03'}]
    a = assess_freshness(rows, ['600031.SH', '000001.SZ', '600000.SH'],
                         'daily', datetime(2026, 11, 4, 16, 0), '1m', _probe_calendar())
    assert a['gate'] == 'ADVISORY_NOT_ENFORCED'
    assert a['boundary']['boundary'] == '2026-11-04'
    assert a['per_symbol'][0]['covers_expected_boundary'] is True
    assert a['per_symbol'][1]['covers_expected_boundary'] is False
    assert a['per_symbol'][2]['note'] == 'NO_OBSERVATION_SUSPENDED_OR_MISSING'
    assert a['suspended_candidates'] == ['600000.SH']
    assert a['all_symbols_cover_boundary'] is False and a['latest_verified'] is False
    assert a['calendar']['future_open_day_authority'] is False
    assert a['calendar']['weekday_rule_used'] is False


def test_nonempty_current_session_without_calendar_proof_is_not_latest():
    from bridge.router import assess_freshness
    rows = [{'symbol': '600031.SH', 'datetime': '2026-11-05T10:10:00'}]
    a = assess_freshness(rows, ['600031.SH'], 'minute',
                         datetime(2026, 11, 5, 10, 12), '5m', _probe_calendar())
    assert a['boundary']['boundary'] == '2026-11-05T10:10:00'
    assert a['boundary']['calendar_verified'] is False
    assert a['all_symbols_cover_boundary'] is True
    assert a['latest_verified'] is False  # calendar evidence is mandatory


def test_remote_second_check_rejects_lagging_nonempty_rows():
    from bridge.router import verify_remote_freshness
    boundary = {'boundary': '2026-11-04', 'calendar_verified': True}
    ok = verify_remote_freshness([{'symbol': '600031.SH', 'date': '2026-11-04'}], boundary)
    assert ok['state'] == 'REACHES_BOUNDARY' and ok['latest_verified'] is True
    lagging = verify_remote_freshness([{'symbol': '600031.SH', 'date': '2026-11-03'}], boundary)
    assert lagging['state'] == 'BELOW_BOUNDARY' and lagging['latest_verified'] is False
    assert verify_remote_freshness([], boundary)['state'] == 'NO_DATED_OBSERVATIONS'
    assert verify_remote_freshness([{'date': '2026-11-04'}], {})['state'] == 'UNKNOWN_NO_AUTHORITY_BOUNDARY'


def test_router_exposes_assessment_but_keeps_existing_refresh_decision():
    live = Live()
    r = Router(Local(), live, now=lambda: datetime(2026, 11, 4, 16),
               calendar=_probe_calendar()).query(**query(require_latest=True))
    assert live.calls == 1 and len(r['rows']) == 2  # original admission unchanged
    meta = r['metadata']
    assert meta['freshness_gate'] == 'ADVISORY_NOT_ENFORCED'
    assert meta['freshness_assessment']['calendar']['authority'] == 'LOCAL_TDX_INDEX_OBSERVED_BARS_ONLY'
    assert meta['freshness_assessment']['latest_verified'] is True
    assert meta['remote_freshness']['state'] == 'REACHES_BOUNDARY'


def test_historical_read_never_loads_the_calendar():
    class Exploding:
        def status(self): raise AssertionError('calendar must not be loaded for a historical read')
    r = Router(Local(), Live(), calendar=Exploding()).query(**query())
    assert 'freshness_assessment' not in r['metadata']
    assert 'remote_freshness' not in r['metadata']


# --- C05: native financial table-name alignment ---------------------------------


class FinLocal:
    def financials(self, table, symbols, latest_only=True):
        return [{'symbol': s, 'source': 'tdx_gpcw_observation', 'period_end': '2024-03-31'}
                for s in (symbols or [])]


class FinFinance:
    def rows(self, table, symbols, latest_only=True):
        return [{'symbol': s, 'source': 'eltdx:finance_batch', 'table': table}
                for s in (symbols or [])]


class FinFuyao:
    def statements(self, table, symbols):
        return [{'symbol': s, 'source': 'fuyao_offline', 'table': table}
                for s in (symbols or [])]


def _financial_router():
    r = Router(FinLocal(), Live())
    r._finance = FinFinance()
    r._fuyao = FinFuyao()
    return r


def test_financial_raw_routes_to_local_observation():
    r = _financial_router()
    res = r.query(dataset='financial', table='raw', symbols=['600031.SH'])
    assert res['rows'][0]['source'] == 'tdx_gpcw_observation'
    assert res['metadata']['pit_verified'] is False
    assert res['metadata']['field_mapping_verified'] is False
    assert res['metadata']['coverage'] == 'OBSERVED_ROWS_ONLY'


def test_financial_income_routes_to_offline_parquet():
    r = _financial_router()
    res = r.query(dataset='financial', table='income', symbols=['600031.SH'])
    assert res['rows'][0]['source'] == 'fuyao_offline'
    assert res['metadata']['table'] == 'income'
    assert res['metadata']['pit_verified'] is False


def test_financial_balance_alias_normalizes_to_balance_sheet():
    r = _financial_router()
    res = r.query(dataset='financial', table='balance', symbols=['600031.SH'])
    assert res['metadata']['table'] == 'balance_sheet'
    assert res['rows'][0]['table'] == 'balance_sheet'


def test_financial_metrics_routes_to_named_eltdx_fields():
    r = _financial_router()
    res = r.query(dataset='financial', table='metrics', symbols=['600031.SH'])
    assert res['rows'][0]['source'] == 'eltdx:finance_batch'
    assert res['metadata']['field_mapping_verified'] is True
    assert res['metadata']['pit_verified'] is False


def test_financial_unknown_table_rejected():
    r = _financial_router()
    with pytest.raises(ValueError):
        r.query(dataset='financial', table='bogus', symbols=['600031.SH'])
