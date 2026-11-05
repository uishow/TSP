"""Regression tests for the eltdx-native depth5 and financial observation layer."""
from datetime import datetime, date, time as dt_time
from pathlib import Path
from types import SimpleNamespace
from zoneinfo import ZoneInfo

import pytest

from bridge.finance import FinancialSources
from bridge.live_sources import LiveSourceError, LiveSources, _depth_event
from bridge.router import Router
from bridge.server import Query


def _handshake(day=None):
    day = day or datetime.now().date()
    return SimpleNamespace(
        server_datetime=datetime(day.year, day.month, day.day, 15, 2, 0),
        server_date_1=day,
    )


def _record(code='sh600031', clock=150000, last=18.69, levels=5):
    level = lambda price: SimpleNamespace(price=price, volume=100, price_delta_raw=0)
    return SimpleNamespace(
        full_code=code, update_time_raw=clock, last_price=last,
        last_close_price=18.84,
        buy_levels=tuple(level(18.69 - 0.01 * i) for i in range(levels)),
        sell_levels=tuple(level(18.70 + 0.01 * i) for i in range(levels)),
    )


class _DepthClient:
    def __init__(self, records):
        self.records = records
        self.session = SimpleNamespace(handshake=lambda: _handshake())
        self.quotes = SimpleNamespace(
            get_depth=lambda codes: SimpleNamespace(records=tuple(self.records)))
        self.calls = []

    def close(self):
        pass


def test_depth_event_combines_handshake_date_with_hhmmss():
    assert _depth_event(date(2026, 11, 4), 93000) == datetime(2026, 11, 4, 9, 30)
    assert _depth_event(date(2026, 11, 4), 153309) == datetime(2026, 11, 4, 15, 33, 9)
    assert _depth_event(date(2026, 11, 4), 0) is None
    assert _depth_event(date(2026, 11, 4), 256199) is None


def test_depth5_uses_native_levels_and_handshake_clock():
    live = LiveSources(client_factory=lambda: _DepthClient([_record()]),
                       min_interval=0, retries=1)
    result = live.depth(['600031.SH'])
    row = result['600031.SH']
    assert row['source'] == 'eltdx:quotes.get_depth'
    assert row['bid_volumes'] == [100] * 5 and row['ask_volumes'] == [100] * 5
    assert row['levels_complete'] is True
    assert row['quote_date'] == datetime.now().date().isoformat()
    expected = datetime.combine(datetime.now().date(), dt_time(15, 0),
                                tzinfo=ZoneInfo('Asia/Shanghai'))
    assert row['timestamp'] == int(expected.timestamp() * 1000)
    assert row['event_time'] == '2026-11-04T15:00:00' or row['event_time'].endswith('T15:00:00')
    assert row['clock_evidence'] == 'TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMMSS'
    assert row['stale'] is False


def test_depth5_missing_or_undated_records_fail_closed():
    live = LiveSources(client_factory=lambda: _DepthClient([_record()]),
                       min_interval=0, retries=1)
    with pytest.raises(LiveSourceError, match='omitted 1 requested symbols'):
        live.depth(['600031.SH', '002474.SZ'])
    live2 = LiveSources(client_factory=lambda: _DepthClient([_record(clock=0)]),
                        min_interval=0, retries=1)
    with pytest.raises(LiveSourceError, match='omitted'):
        live2.depth(['600031.SH'])
    live3 = LiveSources(client_factory=lambda: _DepthClient([_record(levels=3)]),
                        min_interval=0, retries=1)
    assert live3.depth(['600031.SH'])['600031.SH']['levels_complete'] is False


