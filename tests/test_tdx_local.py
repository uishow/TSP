import struct
from bridge.tdx_local import TDXLocal

def test_day_binary_price_and_volume(tmp_path):
    p=tmp_path/'sh'/'lday';p.mkdir(parents=True)
    (p/'sh600031.day').write_bytes(struct.pack('<IIIIIfII',20261103,1807,1885,1781,1884,2042960000.,109909600,0))
    rows=TDXLocal(vipdoc=tmp_path).daily(['600031.SH'],'20261103','20261103')
    assert rows[0]['close']==18.84 and rows[0]['volume']==1099096

def test_lc5_time_and_hand_units(tmp_path):
    p=tmp_path/'sh'/'fzline';p.mkdir(parents=True)
    day=(2026-2004)*2048+11*100+3
    (p/'sh600031.lc5').write_bytes(struct.pack('<HHfffffII',day,900,18.,19.,17.,18.84,24995028.,1326700,0))
    rows=TDXLocal(vipdoc=tmp_path).minute(['600031.SH'],'20261103','20261103',freq='5m')
    assert rows[0]['datetime']=='2026-11-03T15:00:00' and rows[0]['volume']==13267

def test_financial_observation_has_no_invented_announcement(tmp_path):
    import zipfile
    p=tmp_path/'cw';p.mkdir()
    header=struct.pack('<hIHIII',0,20260930,1,0,12,0)
    payload=header+struct.pack('<6scI',b'600031',b'\x00',31)+struct.pack('<3f',1.2,2.3,3.4)
    with zipfile.ZipFile(p/'gpcw20260930.zip','w') as z:z.writestr('gpcw20260930.dat',payload)
    rows=TDXLocal(vipdoc=tmp_path).financials('raw',['600031.SH'])
    assert rows[0]['period_end']=='2026-09-30' and rows[0]['ann_date'] is None
    assert abs(rows[0]['col1']-1.2)<1e-5 and rows[0]['pit_verified'] is False

def test_adjusted_export_stays_separate(tmp_path):
    from bridge.schemas import SourceUnavailable
    import pytest
    (tmp_path/'SH#600031.txt').write_text('600031 三一重工 日线 前复权\n日期 开高低收量额\n2026/11/03 18.07 18.85 17.81 18.84 109909600 2042960000\n',encoding='gb18030')
    s=TDXLocal(vipdoc=tmp_path,export=tmp_path)
    rows=s.export_daily('600031.SH','20261103','20261103')
    assert rows[0]['adjustment']=='qfq' and rows[0]['volume']==1099096
    assert s.daily(['600031.SH'],'20261103','20261103')==[]
    with pytest.raises(SourceUnavailable):s.minute(['600031.SH'],'20261103','20261103',freq='3m')

def test_truncated_day_fails(tmp_path):
    from bridge.schemas import SourceUnavailable
    import pytest
    p=tmp_path/'sh'/'lday';p.mkdir(parents=True)
    (p/'sh600031.day').write_bytes(b'bad')
    with pytest.raises(SourceUnavailable):TDXLocal(vipdoc=tmp_path).daily(['600031.SH'],'20261103','20261103')

def test_export_board_categories_preserve_source_and_members(tmp_path):
    from bridge.tdx_local import TDXLocal
    (tmp_path/'地区板块.txt').write_text('880201\t黑龙江\t600031\t三一重工\n',encoding='gb18030')
    (tmp_path/'风格板块.txt').write_text('880735\t专精特新\t000001\t平安银行\n',encoding='gb18030')
    rows=TDXLocal(export=tmp_path).boards()
    assert {r['type'] for r in rows}=={'region','style'}
    assert rows[0]['source']=='tdx_export_membership'
    assert rows[0]['pit_verified'] is False

def test_etf_day_uses_milliyuan_and_hand_volume(tmp_path):
    import pytest
    p=tmp_path/'sh'/'lday';p.mkdir(parents=True)
    (p/'sh510300.day').write_bytes(struct.pack('<IIIIIfII',20261103,4076,4106,4041,4092,19007473664.,46539652,0))
    row=TDXLocal(vipdoc=tmp_path).daily(['510300.SH'],'20261103','20261103',asset_type='etf')[0]
    assert row['close']==pytest.approx(4.092)
    assert row['volume']==46539652

def test_etf_minute_does_not_use_daily_special_scaling(tmp_path):
    import pytest
    p=tmp_path/'sh'/'minline';p.mkdir(parents=True)
    day=(2026-2004)*2048+11*100+3
    (p/'sh510300.lc1').write_bytes(struct.pack('<HHfffffII',day,900,4.092,4.092,4.092,4.092,42749532.,10447100,0))
    row=TDXLocal(vipdoc=tmp_path).minute(['510300.SH'],'20261103','20261103',asset_type='etf')[0]
    assert row['close']==pytest.approx(4.092)
    assert row['volume']==104471

def test_etf_daily_volume_can_be_shares_in_same_asset_type(tmp_path):
    import pytest
    p=tmp_path/'sz'/'lday';p.mkdir(parents=True)
    (p/'sz159919.day').write_bytes(struct.pack('<IIIIIfII',20261103,4252,4288,4220,4272,7355386368.,1724597248,0))
    row=TDXLocal(vipdoc=tmp_path).daily(['159919.SZ'],'20261103','20261103',asset_type='etf')[0]
    assert row['volume']==pytest.approx(17245972.48)
    assert row['volume_scale_to_hand']==0.01

def test_unprovable_etf_daily_volume_remains_unknown(tmp_path):
    p=tmp_path/'sz'/'lday';p.mkdir(parents=True)
    (p/'sz159919.day').write_bytes(struct.pack('<IIIIIfII',20261103,4252,4288,4220,4272,1.,1724597248,0))
    row=TDXLocal(vipdoc=tmp_path).daily(['159919.SZ'],'20261103','20261103',asset_type='etf')[0]
    assert row['volume'] is None
    assert row['volume_quality']=='UNIT_UNVERIFIED'
