"""Regression tests for the host-side offline fuyao enhancement.

No test needs a real API key or a network call: the client is always faked and
all persistence goes through tmp_path. The invariants under test are that the
container never gains a vendor path, that announce_date is never invented and
that official classifications never overwrite the built-in local tables.
"""
from pathlib import Path
from types import SimpleNamespace

import pytest

from bridge import fuyao_offline as f
from bridge.finance import FinancialSources
from bridge.router import Router
from bridge.server import Query


# --------------------------------------------------------------------------
# key handling
# --------------------------------------------------------------------------

def test_key_prefers_environment_then_host_only_file(monkeypatch, tmp_path):
    monkeypatch.delenv(f.KEY_ENV, raising=False)
    keyfile = tmp_path / 'fuyao.env'
    keyfile.write_text('# comment\nFUYAO_API_KEY=host-file-value\n', encoding='utf-8')
    monkeypatch.setattr(f, 'KEY_FILE', keyfile)
    assert f.load_api_key() == ('host-file-value', 'host-only-file:fuyao.env')
    monkeypatch.setenv(f.KEY_ENV, 'env-value')
    assert f.load_api_key() == ('env-value', f'environment:{f.KEY_ENV}')
    assert f.load_api_key('cli-value')[1] == 'cli-argument'


def test_missing_key_fails_closed_without_leaking_paths(monkeypatch, tmp_path):
    monkeypatch.delenv(f.KEY_ENV, raising=False)
    monkeypatch.setattr(f, 'KEY_FILE', tmp_path / 'absent.env')
    with pytest.raises(f.FuyaoOfflineError, match='未找到 FUYAO_API_KEY'):
        f.load_api_key()


# --------------------------------------------------------------------------
# time + report date semantics
# --------------------------------------------------------------------------

def test_date_of_ms_uses_beijing_midnight_offset():
    assert f.date_of_ms(1790697600000) == '2026-09-30'
    assert f.date_of_ms(None) is None
    assert f.date_of_ms('bad') is None
    assert f.date_of_ms(0) is None


@pytest.mark.parametrize('period,report,expected', [
    ('2026-09-30', '2026-10-30', f.QUALITY_CANDIDATE),
    ('2025-09-30', '2026-10-30', f.QUALITY_BACKFILL),
    ('2026-09-30', '2026-09-01', f.QUALITY_NEGATIVE),
    ('2026-09-30', '2026-10-02', f.QUALITY_SHORT),
    ('2026-09-30', None, f.QUALITY_MISSING),
])
def test_report_date_quality_labels(period, report, expected):
    assert f.classify_report_date(period, report) == expected


def _raw(period_end_ms, report_date_ms, **values):
    return {
        'thscode': '600031.SH', 'ticker': '600031', 'period': 'quarterly',
        'fiscal_year': 2026, 'fiscal_period': 'Q3', 'currency': 'CNY',
        'period_end_ms': period_end_ms, 'report_date_ms': report_date_ms,
        'operating_income': 123.4, **values,
    }


def test_normalize_statement_never_writes_announce_date():
    row = f.normalize_statement('income', '600031.SH',
                                _raw(1790697600000, 1793289600000), 'now')
    assert 'announce_date' not in row
    assert row['announce_date_candidate'] == '2026-10-30'
    assert row['report_date_quality'] == f.QUALITY_CANDIDATE
    assert row['revenue'] == 123.4
    assert row['pit_verified'] is False
    assert row['announce_date_verified'] is False
    assert row['field_mapping_verified'] is False
    assert row['source'] == 'fuyao:income'


def test_normalize_statement_marks_backfill_and_keeps_null_candidate():
    row = f.normalize_statement('cash_flow', '600031.SH',
                                _raw(1759161600000, 1793289600000), 'now')
    assert row['report_date_quality'] == f.QUALITY_BACKFILL
    assert row['announce_date_candidate'] is None
    assert row['pit_verified'] is False


def test_cross_table_conflict_never_becomes_a_candidate():
    statements = {
        'income': [{'symbol': '600031.SH', 'period_end': '2025-12-31',
                    'report_date': '2026-03-31', 'report_date_quality': f.QUALITY_CANDIDATE}],
        'balance_sheet': [{'symbol': '600031.SH', 'period_end': '2025-12-31',
                           'report_date': '2026-10-30', 'report_date_quality': f.QUALITY_CANDIDATE}],
        'cash_flow': [{'symbol': '600031.SH', 'period_end': '2025-12-31',
                       'report_date': '2026-03-31', 'report_date_quality': f.QUALITY_CANDIDATE}],
    }
    rows = f.resolve_announce_candidates(statements)
    assert len(rows) == 1
    assert rows[0]['report_date_quality'] == f.QUALITY_CONFLICT
    assert rows[0]['announce_date_candidate'] is None
    assert rows[0]['pit_verified'] is False


