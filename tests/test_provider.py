import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'upstream'))
import pytest
from plugins.local_quant.provider import LocalQuantProvider

def test_dates_units_and_provenance():
    p=LocalQuantProvider();p._request=lambda *a,**k: {'rows':[{'symbol':'600031.SH','date':'2026-11-03','open':1,'high':2,'low':1,'close':2,'volume':12.5,'amount':1000,'source':'free-stockdb'}]}
    f=p.get_daily(['600031.SH'],'2026-11-01','2026-11-03')
    assert str(f.schema['date'])=='Date'
    assert f['volume'][0]==12.5 and f['source'][0]=='free-stockdb'
def test_error_is_not_empty():
    p=LocalQuantProvider()
    def failed(*args,**kw):raise RuntimeError('offline')
    p._request=failed
    with pytest.raises(RuntimeError):p.get_daily(['600031.SH'],None,None)
def test_minute_precision():
    p=LocalQuantProvider();p._request=lambda *a,**k:{'rows':[{'symbol':'600031.SH','datetime':'2026-11-03T15:00:00','close':2,'volume':1.25}]}
    f=p.get_minute(['600031.SH'],None,None,freq='5m')
    assert str(f.schema['datetime'])=='Datetime(time_unit=\'us\', time_zone=None)'
def test_capability_declaration():
    p=LocalQuantProvider()
    assert 'daily' in p.config.datasets
    assert p.config.datasets['minute'].pct_unit=='ratio'

def test_intraday_universe_is_split_below_bridge_limit():
    p=LocalQuantProvider();calls=[]
    def request(dataset,**kw):
        assert len(kw['symbols'])<=200
        assert kw['require_latest'] is True
        calls.extend(kw['symbols'])
        return {'rows':[]}
    p._request=request
    symbols=[f'{i:06}.SZ' for i in range(205)]
    p.get_intraday_batch(symbols)
    assert calls==symbols

def test_current_daily_requests_freshness_but_history_does_not():
    from datetime import datetime
    p=LocalQuantProvider();calls=[]
    def request(dataset,**kw):calls.append(kw);return {'rows':[]}
    p._request=request
    p.get_daily(['600031.SH'],'2020-01-01','2020-01-02')
    p.get_daily(['600031.SH'],'2020-01-01',datetime.now())
    assert calls[0].get('require_latest') is False
    assert calls[1].get('require_latest') is True

def test_depth5_and_financial_are_declared_in_both_config_and_manifest():
    import yaml
    from pathlib import Path
    p=LocalQuantProvider()
    manifest=yaml.safe_load(Path('plugins/local_quant/plugin.yaml').read_text())
    for name in ('realtime','depth5','financial'):
        assert name in p.config.datasets and name in manifest['datasets']

def test_realtime_uses_bridge_and_depth5_uses_native_bridge_rows():
    p=LocalQuantProvider();calls=[]
    def request(dataset,**kw):
        calls.append((dataset,kw))
        if dataset=='realtime':return {'rows':[{'symbol':'600031.SH','last_price':18.67}]}
        if dataset=='depth5':return {'rows':{'600031.SH':{'bid_volumes':[10]*5,'ask_volumes':[0]*5,'timestamp':1730000000000}}}
        return {'rows':[]}
    p._request=request
    assert p.get_realtime()[0]['last_price']==18.67
    assert calls[0][0]=='realtime' and 'symbols' not in calls[0][1]
    p.get_realtime_indices(['000001.SH'])
    assert calls[1][0]=='realtime' and calls[1][1]['symbols']==['000001.SH']
    assert calls[1][1]['asset_type']=='index'
    depth=p.get_depth_batch(['600031.SH'])
    assert depth['600031.SH']['bid_volumes']==[10]*5
    assert calls[2][0]=='depth5' and calls[2][1]['symbols']==['600031.SH']

def test_depth5_rejects_non_dict_rows_instead_of_silent_fallback():
    p=LocalQuantProvider()
    p._request=lambda *a,**k:{'rows':[]}
    with pytest.raises(RuntimeError,match='返回结构异常'):p.get_depth_batch(['600031.SH'])

def test_financial_table_names_are_normalized_for_upstream():
    p=LocalQuantProvider();calls=[]
    def request(dataset,**kw):
        calls.append(kw)
        return {'rows':[{'symbol':'600031.SH','source':'tdx_gpcw_period+eltdx_finance_snapshot',
                         'period_end':'2026-09-30','announce_date':None,'eps':0.87}]}
    p._request=request
    f=p.get_financials('balance',['600031.SH'],latest_only=False)
    assert calls[0]['table']=='balance_sheet' and calls[0]['latest_only'] is False
    assert f['announce_date'][0] is None and f['eps'][0]==0.87
    p.get_financials('cashflow',['600031.SH'])
    assert calls[1]['table']=='cash_flow'

