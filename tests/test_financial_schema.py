"""C01: native financial schema contract."""
from bridge import financial_schema as fs


def test_normalize_table_canonical_and_aliases():
    assert fs.normalize_table('metrics') == 'metrics'
    assert fs.normalize_table('balance') == 'balance_sheet'
    assert fs.normalize_table('cashflow') == 'cash_flow'
    assert fs.normalize_table('raw') == 'raw'
    assert fs.normalize_table('observation') == 'observation'


def test_normalize_table_rejects_unknown():
    import pytest
    with pytest.raises(ValueError):
        fs.normalize_table('not_a_table')
    with pytest.raises(ValueError):
        fs.normalize_table(None)


def test_observation_tables_have_no_named_fields():
    assert fs.expected_fields('raw') == []
    assert fs.expected_fields('observation') == []
    assert fs.is_observation_table('raw')
    assert fs.is_observation_table('observation')
    assert not fs.is_observation_table('income')


def test_metrics_fields_are_the_only_asserted_mapping():
    fields = set(fs.expected_fields('metrics'))
    assert fields == set(fs.NAMED_METRIC_FIELDS)
    # eps/bps in CNY, shares in shares (股)
    assert fs.NAMED_METRIC_FIELDS['eps']['unit'] == 'CNY'
    assert fs.NAMED_METRIC_FIELDS['total_shares']['unit'] == 'shares'


def test_observation_table_is_pit_disabled_and_unverified():
    st = fs.verification_status('raw')
    assert st['field_mapping_verified'] is False
    assert st['pit_verified'] is False
    assert st['period_semantics'] == 'report_header_period_only'
    assert st['announce_date_source'] is None


def test_metrics_field_mapping_verified_but_pit_disabled():
    st = fs.verification_status('metrics')
    assert st['field_mapping_verified'] is True
    # named latest fields, not a historical PIT series
    assert st['pit_verified'] is False
    assert st['announce_date_source'] is None


def test_offline_statement_pit_disabled():
    for t in ('income', 'balance_sheet', 'cash_flow', 'shares'):
        st = fs.verification_status(t)
        assert st['pit_verified'] is False
        assert st['announce_date_source'] is None


def test_every_table_is_pit_disabled():
    for t in fs.NATIVE_TABLES + fs.OBSERVATION_TABLES:
        assert fs.is_pit_disabled(t)