def test_finance_snapshot_splits_failing_batches_without_zero_fill():
    class Client:
        def __init__(self):
            self.corporate = SimpleNamespace(finance_batch=self.batch)

        def batch(self, codes, on_missing='raise'):
            if len(codes) > 1:
                raise RuntimeError('finance batch recovery budget exhausted')
            if codes[0] == 'sz000001':
                return SimpleNamespace(records=())
            record = SimpleNamespace(full_code=codes[0], updated_date=date(2026, 10, 30),
                                     ipo_date=date(2003, 7, 3),
                                     **{k: 1.0 for k in ('eps_raw', 'mei_gu_jing_zi_chan_raw_float',
                                                         'total_shares', 'circulating_shares',
                                                         'total_assets_yuan', 'net_profit_yuan')},
                                     **{k: 2.0 for k in (
                                         'zhu_ying_shou_ru_raw_float', 'zhu_ying_li_run_raw_float',
                                         'ying_ye_li_run_raw_float', 'li_run_zong_he_raw_float',
                                         'shui_hou_li_run_raw_float', 'wei_fen_li_run_raw_float',
                                         'tou_zi_shou_yu_raw_float', 'ying_shou_zhang_kuan_raw_float',
                                         'cun_huo_raw_float', 'liu_dong_zi_chan_raw_float',
                                         'gu_ding_zi_chan_raw_float', 'wu_xing_zi_chan_raw_float',
                                         'jing_zi_chan_raw_float', 'liu_dong_fu_zhai_raw_float',
                                         'chang_qi_fu_zhai_raw_float', 'zi_ben_gong_ji_jin_raw_float',
                                         'gu_dong_ren_shu_raw_float', 'jing_ying_xian_jin_liu_raw_float',
                                         'zong_xian_jin_liu_raw_float', 'guo_jia_gu_raw_float',
                                         'fa_qi_ren_fa_ren_gu_raw_float', 'fa_ren_gu_raw_float',
                                         'b_gu_raw_float', 'h_gu_raw_float')})
            return SimpleNamespace(records=(record,))

        def close(self):
            pass

    live = LiveSources(client_factory=Client, min_interval=0, retries=1)
    rows = live.finance_snapshot(['600031.SH', '000001.SZ'])
    assert set(rows) == {'600031.SH'}
    assert rows['600031.SH']['eps'] == 1.0
    assert rows['600031.SH']['source_updated_date'] == '2026-10-30'


@pytest.fixture
def finance_index(monkeypatch):
    from bridge import finance
    spine = {
        '600031': [('2026-09-30', 0.8748, 10.25, 'gpcw20260930.dat'),
                   ('2026-06-30', 0.6217, 10.0146, 'gpcw20260630.dat')],
    }
    monkeypatch.setattr(finance, 'gpcw_index', lambda *a, **k: spine)
    return finance


class _Tdx:
    vipdoc = Path('/nonexistent-vipdoc')


class _FinanceLive:
    def __init__(self, fail=False):
        self.fail = fail

    def finance_snapshot(self, symbols):
        if self.fail:
            raise RuntimeError('eltdx offline')
        return {'600031.SH': {'eps': 0.87, 'bps': 10.25, 'total_shares': 9195004375.0,
                              'source_updated_date': '2026-10-30', 'ipo_date': '2003-07-03'}}


def test_financial_rows_never_invent_announce_date_or_zero_fill(finance_index):
    rows = finance_index.FinancialSources(_Tdx(), _FinanceLive()).rows(
        'metrics', ['600031.SH'], latest_only=False)
    assert len(rows) == 2
    assert all(r['announce_date'] is None and r['ann_date'] is None for r in rows)
    assert all(r['pit_verified'] is False and r['announce_date_verified'] is False for r in rows)
    assert rows[0]['eps'] == 0.87 and rows[0]['period_end'] == '2026-09-30'
    assert rows[1]['eps'] is None and rows[1]['eps_observation'] == 0.6217
    assert rows[1]['snapshot_status'] == 'HISTORICAL_PERIOD_NO_SNAPSHOT'
    assert rows[0]['source_updated_date'] == '2026-10-30'
    assert rows[0]['announce_date'] is None  # updated_date must not become a PIT date


def test_financial_source_failure_is_labelled_not_silently_dropped(finance_index):
    rows = finance_index.FinancialSources(_Tdx(), _FinanceLive(fail=True)).rows(
        'metrics', ['600031.SH'], latest_only=True)
    assert len(rows) == 1
    assert rows[0]['snapshot_status'] == 'ELTDX_UNAVAILABLE'
    assert 'eltdx offline' in rows[0]['snapshot_error']
    assert rows[0]['eps'] is None


def test_financial_unknown_symbol_has_no_invented_row(finance_index):
    assert finance_index.FinancialSources(_Tdx(), _FinanceLive()).rows(
        'income', ['999999.SZ'], latest_only=True) == []


def test_router_keeps_raw_observation_on_local_path_and_routes_named_tables():
    class Local:
        tdx = _Tdx()

        def financials(self, table, symbols, latest_only=True):
            return [{'symbol': '600031.SH', 'ann_date': None, 'source': 'tdx_gpcw_observation'}]

    class Live:
        def finance_snapshot(self, symbols):
            return {}

    router = Router(Local(), Live())
    raw = router.query(dataset='financial', symbols=['600031.SH'], table='raw')
    assert raw['rows'][0]['source'] == 'tdx_gpcw_observation'
    named = router.query(dataset='financial', symbols=['600031.SH'], table='metrics')
    assert named['rows'] == []  # no local gpcw spine for this fake vipdoc


def test_bridge_query_accepts_upstream_financial_table_names():
    for table in ('metrics', 'income', 'balance_sheet', 'cash_flow', 'shares', 'raw', 'observation'):
        q = Query(dataset='financial', symbols=['600031.SH'], table=table)
        assert q.table == table