def test_cross_table_agreement_yields_candidate_but_no_pit_claim():
    statements = {
        name: [{'symbol': '600031.SH', 'period_end': '2026-09-30',
                'report_date': '2026-10-30', 'report_date_quality': f.QUALITY_CANDIDATE}]
        for name in f.STATEMENT_PATHS
    }
    rows = f.resolve_announce_candidates(statements)
    assert rows[0]['announce_date_candidate'] == '2026-10-30'
    assert rows[0]['report_date_quality'] == f.QUALITY_CANDIDATE
    assert rows[0]['pit_verified'] is False
    assert rows[0]['announce_date_verified'] is False


# --------------------------------------------------------------------------
# read-only store + finance cross-reference
# --------------------------------------------------------------------------

def test_store_reads_products_without_key_or_network(tmp_path):
    f.write_parquet([{'symbol': '600031.SH', 'period_end': '2026-09-30',
                      'announce_date_candidate': '2026-10-30', 'pit_verified': False}],
                    tmp_path / 'financial_announce_candidates.parquet')
    store = f.FuyaoStore(tmp_path)
    assert store.candidates()[0]['announce_date_candidate'] == '2026-10-30'
    assert store.candidate_index()[('600031.SH', '2026-09-30')]['pit_verified'] is False
    status = store.status()
    assert status['key_in_manifest'] is False
    assert status['container_network'] == 'UNCHANGED_BLOCKED'
    assert status['pit_verified'] is False


class _Tdx:
    vipdoc = Path('/nonexistent-vipdoc')


class _Live:
    def finance_snapshot(self, symbols):
        return {}


class _FakeFuyao:
    def candidate_index(self):
        return {('600031.SH', '2026-09-30'): {
            'report_date': '2026-10-30',
            'announce_date_candidate': '2026-10-30',
            'report_date_quality': f.QUALITY_CANDIDATE,
        }}


def test_finance_observation_attaches_candidate_but_keeps_pit_closed(monkeypatch):
    from bridge import finance
    monkeypatch.setattr(finance, 'gpcw_index', lambda *a, **k: {
        '600031': [('2026-09-30', 0.87, 10.2, 'gpcw20260930.dat')],
    })
    rows = FinancialSources(_Tdx(), _Live(), fuyao=_FakeFuyao()).rows(
        'metrics', ['600031.SH'])
    row = rows[0]
    assert row['announce_date'] is None and row['ann_date'] is None
    assert row['pit_verified'] is False and row['announce_date_verified'] is False
    assert row['fuyao_crossref_present'] is True
    assert row['fuyao_announce_date_candidate'] == '2026-10-30'
    assert row['fuyao_report_date_quality'] == f.QUALITY_CANDIDATE
    assert row['fuyao_pit_verified'] is False
    assert 'PIT' in row['note']


# --------------------------------------------------------------------------
# bridge query contract
# --------------------------------------------------------------------------

class _FakeStore(_FakeFuyao):
    def status(self):
        return {'available': True, 'pit_verified': False}

    def statements(self, table, symbols=None):
        return [{'symbol': '600031.SH', 'source': f'fuyao:{table}',
                 'pit_verified': False}]

    def candidates(self):
        return [{'symbol': '600031.SH', 'announce_date_candidate': '2026-10-30'}]

    def membership(self, kind):
        return [{'symbol': '600031.SH', 'board_name': '工程机械',
                 'taxonomy': f'ths_official_{kind}'}]


class _Local:
    tdx = _Tdx()

    def source_status(self):
        return {'state': 'test'}


def _router():
    r = Router(_Local(), _Live())
    r._fuyao = _FakeStore()
    return r


@pytest.mark.parametrize('table', ['status', 'income', 'balance_sheet',
                                   'cash_flow', 'announce_candidates',
                                   'concept', 'industry'])
def test_router_fuyao_tables_are_read_only_and_labelled(table):
    result = _router().query(dataset='fuyao', table=table, symbols=['600031.SH'])
    meta = result['metadata']
    assert meta['coverage'] == 'HOST_OFFLINE_IMPORT_READ_ONLY'
    assert meta['no_network_access'] is True
    assert meta['key_in_container'] is False
    assert meta['pit_verified'] is False
    assert result['rows']


def test_bridge_query_accepts_fuyao_and_requires_symbols_except_status():
    q = Query(dataset='fuyao', table='status')
    assert q.table == 'status'
    q = Query(dataset='fuyao', table='concept', symbols=['600031.SH'])
    assert q.symbols == ['600031.SH']
    with pytest.raises(ValueError, match='Explicit symbol list'):
        Query(dataset='fuyao', table='income')


def test_official_adapter_has_no_provider_or_container_hook():
    source = Path(f.__file__).read_text(encoding='utf-8')
    assert 'register_provider' not in source
    assert 'install_network_guard' not in source
    assert 'data-local/fuyao' in source or 'OUT_DIR' in source
