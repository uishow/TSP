from datetime import datetime
import pytest
from bridge.schemas import boundary, symbol_parts, canonical_bar

def test_end_date_includes_close():
    assert boundary('20261103', end=True)==datetime(2026,11,3,23,59,59)

def test_invalid_symbol_rejected():
    with pytest.raises(ValueError): symbol_parts('../secrets')

def test_units_and_missing_values():
    r=canonical_bar({'date':20261103,'open':1,'high':2,'low':1,'close':2,'volume':12300,'amount':50000},'600031.SH','stockdb')
    assert r['volume']==123 and r['amount']==50000 and r['pre_close'] is None

def test_timezone_and_inferred_markets():
    from bridge.schemas import infer_symbol, number
    assert boundary('2026-11-03T07:00:00+00:00')==datetime(2026,11,3,15)
    assert infer_symbol('920001')=='920001.BJ'
    assert infer_symbol('600031')=='600031.SH'
    assert infer_symbol('000001')=='000001.SZ'
    assert number(float('nan')) is None
