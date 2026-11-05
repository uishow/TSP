"""D03: asset identity, rules, units."""
from bridge.asset_rules import (
    classify_asset, validate_symbol, asset_identity, is_special_code,
    volume_unit, exchange_of,
)


def test_classify_stock_and_index_and_etf():
    assert classify_asset('600031.SH') == 'stock'
    assert classify_asset('000001.SH') == 'index'
    assert classify_asset('399001.SZ') == 'index'
    assert classify_asset('510300.SH') == 'etf'
    assert classify_asset('159915.SZ') == 'etf'
    assert classify_asset('830799.BJ') == 'stock'
    assert classify_asset('920001.BJ') == 'stock'
    assert classify_asset('899001.BJ') == 'index'


def test_validate_symbol_rejects_malformed():
    import pytest
    with pytest.raises(ValueError):
        validate_symbol('600031')
    with pytest.raises(ValueError):
        validate_symbol('60003.SH')


def test_asset_identity_units_and_special():
    stock = asset_identity('600031.SH')
    assert stock['asset_type'] == 'stock'
    assert stock['market'] == 'SSE'
    assert stock['volume_unit'] == 'hand'
    assert stock['price_tick'] == 0.01
    assert stock['is_special_code'] is False

    etf = asset_identity('510300.SH')
    assert etf['asset_type'] == 'etf'
    assert etf['volume_unit'] == 'unit'

    bj = asset_identity('830799.BJ')
    assert bj['asset_type'] == 'stock'
    assert bj['is_special_code'] is True
    assert bj['market'] == 'BSE'


def test_exchange_of():
    assert exchange_of('600031.SH') == 'SH'
    assert exchange_of('000001.SZ') == 'SZ'
    assert exchange_of('830799.BJ') == 'BJ'
