"""Contract test: TSP's eltdx adapter must match the installed eltdx API.

TSP's other eltdx tests *mock* the client, so a signature/attribute mismatch
between TSP and the real eltdx would pass those tests yet break at runtime
(e.g. reading ``full_code`` on a record that only exposes ``exchange``+``code``).
This module introspects the installed eltdx and asserts every method and
return field TSP depends on actually exists, and exercises ``_symbol_of``
against the real record shapes. It is the regression guard for the "many
features have issues" class of bugs that unit mocks cannot see.
"""
from datetime import datetime
from types import SimpleNamespace as N
import dataclasses as dc
import importlib.metadata as md

import pytest

from eltdx import TdxClient
import eltdx.helpers as H
import eltdx.models.quote as MQ
import eltdx.models.kline as MK
import eltdx.models.corporate as MC
import eltdx.models.security as MS

from bridge.live_sources import LiveSources, LiveSourceError, _symbol_of


def _fields(cls):
    return {f.name for f in dc.fields(cls)} if dc.is_dataclass(cls) else set()


# -- eltdx version pin ------------------------------------------------------
def test_installed_eltdx_is_the_pinned_major():
    v = md.version('eltdx')
    assert v.startswith('3.'), f'eltdx version drift detected: {v}'


# -- sub-clients TSP relies on --------------------------------------------
def test_required_subclients_exist():
    c = TdxClient.in_memory()
    for sub in ('session', 'codes', 'quotes', 'bars', 'corporate', 'helpers'):
        assert getattr(c, sub, None) is not None, f'missing subclient {sub}'


def test_required_methods_exist():
    c = TdxClient.in_memory()
    for sub, meth in [
        ('session', 'handshake'), ('codes', 'all_markets'),
        ('quotes', 'get_depth'), ('bars', 'get'),
        ('corporate', 'finance_batch'), ('helpers', 'realtime_rank'),
    ]:
        assert callable(getattr(getattr(c, sub), meth, None)), f'missing {sub}.{meth}'


# -- return dataclasses TSP reads from ------------------------------------
def test_market_snapshot_rank_row_and_raw_fields():
    f = _fields(H.RealtimeRankRow)
    for need in ('full_code', 'name', 'last_price', 'pre_close',
                 'change_pct', 'amount', 'volume_hand', 'raw'):
        assert need in f, f'RealtimeRankRow missing {need}'
    raw = _fields(MQ.CategoryQuoteRecord)
    for need in ('server_time_raw', 'open_price', 'high_price', 'low_price'):
        assert need in raw, f'CategoryQuoteRecord (raw) missing {need}'


def test_depth_record_has_no_full_code_must_fall_back():
    f = _fields(MQ.QuoteRefreshRecord)
    for need in ('update_time_raw', 'last_price', 'last_close_price',
                 'buy_levels', 'sell_levels', 'exchange', 'code'):
        assert need in f, f'QuoteRefreshRecord missing {need}'
    assert 'full_code' not in f  # this is exactly why _symbol_of must fall back


def test_bar_record_fields():
    f = _fields(MK.KlineBar)
    for need in ('time', 'open', 'high', 'low', 'close',
                 'volume_lots', 'amount', 'last_close_price_milli'):
        assert need in f, f'KlineBar missing {need}'


def test_finance_record_has_no_full_code_must_fall_back():
    f = _fields(MC.FinanceRecord)
    for need in ('updated_date', 'ipo_date', 'exchange', 'code'):
        assert need in f, f'FinanceRecord missing {need}'
    assert 'full_code' not in f


def test_security_code_has_no_full_code_must_fall_back():
    f = _fields(MS.SecurityCode)
    for need in ('name', 'exchange', 'code', 'category'):
        assert need in f, f'SecurityCode missing {need}'
    assert 'full_code' not in f


# -- _symbol_of resolves every real record shape --------------------------
def test_symbol_of_prefers_full_code():
    assert _symbol_of(N(full_code='sh600031')) == '600031.SH'


def test_symbol_of_falls_back_to_exchange_code():
    assert _symbol_of(N(exchange='sh', code='600031')) == '600031.SH'
    assert _symbol_of(N(exchange='sz', code='000001')) == '000001.SZ'


def test_symbol_of_returns_none_when_unresolvable():
    assert _symbol_of(N(other='x')) is None
    assert _symbol_of(N(exchange='sh')) is None  # code missing


# -- drive LiveSources against REAL-shaped records (no full_code) ----------
def _handshake(today):
    return N(server_datetime=datetime.combine(today, datetime.min.time()).replace(hour=15, minute=2),
             server_date_1=today)


def test_depth_against_real_shaped_record():
    today = datetime.now().date()
    rec = N(exchange='sh', code='600031', last_price=18.84, last_close_price=17.88,
            update_time_raw=150000,
            buy_levels=[N(price=18.83, volume=642)],
            sell_levels=[N(price=18.84, volume=1772)])
    client = N(session=N(handshake=lambda: _handshake(today)),
               quotes=N(get_depth=lambda codes: N(records=[rec])))
    ls = LiveSources(client_factory=lambda: client, min_interval=0, retries=1)
    depth = ls.depth(['600031.SH'])
    assert depth['600031.SH']['bids'] == [[18.83, 642]]
    assert depth['600031.SH']['asks'] == [[18.84, 1772]]


def test_finance_snapshot_against_real_shaped_record():
    from unittest.mock import Mock
    rec = N(exchange='sh', code='600031', updated_date=datetime(2026, 10, 28).date(),
            ipo_date=datetime(2003, 7, 3).date(),
            eps_raw=1.2, zong_zi_chan_raw_float=1.0)
    batch = Mock(return_value=N(records=[rec]))
    client = N(corporate=N(finance_batch=batch))
    ls = LiveSources(client_factory=lambda: client, min_interval=0, retries=1, backend='eltdx')
    out = ls.finance_snapshot(['600031.SH'])
    assert out['600031.SH']['symbol'] == '600031.SH'
    assert out['600031.SH']['source'] == 'eltdx:corporate.finance_batch'


def test_instruments_against_real_shaped_record():
    row = N(exchange='sh', code='600031', name='三一重工', category='a_share')
    client = N(codes=N(all_markets=lambda: [row]))
    ls = LiveSources(client_factory=lambda: client, min_interval=0, retries=1)
    out = ls.instruments('stock')
    assert out[0]['symbol'] == '600031.SH'
    assert out[0]['name'] == '三一重工'


def test_realtime_against_real_shaped_record():
    q = N(exchange='sh', code='600031', last_price=18.84, pre_close_price=17.88,
          total_hand=1099096, amount=2042962944, open_price=18.07, high_price=18.85,
          low_price=17.81, buy_levels=[N(price=18.83, volume=642)], sell_levels=[])
    client = N(helpers=N(full_quotes=lambda codes: [q]))
    ls = LiveSources(client_factory=lambda: client, min_interval=0, retries=1)
    row = ls.realtime(['600031.SH'])[0]
    assert row['symbol'] == '600031.SH'
    assert row['volume'] == 1099096
