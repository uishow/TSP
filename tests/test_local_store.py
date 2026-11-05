import pytest

from bridge import evidence as evidence_mod
from bridge.evidence import EvidenceLog
from bridge.local_store import LocalStore
from bridge.router import Router
from bridge.tdx_local import TDXLocal


@pytest.fixture(autouse=True)
def isolated_evidence(tmp_path, monkeypatch):
    """A02 writes real evidence records; keep tests off the live runtime file."""
    ev = EvidenceLog(tmp_path / 'evidence.jsonl', durable=False)
    monkeypatch.setattr(evidence_mod, 'default_evidence', lambda: ev)
    return ev


class FakeSDK:
    def __init__(self): self.calls=[]
    def get_data(self, **kwargs):
        self.calls.append(kwargs)
        return [{'date':20250102150000 if kwargs['frequency']!='1d' else 20250102,'open':20,'high':21,'low':19,'close':20,'volume':1200,'amount':24000}]
    def get(self,key): return [['复权:600031:20250102',{'mult':1.25,'cum':2.5}]]

def test_raw_price_explicit_and_end_full_day(tmp_path):
    sdk=FakeSDK();s=LocalStore(sdk=sdk, data_root=tmp_path,tdx=TDXLocal(vipdoc=tmp_path))
    rows=s.minute(['600031.SH'],'20250102','20250102',freq='5m')
    assert sdk.calls[0]['fq'] is None
    assert sdk.calls[0]['end']=='20250102235959'
    assert rows[0]['volume']==12 and rows[0]['close']==20

def test_factor_single_event_not_cumulative(tmp_path):
    rows=LocalStore(sdk=FakeSDK(),data_root=tmp_path,tdx=TDXLocal(vipdoc=tmp_path)).adj_factors(['600031.SH'],'20250101','20250103')
    assert rows[0]['ex_factor']==1.25

def test_historical_raw_parquet_and_near_segment(tmp_path):
    import pyarrow as pa,pyarrow.parquet as pq
    p=tmp_path/'parquet_5min'/'2024';p.mkdir(parents=True)
    pq.write_table(pa.Table.from_pylist([{'datetime':20241231150000,'code':'600031','open':30.,'high':31.,'low':29.,'close':30.,'open_qfq':15.,'high_qfq':15.5,'low_qfq':14.5,'close_qfq':15.,'volume_lots':100.,'amount':300000.}]),p/'600031.parquet')
    rows=LocalStore(sdk=FakeSDK(),data_root=tmp_path,tdx=TDXLocal(vipdoc=tmp_path)).minute(['600031.SH'],'20241231','20250102',freq='5m')
    assert len(rows)==2 and rows[0]['close']==30 and rows[0]['volume']==100

def test_instruments_exclude_funds_and_factors_fail_closed(tmp_path):
    import pytest
    from bridge.schemas import SourceUnavailable
    class SDK(FakeSDK):
        def get(self,key):return {'0':['000001'],'1':['159001'],'5':['510300'],'6':['600031'],'9':['920001']} if key=='股票代码' else None
    s=LocalStore(sdk=SDK(),data_root=tmp_path,tdx=TDXLocal(vipdoc=tmp_path))
    assert {x['symbol'] for x in s.instruments()}=={'000001.SZ','600031.SH','920001.BJ'}
    assert s.instruments()==s.instruments()
    with pytest.raises(SourceUnavailable):s.adj_factors(['600031.SH'],'20250101','20261103')
    with pytest.raises(SourceUnavailable):s.financials('metrics',['600031.SH'])
    assert s.source_status()['read_only'] is True

def test_daily_normalization_and_local_fallback(tmp_path):
    s=LocalStore(sdk=FakeSDK(),data_root=tmp_path,tdx=TDXLocal(vipdoc=tmp_path))
    rows=s.daily(['600031.SH'],'20250102','20250102')
    assert rows[0]['date']=='2025-01-02' and rows[0]['volume']==12
    assert s.source_status()['observed_samples']['1d']['latest']=='2025-01-02'

def test_frequency_and_instrument_validation(tmp_path):
    import pytest
    s=LocalStore(sdk=FakeSDK(),data_root=tmp_path,tdx=TDXLocal(vipdoc=tmp_path))
    with pytest.raises(ValueError):s.minute(['600031.SH'],'20250102','20250102',freq='2m')
    with pytest.raises(ValueError):s.instruments('arbitrary')
    assert s.instruments('index')==[] and s.instruments('etf')==[]

