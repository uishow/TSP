"""C02: local financial observation verification (fixed read-only)."""
from pathlib import Path
import pytest
from bridge.local_financial import LocalFinancial
from bridge.tdx_local import TDXLocal


def _make_local(tmp_path):
    cw = tmp_path / 'cw'
    lf = LocalFinancial(TDXLocal(vipdoc=tmp_path))
    lf.build_synthetic_gpcw(cw / 'gpcw20240331.dat', 20240331, '600031', [1.5, 2.25, 3.0])
    lf.build_synthetic_gpcw(cw / 'gpcw20240630.dat', 20240630, '000001', [9.0, 8.0])
    return lf


def test_observation_rows_are_labelled_unverified(tmp_path):
    lf = _make_local(tmp_path)
    rows = lf.observation(['600031.SH'])
    assert len(rows) == 1
    r = rows[0]
    assert r['symbol'] == '600031.SH'
    assert r['period_end'] == '2024-03-31'
    assert r['announce_date'] is None
    assert r['field_mapping_verified'] is False
    assert r['pit_verified'] is False
    # raw numbered columns are retained, not mapped
    assert 'col1' in r and r['col1'] == 1.5


def test_audit_local_files_enumerates_periods(tmp_path):
    lf = _make_local(tmp_path)
    report = lf.audit_local_files(tmp_path)
    assert report['file_count'] == 2
    assert report['period_count'] == 2
    assert set(report['periods']) == {'20240331', '20240630'}
    assert report['total_bytes'] > 0
    assert 'no remote backfill' in report['note']


def test_coverage_lists_every_native_table(tmp_path):
    lf = _make_local(tmp_path)
    cov = lf.coverage(['600031.SH'])
    tables = {c['table'] for c in cov}
    assert {'metrics', 'income', 'balance_sheet', 'cash_flow', 'shares',
            'raw', 'observation'} <= tables


def test_schema_verify_row_keeps_unverified(tmp_path):
    lf = _make_local(tmp_path)
    rows = lf.observation(['600031.SH'])
    verdict = lf.schema_verify_row(rows[0])
    assert verdict['field_mapping_verified'] is False
    assert verdict['announce_date'] is None
    assert verdict['pit_verified'] is False


def test_local_store_financials_raw_isolation(tmp_path):
    # The local store delegates raw/observation to TDXLocal and must not
    # accept a three-statement table name (strict isolation).
    from bridge.schemas import SourceUnavailable
    from bridge.local_store import LocalStore
    LocalFinancial(TDXLocal(vipdoc=tmp_path)).build_synthetic_gpcw(
        tmp_path / 'cw' / 'gpcw20240331.dat', 20240331, '600031', [1.5, 2.25, 3.0])
    store = LocalStore(tdx=TDXLocal(vipdoc=tmp_path))
    rows = store.financials('raw', ['600031.SH'], latest_only=True)
    assert len(rows) == 1
    with pytest.raises(SourceUnavailable):
        store.financials('income', ['600031.SH'], latest_only=True)
