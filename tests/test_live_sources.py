from datetime import datetime
from types import SimpleNamespace as N
from unittest.mock import Mock
import pytest
from bridge.live_sources import LiveSources, LiveSourceError, canonical_symbol


def source(client, **kw):
    return LiveSources(client_factory=lambda: client, min_interval=0, retries=1, **kw)


def test_unknown_backend_rejected():
    with pytest.raises(ValueError): LiveSources(backend='tickflow')


def test_symbol_mapping_and_no_path_injection():
    assert canonical_symbol('sh600031') == '600031.SH'
    assert canonical_symbol('000001.SZ') == '000001.SZ'
    with pytest.raises(ValueError): canonical_symbol('../../etc/passwd')


def test_realtime_units_and_unknown_clock_not_invented():
    q=N(full_code='sh600031',last_price=18.84,pre_close_price=17.88,total_hand=1099096,amount=2042962944,
        open_price=18.07,high_price=18.85,low_price=17.81,buy_levels=[N(price=18.83,volume=642)],sell_levels=[])
    c=N(helpers=N(full_quotes=lambda codes:[q]))
    row=source(c).realtime(['600031.SH'])[0]
    assert row['volume']==1099096
    assert row['amount']==2042962944
    assert row['change_pct']==pytest.approx(18.84/17.88-1)
    assert row['timestamp'] is None and row['stale'] is True
    assert row['freshness_reason']=='SOURCE_CLOCK_UNKNOWN'


def test_bars_raw_end_time_and_date_filter():
    bars=[N(time=datetime(2026,11,3,14,59),open=1,high=2,low=1,close=2,volume_lots=5.5,amount=550)]
    get=Mock(return_value=N(bars=bars));c=N(bars=N(get=get))
    rows=source(c).minute(['600031.SH'],'20261103','20261103')
    assert len(rows)==1 and rows[0]['volume']==5.5
    assert get.call_args.kwargs['adjust']=='none'
    assert rows[0]['datetime']=='2026-11-03T14:59:00'  # Preserve upstream Beijing bar clock
    assert source(c).minute(['600031.SH'],'20261102','20261102')==[]


def test_failure_never_switches_provider():
    get=Mock(side_effect=ConnectionError('offline'))
    c=N(helpers=N(full_quotes=get))
    with pytest.raises(LiveSourceError): source(c).realtime(['600031.SH'])
    assert get.call_count==1


def test_daily_preserves_raw_previous_close():
    b=N(time=datetime(2026,11,3,15),open=18.07,high=18.85,low=17.81,close=18.84,
        volume_lots=1099096.48,amount=2042962944,last_close_price_milli=17880)
    rows=source(N(bars=N(get=lambda *a,**k:N(bars=[b])))).daily(['600031.SH'],'20261103','20261103')
    assert rows[0]['pre_close']==17.88
    assert rows[0]['volume']==1099096.48


def test_depth_explicit_quantities_from_native_0x0547():
    from datetime import date
    today=datetime.now().date()
    q=N(full_code='sh600031',last_price=18.84,last_close_price=17.88,update_time_raw=150000,
        buy_levels=[N(price=18.83,volume=642)],sell_levels=[N(price=18.84,volume=1772)])
    handshake=N(server_datetime=datetime.combine(today,datetime.min.time()).replace(hour=15,minute=2),server_date_1=today)
    c=N(session=N(handshake=lambda:handshake),quotes=N(get_depth=lambda codes:N(records=[q])))
    depth=source(c).depth(['600031.SH'])
    assert depth['600031.SH']['bids']==[[18.83,642]]
    assert depth['600031.SH']['asks']==[[18.84,1772]]
    assert depth['600031.SH']['bid_volumes']==[642]
    assert depth['600031.SH']['ask_volumes']==[1772]
    assert depth['600031.SH']['levels_complete'] is False  # no zero-filled levels
    assert depth['600031.SH']['source']=='eltdx:quotes.get_depth'


def test_axdata_explicit_tdx_interface_only():
    call=Mock(return_value=[{'instrument_id':'600031.SH','last_price':18.84,'prev_close':17.88,'volume':1000,'amount':200000}])
    s=source(N(call=call),backend='axdata')
    row=s.realtime(['600031.SH'])[0]
    assert call.call_args.args[0]=='stock_realtime_snapshot_tdx'
    assert row['timestamp'] is None
    assert row['source']=='axdata:tdx'

def test_shanghai_index_alias_is_round_tripped():
    q=N(full_code='sh999999',last_price=4000,pre_close_price=3900,total_hand=1,amount=1,buy_levels=[],sell_levels=[])
    get=Mock(return_value=[q])
    rows=source(N(helpers=N(full_quotes=get))).realtime(['000001.SH'],asset_type='index')
    assert rows[0]['symbol']=='000001.SH'
    assert get.call_args.args[0]==['sh999999']