def test_disconnected_sdk_and_conflicts_are_visible(tmp_path):
    import pytest
    from bridge.schemas import SourceUnavailable
    class Broken:
        def get_data(self,**kwargs):raise ConnectionError('7899 disconnected')
    s=LocalStore(sdk=Broken(),data_root=tmp_path,tdx=TDXLocal(vipdoc=tmp_path))
    with pytest.raises(SourceUnavailable):s.daily(['600031.SH'],'20250102','20250102')
    assert s.source_status()['source_failures_recent']
    merged={'2025-01-02':{'date':'2025-01-02','source':'tdx_local','close':1}}
    s._merge(merged,[{'symbol':'600031.SH','date':'2025-01-02','source':'free_stockdb','close':2}],'date')
    assert s.source_status()['conflict_count']==1 and merged['2025-01-02']['close']==2

def test_instrument_names_and_share_count_are_local_observations(tmp_path):
    class SDK(FakeSDK):
        def get(self,key):return {'6':['600031']}
        def get_data(self,**kw):return {'600031':[{'date':20261103,'name':'三一重工','total_share':9195004437,'float_share':8474390037}]}
    s=LocalStore(sdk=SDK(),data_root=tmp_path,tdx=TDXLocal(vipdoc=tmp_path))
    row=s.instruments()[0]
    assert row['name']=='三一重工' and row['total_shares']==9195004437
    assert row['metadata_date']=='2026-11-03'

def test_boards_can_be_first_request_before_sdk_is_initialized(monkeypatch,tmp_path):
    import sys,types
    monkeypatch.delitem(sys.modules,'zhibiao',raising=False)
    class Index:
        def __init__(self,rows):pass
        def get(self):return []
    class SDK:
        def get(self,key):return []
    class Store(LocalStore):
        @property
        def sdk(self):
            monkeypatch.setitem(sys.modules,'zhibiao',types.SimpleNamespace(BoardIndex=Index))
            return SDK()
    s=Store(data_root=tmp_path,tdx=TDXLocal(export=tmp_path,vipdoc=tmp_path))
    assert s.boards()==[]


# -- A02: full conflict/failure evidence, no silent empty success ----------
def _store(tmp_path):
    return LocalStore(sdk=FakeSDK(), data_root=tmp_path, tdx=TDXLocal(vipdoc=tmp_path))


def test_conflict_record_keeps_both_values_versions_precision_and_reason(tmp_path, isolated_evidence):
    s = _store(tmp_path)
    merged = {'2025-01-02': {'symbol': '600031.SH', 'date': '2025-01-02',
                             'source': 'tdx_local', 'close': 1.0, 'volume': 10,
                             'source_version': 'tdx-v1'}}
    s._merge(merged, [{'symbol': '600031.SH', 'date': '2025-01-02',
                       'source': 'free_stockdb', 'close': 2.25, 'volume': 12,
                       'source_version': 'fsdb-v2'}], 'date')
    conflicts = [r for r in isolated_evidence.records() if r['kind'] == 'CONFLICT']
    assert len(conflicts) == 1
    payload = conflicts[0]['payload']
    assert payload['previous']['close'] == 1.0 and payload['selected']['close'] == 2.25
    assert payload['previous_source_version'] == 'tdx-v1'
    assert payload['selected_source_version'] == 'fsdb-v2'
    assert payload['precision']['close']['selected']['scale'] == 2
    assert payload['conflict_class'] == 'MATERIAL_VALUE_DISAGREEMENT'
    assert payload['requires_reconciliation'] is True
    assert payload['reconciled'] is False
    assert 'no unit or scale normalization' in payload['unit_policy']
    assert payload['selection'] and payload['reason']
    assert isolated_evidence.verify()['chain_ok']


def test_float32_rounding_is_not_reported_as_a_source_disagreement(tmp_path, isolated_evidence):
    s = _store(tmp_path)
    merged = {'d': {'symbol': '600031.SH', 'date': 'd', 'source': 'tdx_local',
                    'close': 15.729999542236328, 'volume': 100.0, 'amount': 37565352.0}}
    s._merge(merged, [{'symbol': '600031.SH', 'date': 'd', 'source': 'free_stockdb',
                       'close': 15.73, 'volume': 100.0, 'amount': 37565351.0}], 'date')
    conflicts = [r for r in isolated_evidence.records() if r['kind'] == 'CONFLICT']
    assert len(conflicts) == 1
    payload = conflicts[0]['payload']
    assert payload['conflict_class'] == 'PRECISION_ROUNDING_ONLY'
    assert payload['requires_reconciliation'] is False
    assert payload['previous']['close'] == 15.729999542236328
    assert payload['selected']['close'] == 15.73
    assert s.source_status()['material_conflict_count'] == 0
    assert s.source_status()['precision_rounding_conflicts'] == 1


