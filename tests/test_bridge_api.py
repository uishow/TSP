import json
import os
from pathlib import Path

import pytest
os.environ['TSP_BRIDGE_TOKEN'] = 'test-token-only'

from fastapi.testclient import TestClient
from bridge import evidence as evidence_mod
from bridge import server as server_mod
from bridge.evidence import EvidenceLog
from bridge.router import SourceUnavailable
from bridge.server import create_app

H = {'Authorization': 'Bearer test-token-only'}
BODY = {'dataset': 'daily', 'symbols': ['600031.SH']}


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    """Never let a test write into the real runtime evidence / audit files."""
    ev = EvidenceLog(tmp_path / 'evidence.jsonl', durable=False)
    monkeypatch.setattr(evidence_mod, 'default_evidence', lambda: ev)
    monkeypatch.setattr(server_mod, 'ROOT', tmp_path)
    return ev


class Router:
    fail = None

    def query(self, **kw):
        if self.fail:
            raise self.fail
        return {'rows': [], 'metadata': {'dataset': kw['dataset'], 'count': 0}}

    def status(self):
        return {'state': 'TEST'}


def client(router=None):
    return TestClient(create_app(router if router is not None else Router()))


def records(ev, kind=None, stage=None):
    return [r for r in ev.records()
            if (kind is None or r['kind'] == kind)
            and (stage is None or r['payload'].get('stage') == stage)]


# -- original contract regression -----------------------------------------
def test_requires_auth(): assert client().post('/query', json={'dataset': 'daily'}).status_code == 401
def test_rejects_bad_token(): assert client().get('/status', headers={'Authorization': 'Bearer no'}).status_code == 401
def test_strict_query(): assert client().post('/query', headers=H, json={'dataset': 'daily', 'url': 'https://evil'}).status_code == 422
def test_no_path_injection(): assert client().post('/query', headers=H, json={'dataset': 'daily', 'symbols': ['../../etc/passwd']}).status_code == 422
def test_limit_batch(): assert client().post('/query', headers=H, json={'dataset': 'daily', 'symbols': ['600031.SH'] * 201}).status_code == 422
def test_query_ok(): assert client().post('/query', headers=H, json=BODY).status_code == 200
def test_unknown_dataset(): assert client().post('/query', headers=H, json={'dataset': 'shell'}).status_code == 422
def test_dates_validated(): assert client().post('/query', headers=H, json={'dataset': 'daily', 'start_time': 'garbage'}).status_code == 422
def test_reversed_dates(): assert client().post('/query', headers=H, json={'dataset': 'daily', 'start_time': '2026-11-04', 'end_time': '2026-11-03'}).status_code == 422


def test_compact_dates_are_normalized_not_silently_empty():
    from bridge.server import Query
    q = Query(dataset='minute', symbols=['600031.SH'], start_time='20241231', end_time='20250102150000')
    assert q.start_time == '2024-12-31'
    assert q.end_time == '2025-01-02T15:00:00'


# -- A03: query/outcome persistence, decision time, purpose, scope ---------
def test_success_outcome_is_persisted_with_full_scope(isolated):
    body = dict(BODY, as_of='2026-11-05T15:00:00', purpose='backtest')
    assert client().post('/query', headers=H, json=body).status_code == 200
    ok = records(isolated, 'SUCCESS')
    assert len(ok) == 1
    rec = ok[0]
    assert rec['payload']['status_code'] == 200
    assert rec['payload']['query']['as_of'] == '2026-11-05T15:00:00'
    assert rec['payload']['query']['purpose'] == 'backtest'
    assert rec['payload']['outcome']['row_count'] == 0
    assert rec['scope']['max_symbols'] == 200
    assert rec['scope']['symbol_count'] == 1
    assert rec['scope']['as_of'] == '2026-11-05T15:00:00'
    assert rec['scope']['arbitrary_sql_path_url'] is False
    assert rec['scope']['fixed_datasets_only'] is True
    assert rec['payload_sha256'] and rec['prev_sha256']
    assert isolated.verify()['chain_ok']


def test_source_failure_is_persisted_as_failed_outcome(isolated):
    r = Router()
    r.fail = SourceUnavailable('Latest request returned no observations')
    resp = client(r).post('/query', headers=H, json=BODY)
    assert resp.status_code == 503
    failed = records(isolated, 'FAILED', stage='source')
    assert len(failed) == 1
    assert failed[0]['payload']['status_code'] == 503
    assert failed[0]['payload']['reason'] == 'SourceUnavailable'
    assert failed[0]['payload']['query']['dataset'] == 'daily'
    assert failed[0]['purpose'] == 'other'


