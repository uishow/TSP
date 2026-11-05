"""Regression coverage for the read-only operations doctor."""
import json
import os
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

import polars as pl
import pytest

from bridge.evidence import EvidenceLog

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import doctor  # noqa: E402

COMPOSE = f"""name: tsp-local
services:
  app:
    image: ghcr.io/shy3130/tick-stock-panel@{doctor.PINNED_DIGEST}
    pull_policy: never
    ports:
      - "127.0.0.1:3018:3018"
    environment:
      TSP_SOURCE_POLICY: "1"
    volumes:
      - ./data-local:/app/data
"""


def _env_files(tmp_path, mode=0o600):
    env = tmp_path / '.env'
    env.write_text('TSP_BRIDGE_TOKEN=bridge-token-123456\nTICKFLOW_API_KEY=\n')
    runtime = tmp_path / 'runtime'
    runtime.mkdir(exist_ok=True)
    fuyao = runtime / 'fuyao.env'
    fuyao.write_text('FUYAO_API_KEY=fuyao-secret-987654\n')
    os.chmod(env, mode)
    os.chmod(fuyao, mode)
    return env, fuyao


def test_compose_invariants_detect_digest_change_and_runtime_mount():
    assert doctor.check_compose(COMPOSE)['status'] == 'PASS'
    assert doctor.check_compose(COMPOSE.replace(doctor.PINNED_DIGEST, 'sha256:deadbeef'))['status'] == 'FAIL'
    assert doctor.check_compose(COMPOSE.replace('./data-local:/app/data', './runtime:/app/runtime'))['status'] == 'FAIL'


def test_credentials_uses_real_value_not_variable_name(tmp_path):
    _env_files(tmp_path)
    (tmp_path / 'bridge').mkdir()
    (tmp_path / 'bridge' / 'reader.py').write_text('os.environ["FUYAO_API_KEY"]')
    result = doctor.check_credentials(tmp_path, COMPOSE)
    assert result['status'] == 'PASS'
    assert result['evidence']['scanned_text_files'] >= 1

    (tmp_path / 'docs').mkdir()
    (tmp_path / 'docs' / 'notes.md').write_text('key = fuyao-secret-987654')
    leaked = doctor.check_credentials(tmp_path, COMPOSE)
    assert leaked['status'] == 'FAIL'
    assert str(Path('docs') / 'notes.md') in leaked['evidence']['leak_files']
    assert 'fuyao-secret-987654' not in json.dumps(leaked, ensure_ascii=False)


def test_credentials_require_0600_and_no_runtime_mount(tmp_path):
    _env_files(tmp_path, mode=0o644)
    assert doctor.check_credentials(tmp_path, COMPOSE)['status'] == 'FAIL'
    assert doctor.check_credentials(tmp_path, COMPOSE + '      - ./runtime:/app/runtime\n')['status'] == 'FAIL'


def test_matrix_rejects_vendor_effective_provider():
    payload = {'tickflow_tier': 'disabled', 'capabilities': [
        {'id': 'daily', 'usable': True, 'effective': 'local_quant'}]}
    assert doctor.check_matrix(payload)['status'] == 'PASS'
    payload['capabilities'][0]['effective'] = 'tickflow'
    assert doctor.check_matrix(payload)['status'] == 'FAIL'
    payload['capabilities'][0]['effective'] = 'local_quant'
    payload['tickflow_tier'] = 'pro'
    assert doctor.check_matrix(payload)['status'] == 'FAIL'


def _manifest(tmp_path, **overrides):
    meta = {
        'imported_at': '2026-11-04T21:16:19+08:00',
        'boards': {'complete': True}, 'financial': {'complete': True},
        'pit_enabled': False, 'key_present_in_this_file': False,
        'report_date_verdict': {
            'verdict': 'REPORT_DATE_MS_IS_NOT_A_VERIFIED_PIT_DISCLOSURE_DATE'},
    }
    meta.update(overrides)
    target = tmp_path / 'data-local' / 'fuyao'
    target.mkdir(parents=True, exist_ok=True)
    (target / 'manifest.json').write_text(json.dumps(meta), encoding='utf-8')
    return target / 'manifest.json'