def test_unit_scale_disagreement_is_material(tmp_path, isolated_evidence):
    s = _store(tmp_path)
    merged = {'d': {'symbol': '600031.SH', 'date': 'd', 'source': 'tdx_local',
                    'close': 15.73, 'volume': 1099096.0}}
    s._merge(merged, [{'symbol': '600031.SH', 'date': 'd', 'source': 'free_stockdb',
                       'close': 15.73, 'volume': 10990.96}], 'date')
    payload = [r for r in isolated_evidence.records() if r['kind'] == 'CONFLICT'][0]['payload']
    assert payload['conflict_class'] == 'MATERIAL_VALUE_DISAGREEMENT'
    assert payload['requires_reconciliation'] is True
    assert s.source_status()['material_conflict_count'] == 1


def test_conflicts_and_failures_are_not_truncated_to_twenty(tmp_path, isolated_evidence):
    s = _store(tmp_path)
    for day in range(25):
        merged = {str(day): {'symbol': '600031.SH', 'date': str(day),
                             'source': 'tdx_local', 'close': 1}}
        s._merge(merged, [{'symbol': '600031.SH', 'date': str(day),
                           'source': 'free_stockdb', 'close': 2}], 'date')
        s._record_failure(RuntimeError('probe %d' % day), {'dataset': 'daily'})
    assert len(s._conflicts) == 25 and len(s._failures) == 25
    kinds = isolated_evidence.verify()['kinds']
    assert kinds['CONFLICT'] == 25 and kinds['FAILED'] == 25
    assert s.source_status()['conflict_count'] == 25
    assert len(s.source_status()['conflicts_recent']) == 20  # status view only
    assert s.source_status()['conflicts_full_evidence']['truncated'] is False


def test_evidence_survives_a_restarted_store(tmp_path):
    from bridge.local_store import LocalStore as LS
    path = tmp_path / 'evidence.jsonl'
    first = LS(sdk=FakeSDK(), data_root=tmp_path, tdx=TDXLocal(vipdoc=tmp_path),
               evidence=EvidenceLog(path, durable=False))
    merged = {'d': {'symbol': '600031.SH', 'date': 'd', 'source': 'tdx_local', 'close': 1}}
    first._merge(merged, [{'symbol': '600031.SH', 'date': 'd',
                           'source': 'free_stockdb', 'close': 2}], 'date')
    restarted = LS(sdk=FakeSDK(), data_root=tmp_path, tdx=TDXLocal(vipdoc=tmp_path),
                   evidence=EvidenceLog(path, durable=False))
    assert restarted._conflict_count == 0  # fresh process state
    assert len(restarted.source_status()['conflicts_recent']) == 1  # disk evidence
    assert restarted.source_status()['conflicts_recent'][0]['selected_source'] == 'free_stockdb'


def test_router_marks_partial_local_read_as_degraded():
    class FakeLocal:
        def __init__(self, fail_on_read=True):
            self.n = 0
            self.fail_on_read = fail_on_read
        def read_health(self):
            return {'read_failure_count': self.n,
                    'recent_read_failures': ['7899 disconnected'] if self.n else [],
                    'degraded': bool(self.n)}
        def daily(self, **kw):
            if self.fail_on_read:
                self.n += 1  # upstream read failed, local bars only
            return [{'symbol': '600031.SH', 'date': '2026-11-04',
                     'close': 18.68, 'source': 'tdx_local'}]
        def instruments(self, **kw): return []
        def boards(self): return []

    from datetime import datetime
    router = Router(local=FakeLocal(), now=lambda: datetime(2026, 11, 4, 16, 0))
    normal = Router(local=FakeLocal(fail_on_read=False), now=lambda: datetime(2026, 11, 4, 16, 0))
    meta = router.query('daily', ['600031.SH'], '2026-11-04', '2026-11-04')['metadata']
    clean = normal.query('daily', ['600031.SH'], '2026-11-04', '2026-11-04')['metadata']
    assert meta['degraded_local_read'] is True
    assert meta['local_read_failures_delta'] == 1
    assert meta['coverage'] == 'PARTIAL_OBSERVED_ROWS_ONLY'
    assert meta['zero_fill'] is False
    assert meta['degraded_reasons'] == ['7899 disconnected']
    assert clean['degraded_local_read'] is False
    assert clean['coverage'] == 'OBSERVED_ROWS_ONLY'