def test_validation_failure_is_persisted_before_reaching_router(isolated):
    resp = client().post('/query', headers=H,
                         json={'dataset': 'daily', 'symbols': ['../../etc/passwd']})
    assert resp.status_code == 422
    failed = records(isolated, 'FAILED', stage='validation')
    assert len(failed) == 1
    assert failed[0]['payload']['reason'] == 'INVALID_QUERY'
    assert failed[0]['payload']['status_code'] == 422


def test_unauthorized_request_is_persisted_as_failed_outcome(isolated):
    assert client().post('/query', json={'dataset': 'daily'}).status_code == 401
    failed = records(isolated, 'FAILED', stage='auth')
    assert len(failed) == 1
    assert failed[0]['payload']['reason'] == 'UNAUTHORIZED'
    assert failed[0]['payload']['query'] is None
    assert 'token' not in json.dumps(failed[0]).lower().replace('token_present', '')


def test_as_of_earlier_than_window_end_is_rejected(isolated):
    resp = client().post('/query', headers=H,
                         json={'dataset': 'daily', 'symbols': ['600031.SH'],
                               'start_time': '2026-11-01', 'end_time': '2026-11-05',
                               'as_of': '2026-11-04T15:00:00', 'purpose': 'backtest'})
    assert resp.status_code == 422
    assert not records(isolated, 'SUCCESS')
    assert records(isolated, 'FAILED', stage='validation')


def test_as_of_rejects_timezone_and_unknown_purpose(isolated):
    assert client().post('/query', headers=H,
                         json=dict(BODY, as_of='2026-11-05T15:00:00+08:00')).status_code == 422
    assert client().post('/query', headers=H,
                         json=dict(BODY, purpose='free-for-all')).status_code == 422
    assert not records(isolated, 'SUCCESS')


def test_evidence_context_does_not_leak_into_fixed_router_contract(isolated):
    seen = {}

    class Spy(Router):
        def query(self, **kw):
            seen.update(kw)
            return super().query(**kw)

    assert client(Spy()).post('/query', headers=H,
                              json=dict(BODY, as_of='2026-11-05T15:00:00',
                                        purpose='scan')).status_code == 200
    assert seen['dataset'] == 'daily' and seen['symbols'] == ['600031.SH']
    assert 'as_of' not in seen and 'purpose' not in seen


def test_legacy_source_audit_keeps_original_shape(isolated, tmp_path):
    assert client().post('/query', headers=H,
                         json=dict(BODY, as_of='2026-11-05T15:00:00')).status_code == 200
    line = (tmp_path / 'runtime' / 'source-audit.jsonl').read_text().splitlines()
    assert len(line) == 1
    doc = json.loads(line[0])
    assert set(doc) == {'query', 'metadata'}
    assert 'as_of' not in doc['query'] and 'purpose' not in doc['query']
    assert doc['metadata']['dataset'] == 'daily'


def test_status_exposes_evidence_health(isolated):
    resp = client().get('/status', headers=H)
    assert resp.status_code == 200
    state = resp.json()['evidence']
    assert state['enabled'] is True and state['write_failures'] == 0
    assert state['schema_version'] == 'tsp-evidence/1'


# -- Burst admission: prevent 429 backoff storms on /api/kline/minute ------
def _query_endpoint(app):
    return next(r.endpoint for r in app.routes if getattr(r, 'path', None) == '/query')


def _burst(app, count=6):
    """Call the route directly so auth dependencies stay out of the way."""
    from concurrent.futures import ThreadPoolExecutor
    from fastapi import HTTPException
    from bridge.server import Query
    endpoint = _query_endpoint(app)

    def one(_):
        try:
            endpoint(Query(**BODY))
            return 200
        except HTTPException as exc:
            return exc.status_code

    with ThreadPoolExecutor(max_workers=count) as pool:
        return list(pool.map(one, range(count)))


class SlowRouter(Router):
    def query(self, **kw):
        import time
        time.sleep(0.25)
        return super().query(**kw)


def test_concurrent_burst_is_queued_inside_bridge_not_rejected(monkeypatch, isolated):
    monkeypatch.setenv('TSP_BRIDGE_MAX_CONCURRENCY', '2')
    monkeypatch.setenv('TSP_BRIDGE_QUEUE_WAIT', '3')
    app = create_app(SlowRouter())
    assert _burst(app) == [200] * 6  # no immediate 429, no caller-side backoff
    assert not [r for r in isolated.records() if r['kind'] == 'FAILED']