def test_offline_checks_semantics_completeness_and_age(tmp_path):
    _manifest(tmp_path)
    now = datetime(2026, 11, 5, tzinfo=timezone.utc)
    assert doctor.check_offline(tmp_path, now=now)['status'] == 'PASS'
    assert doctor.check_offline(tmp_path, now=datetime(2026, 12, 5, tzinfo=timezone.utc))['status'] == 'WARN'
    _manifest(tmp_path, pit_enabled=True)
    assert doctor.check_offline(tmp_path, now=now)['status'] == 'FAIL'
    _manifest(tmp_path, boards={'complete': False})
    assert doctor.check_offline(tmp_path, now=now)['status'] == 'FAIL'


def test_financial_pit_detects_announce_date_and_reports_unverifiable(tmp_path):
    for table in doctor.FINANCIAL_TABLES:
        target = tmp_path / 'data-local' / 'financials' / table
        target.mkdir(parents=True)
        pl.DataFrame({'symbol': ['600031.SH'], 'announce_date': [None],
                      'pit_verified': [False]}).write_parquet(target / 'part.parquet')
    assert doctor.check_financial_pit(tmp_path)['status'] == 'PASS'
    pl.DataFrame({'symbol': ['600031.SH'], 'announce_date': ['2026-03-31'],
                  'pit_verified': [False]}).write_parquet(
        tmp_path / 'data-local' / 'financials' / 'income' / 'part.parquet')
    assert doctor.check_financial_pit(tmp_path)['status'] == 'FAIL'
    (tmp_path / 'data-local' / 'financials' / 'shares' / 'part.parquet').unlink()
    assert doctor.check_financial_pit(tmp_path)['evidence']['unverifiable']


def test_official_tables_checks_rows_slash_and_monitor_fields(tmp_path):
    for cid, column in (('fuyao_ths_concept', '所属概念'),
                        ('fuyao_ths_industry', '所属同花顺行业')):
        target = tmp_path / 'data-local' / 'ext_data' / cid
        target.mkdir(parents=True)
        pl.DataFrame({'symbol': ['600031.SH'], column: ['半导体']}).write_parquet(target / 'part.parquet')
    prefs = tmp_path / 'data-local' / 'user_data'
    prefs.mkdir(parents=True)
    (prefs / 'preferences.json').write_text(json.dumps({'monitor_ext_fields': {
        kind: {'field': field} for kind, field in doctor.OFFICIAL_FIELDS.items()}}))
    assert doctor.check_official_tables(tmp_path)['status'] == 'PASS'
    pl.DataFrame({'symbol': ['600031.SH'], '所属概念': ['TDX/家居']}).write_parquet(
        tmp_path / 'data-local' / 'ext_data' / 'fuyao_ths_concept' / 'part.parquet')
    assert doctor.check_official_tables(tmp_path)['status'] == 'FAIL'


def test_log_and_mainline_checks_are_informational(tmp_path):
    (tmp_path / 'runtime').mkdir()
    (tmp_path / 'runtime' / 'source-audit.jsonl').write_bytes(b'x' * 100)
    assert doctor.check_logs(tmp_path, limit=10)['status'] == 'WARN'
    assert doctor.check_logs(tmp_path, limit=1000)['status'] == 'PASS'
    target = tmp_path / 'data-local' / 'mainline_history'
    target.mkdir(parents=True)
    pl.DataFrame({'date': ['2025-11-05', '2026-11-03'], 'member': ['A', 'B']}).write_parquet(
        target / 'part.parquet')
    history = doctor.check_mainline_history(tmp_path)
    assert history['status'] == 'WARN' and history['evidence']['rows'] == 2