def test_beijing_aware_times_are_normalized_before_bridge_serialization():
    from datetime import datetime,timezone
    from plugins.local_quant.provider import _value
    assert _value(datetime(2026,11,4,1,31,tzinfo=timezone.utc))=='2026-11-04T09:31:00'

def _fake_response(status,payload):
    import httpx
    class Resp:
        status_code=status
        def json(self):return payload
        def raise_for_status(self):
            if status>=400:
                raise httpx.HTTPStatusError(str(status),
                    request=httpx.Request('POST','http://bridge/query'),
                    response=httpx.Response(status))
    return Resp()

class _SequenceClient:
    def __init__(self,responses):self.responses=iter(responses);self.calls=0
    def post(self,url,json=None):self.calls+=1;return next(self.responses)

def test_429_is_retried_but_503_fails_closed_immediately(monkeypatch):
    from plugins.local_quant import provider as module
    monkeypatch.setattr(module.time,'sleep',lambda seconds:None)
    p=LocalQuantProvider()
    ok={'rows':[{'symbol':'600031.SH'}]}
    retry=_SequenceClient([_fake_response(429,{'detail':'Bridge rate limit; retry later'}),_fake_response(200,ok)])
    p._client=retry
    assert p._request('daily',symbols=['600031.SH'])==ok
    assert retry.calls==2
    closed=_SequenceClient([_fake_response(503,{'detail':'SourceUnavailable: no data'})])
    p._client=closed
    with pytest.raises(RuntimeError,match='禁止网络回退'):p._request('daily',symbols=['600031.SH'])
    assert closed.calls==1

def test_exhausted_429_retries_still_raise_explicit_error(monkeypatch):
    from plugins.local_quant import provider as module
    monkeypatch.setattr(module.time,'sleep',lambda seconds:None)
    p=LocalQuantProvider()
    p._client=_SequenceClient([_fake_response(429,{'detail':'busy'}) for _ in range(7)])
    with pytest.raises(RuntimeError,match='429 retries exhausted'):
        p._request('financial',symbols=['600031.SH'],table='shares')


def test_429_backoff_budget_stays_well_inside_30s_browser_timeout():
    from plugins.local_quant import provider as module
    delays=module.RETRY_DELAYS
    assert len(delays)==6 and all(d>0 for d in delays)
    assert sum(delays)<10, 'backoff must not reintroduce the 31s /api/kline/minute timeout'
    assert delays==tuple(sorted(delays))


# --- B05: capability declaration is wired to the admission-gated live layer ---


def test_realtime_capability_routes_through_admission_gate():
    p = LocalQuantProvider()
    captured = {}

    def request(dataset, **kw):
        # simulate the bridge returning a snapshot that already passed the
        # B01 admission gate (handshake date + per-symbol HHMM evidence).
        captured['dataset'] = dataset
        captured['kw'] = kw
        return {'rows': [{'symbol': '600031.SH', 'last_price': 18.67,
                          'clock_evidence': 'TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMM',
                          'session_phase': 'MORNING_SESSION', 'stale': False}]}
    p._request = request
    rows = p.get_realtime()
    # empty symbols => full-market snapshot path; no fabricated per-symbol pull
    assert captured['dataset'] == 'realtime'
    assert 'symbols' not in captured['kw'] or not captured['kw'].get('symbols')
    assert rows[0]['clock_evidence'] == 'TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMM'


def test_depth5_capability_carries_admission_labels_not_a_quote_fake():
    p = LocalQuantProvider()
    captured = {}

    def request(dataset, **kw):
        captured['dataset'] = dataset
        captured['kw'] = kw
        return {'rows': {'600031.SH': {'bid_volumes': [10] * 5, 'ask_volumes': [10] * 5,
                                       'timestamp': 1730000000000, 'stale': True,
                                       'session_phase': 'LUNCH_BREAK_FINAL_BOOK',
                                       'clock_evidence': 'TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMMSS'}}}
    p._request = request
    depth = p.get_depth_batch(['600031.SH'])
    assert captured['dataset'] == 'depth5'
    d = depth['600031.SH']
    assert d['stale'] is True
    assert d['clock_evidence'].endswith('HHMMSS')  # native 0x0547, not quote-derived
    assert d['session_phase'] == 'LUNCH_BREAK_FINAL_BOOK'


def test_financial_capability_keeps_pit_disabled_metadata():
    p = LocalQuantProvider()
    captured = {}

    def request(dataset, **kw):
        captured['kw'] = kw
        return {'rows': [{'symbol': '600031.SH', 'source': 'tdx_gpcw_observation',
                          'period_end': '2026-09-30', 'announce_date': None,
                          'pit_verified': False, 'field_mapping_verified': False}]}
    p._request = request
    p.get_financials('raw', ['600031.SH'])
    assert captured['kw']['table'] == 'raw'  # observation table passed through