def test_zero_queue_wait_still_fails_closed_with_429(monkeypatch, isolated):
    monkeypatch.setenv('TSP_BRIDGE_MAX_CONCURRENCY', '1')
    monkeypatch.setenv('TSP_BRIDGE_QUEUE_WAIT', '0')
    codes = _burst(create_app(SlowRouter()), count=4)
    assert 200 in codes and 429 in codes  # bounded, never a silent pass-through
    busy = [r for r in isolated.records()
            if r['kind'] == 'FAILED' and r['payload'].get('reason') == 'BRIDGE_BUSY']
    # max_concurrency is clamped to a floor of 2, so a burst of 4 with zero
    # queue wait still yields both 200 and 429.
    assert busy and busy[0]['payload']['max_concurrency'] == 2


def test_status_reports_admission_limits(monkeypatch, isolated):
    monkeypatch.setenv('TSP_BRIDGE_MAX_CONCURRENCY', '5')
    monkeypatch.setenv('TSP_BRIDGE_QUEUE_WAIT', '2.5')
    admission = client().get('/status', headers=H).json()['admission']
    assert admission['max_concurrency'] == 5
    assert admission['queue_wait_seconds'] == 2.5
    assert admission['policy'] == 'bounded queue, no silent fallback'


# -- Bulky conflicts: bound the persisted copies, keep the HTTP contract ----
class ConflictRouter(Router):
    def __init__(self, conflicts):
        self.conflicts = conflicts

    def query(self, **kw):
        return {'rows': [], 'metadata': {'dataset': kw['dataset'], 'count': 0,
                                         'conflicts': self.conflicts}}


def test_large_conflict_list_is_bounded_in_both_persisted_logs_but_not_in_response(
        isolated, tmp_path):
    conflicts = [{'symbol': '%06d.SH' % i, 'field': 'low',
                  'previous': 1.0, 'selected': 1.0 + i * 1e-4} for i in range(40)]
    resp = client(ConflictRouter(conflicts)).post('/query', headers=H, json=BODY)
    assert resp.status_code == 200
    # Upstream provider contract is untouched: full detail still in the response.
    assert resp.json()['metadata']['conflicts'] == conflicts

    ok = records(isolated, 'SUCCESS')
    ref = ok[0]['payload']['outcome']['metadata']['conflicts']
    assert ref['count'] == 40 and ref['sha256'] and ref['bytes'] > 0
    assert ref['sample'] == conflicts[:2]
    sidecar = Path(ref['path'])
    assert sidecar.is_file()
    assert json.loads(sidecar.read_text()) == conflicts
    # The evidence chain stays small and intact even with a large upstream detail.
    assert isolated.verify()['chain_ok']
    assert isolated.verify()['bytes'] < 100_000

    audit = json.loads((tmp_path / 'runtime' / 'source-audit.jsonl').read_text().splitlines()[0])
    assert audit['metadata']['conflicts']['sha256'] == ref['sha256']


def test_small_conflict_list_stays_inline(isolated, tmp_path):
    conflicts = [{'symbol': '600031.SH', 'field': 'low'}] * 3
    assert client(ConflictRouter(conflicts)).post('/query', headers=H, json=BODY).status_code == 200
    ok = records(isolated, 'SUCCESS')
    assert ok[0]['payload']['outcome']['metadata']['conflicts'] == conflicts
    audit = json.loads((tmp_path / 'runtime' / 'source-audit.jsonl').read_text().splitlines()[0])
    assert audit['metadata']['conflicts'] == conflicts


def test_conflict_sidecar_is_deduplicated_across_requests(isolated, tmp_path):
    conflicts = [{'i': i} for i in range(12)]
    c = client(ConflictRouter(conflicts))
    assert c.post('/query', headers=H, json=BODY).status_code == 200
    assert c.post('/query', headers=H, json=BODY).status_code == 200
    parts = list((tmp_path / 'runtime' / 'evidence-parts').iterdir())
    assert len(parts) == 1
    refs = [r['payload']['outcome']['metadata']['conflicts']
            for r in records(isolated, 'SUCCESS')]
    assert refs[0]['path'] == refs[1]['path']
    assert isolated.verify()['chain_ok']