def test_log_hygiene_watches_the_evidence_log_too(tmp_path):
    (tmp_path / 'runtime').mkdir()
    (tmp_path / 'runtime' / 'source-audit.jsonl').write_bytes(b'x' * 5)
    (tmp_path / 'runtime' / 'evidence.jsonl').write_bytes(b'y' * 100)
    result = doctor.check_logs(tmp_path, limit=10)
    assert result['status'] == 'WARN'
    assert 'runtime/evidence.jsonl' in result['evidence']['over_limit']


def test_evidence_chain_check_detects_tampering(tmp_path):
    assert doctor.check_evidence_chain(tmp_path)['status'] == 'PASS'  # not created yet
    (tmp_path / 'bridge').mkdir()
    shutil.copy(ROOT / 'bridge' / 'evidence.py', tmp_path / 'bridge' / 'evidence.py')
    runtime = tmp_path / 'runtime'
    runtime.mkdir()
    ev = EvidenceLog(runtime / 'evidence.jsonl', durable=False)
    ev.append('SUCCESS', {'n': 1})
    ev.append('FAILED', {'n': 2})
    intact = doctor.check_evidence_chain(tmp_path)
    assert intact['status'] == 'PASS' and intact['evidence']['records'] == 2

    lines = (runtime / 'evidence.jsonl').read_text().splitlines()
    tampered = json.loads(lines[0])
    tampered['payload']['n'] = 999
    (runtime / 'evidence.jsonl').write_text(
        json.dumps(tampered, sort_keys=True, separators=(',', ':')) + '\n' + lines[1] + '\n')
    broken = doctor.check_evidence_chain(tmp_path)
    assert broken['status'] == 'FAIL'
    assert broken['evidence']['damaged'] == 1


def test_runtime_services_identity_matrix_pit_and_note(monkeypatch, tmp_path):
    def fake(url, timeout=3, token=None):
        if '7818' in url and url.endswith('/health'):
            return 200, {'service': 'tsp-local-readonly-bridge'}
        if 'capability-matrix' in url:
            return 200, {'tickflow_tier': 'disabled', 'capabilities': [
                {'id': 'daily', 'usable': True, 'effective': 'local_quant'}]}
        if url.endswith('/status'):
            return 200, {'fuyao_pit': 'DISABLED_REPORT_DATE_MS_NOT_A_VERIFIED_DISCLOSURE_DATE'}
        if 'mainline' in url:
            return 200, {'membership_note': '历史未回补，口径不可直接比较'}
        return 200, {}

    monkeypatch.setattr(doctor, 'http_get', fake)
    results = doctor.check_runtime_services(tmp_path, timeout=1)
    assert all(item['status'] != 'FAIL' for item in results)
    assert {item['name'] for item in results} >= {
        'panel_root', 'bridge_health', 'capability_matrix',
        'bridge_pit_status', 'mainline_note'}


@pytest.mark.parametrize('value', ['2026-11-04T21:16:19+08:00', '2026-11-04T13:16:19Z', 1762250000])
def test_parse_time_handles_offsets_z_and_epoch(value):
    assert doctor.parse_time(value).tzinfo is not None


def test_skip_network_run_is_json_serializable(tmp_path):
    results = doctor.run_checks(tmp_path, skip_network=True)
    assert results and json.dumps(results, ensure_ascii=False)


def test_index_daily_sessions_warns_until_two_partitions_exist(tmp_path):
    target = tmp_path / 'data-local' / 'kline_index_daily'
    (target / 'date=2026-11-04').mkdir(parents=True)
    (target / 'date=2026-11-04' / 'part.parquet').write_bytes(b'x')
    single = doctor.check_index_daily_sessions(tmp_path)
    assert single['status'] == 'WARN' and single['evidence']['sessions'] == 1
    (target / 'date=2026-11-03').mkdir(parents=True)
    (target / 'date=2026-11-03' / 'part.parquet').write_bytes(b'x')
    assert doctor.check_index_daily_sessions(tmp_path)['status'] == 'PASS'
