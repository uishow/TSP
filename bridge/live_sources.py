"""Explicit eltdx/AxData network adapters; never silently change provider.

Prices are raw CNY, amounts CNY and volumes lots (手). Source clock absence
is preserved as null; observed_at is acquisition time, never quote event time.
"""
from __future__ import annotations

from datetime import datetime, time as dt_time, timedelta
from zoneinfo import ZoneInfo
import importlib.metadata
import math
import os
from pathlib import Path
import re
import threading
import time
import warnings

CN = ZoneInfo('Asia/Shanghai')

# B01 admission verdicts and session-state helpers live in quote_quality so the
# hierarchy is a single, testable contract; live_sources consumes it directly.
from .quote_quality import (admit_realtime, ADMITTED, quote_session_state, hhmm)


class LiveSourceError(RuntimeError):
    pass


def canonical_symbol(value):
    value = str(value).strip()
    if re.fullmatch(r'(sh|sz|bj)\d{6}', value, re.I):
        return value[2:] + '.' + value[:2].upper()
    if re.fullmatch(r'\d{6}\.(SH|SZ|BJ)', value, re.I):
        return value.upper()
    raise ValueError('Expected exchange-qualified symbol, e.g. 600031.SH')


def _tdx_code(symbol, asset_type='stock'):
    symbol = canonical_symbol(symbol)
    if asset_type == 'index' and symbol == '000001.SH':
        return 'sh999999'
    return symbol[-2:].lower() + symbol[:6]


def _bound(value, end=False):
    if value is None:
        return datetime.now(CN).replace(tzinfo=None) if end else datetime(2000, 1, 1)
    if isinstance(value, datetime):
        return value.astimezone(CN).replace(tzinfo=None) if value.tzinfo else value
    s = str(value)
    if len(s) == 8 and s.isdigit():
        d = datetime.strptime(s, '%Y%m%d').date()
        return datetime.combine(d, dt_time.max if end else dt_time.min)
    if len(s) == 10:
        d = datetime.fromisoformat(s).date()
        return datetime.combine(d, dt_time.max if end else dt_time.min)
    if len(s) == 14 and s.isdigit():
        return datetime.strptime(s, '%Y%m%d%H%M%S')
    return _bound(datetime.fromisoformat(s))


def _num(value):
    if value is None:
        return None
    n = float(value)
    return n if math.isfinite(n) else None


def _attr(obj, key, default=None):
    return obj.get(key, default) if isinstance(obj, dict) else getattr(obj, key, default)


def _symbol_of(obj):
    """Resolve the canonical SYMBOL for an eltdx record.

    Different eltdx records expose the code differently: some carry a ready
    ``full_code`` (e.g. RealtimeRankRow), while others expose only
    ``exchange`` + ``code`` (SecurityCode, QuoteSnapshot, QuoteRefreshRecord,
    FinanceRecord). Resolving from whichever is present keeps every realtime /
    depth / financial / instrument path correct against the installed eltdx
    API instead of raising on a missing ``full_code``.
    """
    fc = _attr(obj, 'full_code')
    if fc:
        return canonical_symbol(fc)
    ex = _attr(obj, 'exchange')
    code = _attr(obj, 'code')
    if ex and code is not None:
        return canonical_symbol(f'{ex}{code}')
    return None


def _depth_event(day, raw):
    """TDX 0x0547 update_time_raw is HHMMSS on the handshake-verified trade date."""
    if not isinstance(raw, int) or raw <= 0:
        return None
    text = str(raw).zfill(6)
    if len(text) != 6 or not text.isdigit():
        return None
    hh, mm, ss = int(text[:2]), int(text[2:4]), int(text[4:])
    if not (0 <= hh < 24 and 0 <= mm < 60 and 0 <= ss < 60):
        return None
    return datetime.combine(day, dt_time(hh, mm, ss))


# eltdx FinanceRecord attribute -> bridge field. Names ending _raw keep the
# native TDX unit (usually 千元 for monetary items): only the four properties
# declared by eltdx (circulating_shares / total_shares / total_assets_yuan /
# net_profit_yuan) plus eps/bps carry a unit we are willing to assert.
FINANCE_FIELD_MAP = {
    'eps': 'eps_raw',
    'bps': 'mei_gu_jing_zi_chan_raw_float',
    'total_shares': 'total_shares',
    'circulating_shares': 'circulating_shares',
    'total_assets_yuan': 'total_assets_yuan',
    'net_profit_yuan': 'net_profit_yuan',
    'revenue_raw': 'zhu_ying_shou_ru_raw_float',
    'operating_profit_raw': 'zhu_ying_li_run_raw_float',
    'business_profit_raw': 'ying_ye_li_run_raw_float',
    'profit_total_raw': 'li_run_zong_he_raw_float',
    'after_tax_profit_raw': 'shui_hou_li_run_raw_float',
    'undistributed_profit_raw': 'wei_fen_li_run_raw_float',
    'investment_income_raw': 'tou_zi_shou_yu_raw_float',
    'receivables_raw': 'ying_shou_zhang_kuan_raw_float',
    'inventory_raw': 'cun_huo_raw_float',
    'current_assets_raw': 'liu_dong_zi_chan_raw_float',
    'fixed_assets_raw': 'gu_ding_zi_chan_raw_float',
    'intangible_assets_raw': 'wu_xing_zi_chan_raw_float',
    'net_assets_raw': 'jing_zi_chan_raw_float',
    'current_liabilities_raw': 'liu_dong_fu_zhai_raw_float',
    'long_term_liabilities_raw': 'chang_qi_fu_zhai_raw_float',
    'capital_reserve_raw': 'zi_ben_gong_ji_jin_raw_float',
    'shareholders_raw': 'gu_dong_ren_shu_raw_float',
    'operating_cash_flow_raw': 'jing_ying_xian_jin_liu_raw_float',
    'total_cash_flow_raw': 'zong_xian_jin_liu_raw_float',
    'state_shares_raw': 'guo_jia_gu_raw_float',
    'promoter_shares_raw': 'fa_qi_ren_fa_ren_gu_raw_float',
    'legal_person_shares_raw': 'fa_ren_gu_raw_float',
    'b_shares_raw': 'b_gu_raw_float',
    'h_shares_raw': 'h_gu_raw_float',
}


class LiveSources:
    def __init__(self, backend=None, client_factory=None, min_interval=0.25, retries=2):
        self.backend = backend or os.environ.get('TSP_LIVE_BACKEND', 'eltdx')
        if self.backend not in {'eltdx', 'axdata'}:
            raise ValueError('TSP_LIVE_BACKEND must be eltdx or axdata')
        self._factory = client_factory
        self._client = None
        self._lock = threading.RLock()
        self._last_call = 0.0
        self._interval = max(0, min_interval)
        self._retries = max(1, min(3, retries))
        self._error = None

    def _connect(self):
        if self._factory:
            return self._factory()
        if self.backend == 'eltdx':
            from eltdx import TdxClient
            return TdxClient(timeout=3, heartbeat_interval=None,
                             host=os.environ.get('TSP_ELTDX_HOST') or None,
                             pool_size=2)
        from axdata import AxDataClient
        return AxDataClient(mode='local',data_root=Path(__file__).resolve().parents[1]/'runtime'/'axdata')

    def _run(self, callback):
        with self._lock:
            for attempt in range(self._retries):
                wait = self._interval - (time.monotonic() - self._last_call)
                if wait > 0:
                    time.sleep(wait)
                try:
                    if self._client is None:
                        self._client = self._connect()
                    result = callback(self._client)
                    self._error = None
                    return result
                except Exception as exc:
                    self._error = type(exc).__name__
                    if self._client is not None:
                        close = getattr(self._client, 'close', None)
                        if close:
                            close()
                        self._client = None
                    if attempt + 1 == self._retries:
                        raise LiveSourceError(f'{self.backend} request failed ({type(exc).__name__}); no alternate provider used') from exc
                finally:
                    self._last_call = time.monotonic()

    def status(self):
        try:
            version = importlib.metadata.version(self.backend)
        except importlib.metadata.PackageNotFoundError:
            version = None
        return {'backend': self.backend, 'version': version, 'installed': version is not None,
                'connected': self._client is not None, 'last_error': self._error,
                'fallback': False, 'quote_clock': 'UNKNOWN unless upstream supplies datetime'}

    def instruments(self, asset_type='stock'):
        if self.backend != 'eltdx':
            raise LiveSourceError('Use local instruments; AxData instrument enumeration not enabled')
        if asset_type not in {'stock', 'index', 'etf'}:
            raise ValueError('Unsupported asset type')
        category = {'stock': 'a_share', 'index': 'index', 'etf': 'etf'}[asset_type]
        rows = self._run(lambda c: c.codes.all_markets())
        return [{'symbol': _symbol_of(r), 'name': _attr(r, 'name'),
                 'exchange': _attr(r, 'exchange').upper(), 'asset_type': asset_type,
                 'source': 'eltdx', 'code': _attr(r, 'code')} for r in rows
                if _symbol_of(r) and _attr(r, 'category') == category]

    def realtime(self, symbols=None, universes=None, asset_type='stock'):
        if not symbols:
            raise LiveSourceError('Explicit symbols required; implicit full-market network scans are disabled')
        symbols = [canonical_symbol(s) for s in symbols]
        if len(symbols) > 6000:
            raise ValueError('Too many symbols')
        if self.backend == 'axdata':
            return self._ax_quotes(symbols)
        output = []
        for offset in range(0, len(symbols), 80):
            chunk = symbols[offset:offset + 80]
            quotes = self._run(lambda c: c.helpers.full_quotes([_tdx_code(s,asset_type) for s in chunk]))
            for q in quotes:
                symbol = _symbol_of(q)
                if asset_type=='index' and symbol=='999999.SH':symbol='000001.SH'
                previous = _num(_attr(q, 'pre_close_price'))
                last = _num(_attr(q, 'last_price'))
                output.append({'symbol': symbol, 'source': 'eltdx', 'last_price': last,
                    'prev_close': previous, 'change_pct': last / previous - 1 if last is not None and previous else None,
                    'open': _num(_attr(q, 'open_price')), 'high': _num(_attr(q, 'high_price')),
                    'low': _num(_attr(q, 'low_price')), 'volume': _num(_attr(q, 'total_hand')),
                    'amount': _num(_attr(q, 'amount')), 'timestamp': None, 'event_time': None,
                    'observed_at': datetime.now(CN).isoformat(), 'stale': True,
                    'freshness_reason': 'SOURCE_CLOCK_UNKNOWN', 'source_time_raw': _attr(q, 'time_raw'),
                    'bids': [[_attr(l, 'price'), _attr(l, 'volume')] for l in _attr(q, 'buy_levels', [])],
                    'asks': [[_attr(l, 'price'), _attr(l, 'volume')] for l in _attr(q, 'sell_levels', [])]})
        missing = set(symbols) - {r['symbol'] for r in output}
        if missing:
            raise LiveSourceError(f'eltdx omitted {len(missing)} requested symbols')
        return output

    def market_snapshot(self, max_lag_minutes=10):
        """Full-market quotes through eltdx category ranking, gated by TDX handshake.

        A row is emitted only when the TDX server date equals the Beijing trading
        date and the per-symbol HHMM clock stays within the freshness gate of the
        last session boundary (not the wall clock, so lunch break and after-hours
        keep their final snapshot). The timestamp uses the authenticated TDX
        session clock; the per-symbol raw clock is retained as evidence, never
        asserted as second-level proof. Halted/undated/clock-skewed rows stay
        excluded, and the whole request fails closed if none survive.
        """
        if self.backend != 'eltdx':
            raise LiveSourceError('Full-market realtime requires eltdx; AxData exposes explicit snapshots only')

        def fetch(client):
            handshake = client.session.handshake()
            rows = client.helpers.realtime_rank(category='沪深A股', sort_by='涨幅', count=6000).rows
            return handshake, rows

        handshake, rows = self._run(fetch)
        server_dt = _attr(handshake, 'server_datetime')
        server_date = _attr(handshake, 'server_date_1')
        if not isinstance(server_dt, datetime) or server_date is None or server_dt.date() != server_date:
            raise LiveSourceError('TDX handshake lacks a consistent server date; refusing undated quotes')
        local_date = datetime.now(CN).date()
        if server_date != local_date:
            raise LiveSourceError(f'TDX server date {server_date} != Beijing date {local_date}; refusing stale quotes')
        # timestamp stays on the authenticated session clock: the upstream
        # quote service uses it for same-day attribution and final-snapshot
        # confirmation. It is an acquisition/session stamp, NOT a tick time.
        ts_ms = int(server_dt.replace(tzinfo=CN).timestamp() * 1000)
        wall_minutes = server_dt.hour * 60 + server_dt.minute
        reference, phase, in_session = quote_session_state(server_dt)
        if reference is None:
            raise LiveSourceError('eltdx market snapshot requested before the opening session')
        out = []
        seen = set()
        for r in rows:
            raw = _attr(r, 'raw')
            clock_raw = _attr(raw, 'server_time_raw')
            price = _num(_attr(r, 'last_price'))
            prev = _num(_attr(r, 'pre_close'))
            volume = _num(_attr(r, 'volume_hand'))
            # B01: the single, testable admission gate. A halted / undated /
            # malformed / stale / clock-skewed / session-not-open row is rejected
            # here so it can never become today's candle. The verdict never
            # invents an event time from a missing or implausible per-symbol clock.
            verdict, detail = admit_realtime(_symbol_of(r), price, prev, volume,
                                            clock_raw, server_dt, max_lag_minutes)
            if verdict != ADMITTED:
                continue
            minutes = detail['minutes']
            hh, mm = divmod(minutes, 60)
            phase = detail['session_phase']
            in_session = detail['in_session']
            symbol = _symbol_of(r)
            if symbol in seen:
                continue  # ranking pagination overlaps; daily rows must stay unique
            seen.add(symbol)
            pct = _num(_attr(r, 'change_pct'))
            wall_lag = wall_minutes - minutes
            out.append({'symbol': symbol,
                'name': _attr(r, 'name'), 'source': 'eltdx:category_rank',
                'last_price': price, 'prev_close': prev,
                'open': _num(_attr(raw, 'open_price')), 'high': _num(_attr(raw, 'high_price')),
                'low': _num(_attr(raw, 'low_price')), 'volume': volume,
                'amount': _num(_attr(r, 'amount')),
                'change_pct': pct / 100 if pct is not None else price / prev - 1,
                'change_amount': price - prev, 'timestamp': ts_ms,
                'event_time': server_dt.isoformat(), 'observed_at': datetime.now(CN).isoformat(),
                'stale': wall_lag > max_lag_minutes, 'wall_clock_lag_minutes': wall_lag,
                'session_phase': phase, 'quote_boundary_hhmm': hhmm(reference),
                'source_event_hhmm': hhmm(minutes),
                'freshness_reason': ('IN_SESSION' if in_session else
                    'LUNCH_BREAK_FINAL_SNAPSHOT' if phase == 'LUNCH_BREAK' else
                    'AFTER_HOURS_FINAL_SNAPSHOT'),
                'clock_evidence': 'TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMM',
                'source_time_raw': clock_raw})
        # P5 / TSP_ETF_REALTIME: best-effort augmentation with the local
        # 52-symbol ETF pool. The stock snapshot above stays authoritative;
        # the helper isolates every failure into an empty list and never
        # raises, so this request cannot break if ETF quotes are unavailable.
        # Kill switch: TSP_ETF_REALTIME=0 or bridge/etf_realtime.disabled.
        try:
            from .etf_realtime import augment as _augment_etf
            out.extend(_augment_etf(self, server_dt, max_lag_minutes))
        except Exception as _exc:  # noqa: BLE001 -- never break the stock snapshot
            import logging as _logging
            _logging.getLogger(__name__).warning('ETF_REALTIME_SKIPPED: %s', _exc)
        if not out:
            raise LiveSourceError('eltdx market snapshot returned no date-verified rows')
        return out

    def depth(self, symbols, asset_type='stock', max_lag_minutes=10):
        """Five-level order book through eltdx native 0x0547 (not a quote-derived fake).

        The trade date comes from the authenticated TDX handshake; each record's
        HHMMSS clock is combined with that date to build its event timestamp.
        Missing / undated / clock-skewed records are excluded and reported, and
        depth is never zero-filled from an earlier snapshot.
        """
        if self.backend != 'eltdx':
            raise LiveSourceError('Five-level depth requires eltdx; AxData exposes no verified depth stream')
        symbols = [canonical_symbol(s) for s in symbols]
        if not symbols:
            raise LiveSourceError('Explicit symbols required for depth5')
        handshake = self._run(lambda c: c.session.handshake())
        server_dt = _attr(handshake, 'server_datetime')
        server_date = _attr(handshake, 'server_date_1')
        if not isinstance(server_dt, datetime) or server_date is None or server_dt.date() != server_date:
            raise LiveSourceError('TDX handshake lacks a consistent server date; refusing undated depth')
        local_date = datetime.now(CN).date()
        if server_date != local_date:
            raise LiveSourceError(f'TDX server date {server_date} != Beijing date {local_date}; refusing stale depth')
        session_dt = server_dt.replace(tzinfo=None)
        out = {}
        for offset in range(0, len(symbols), 100):
            chunk = symbols[offset:offset + 100]
            codes = [_tdx_code(s, asset_type) for s in chunk]
            page = self._run(lambda c: c.quotes.get_depth(codes))
            for r in _attr(page, 'records', []):
                symbol = _symbol_of(r)
                if asset_type == 'index' and symbol == '999999.SH':
                    symbol = '000001.SH'
                if symbol not in chunk:
                    continue
                event_dt = _depth_event(server_date, _attr(r, 'update_time_raw'))
                if event_dt is None or event_dt > session_dt + timedelta(minutes=5):
                    continue  # undated or clock running ahead of the session
                price = _num(_attr(r, 'last_price'))
                if not price or price <= 0:
                    continue
                bids = [[_num(_attr(l, 'price')), _attr(l, 'volume')] for l in _attr(r, 'buy_levels', [])]
                asks = [[_num(_attr(l, 'price')), _attr(l, 'volume')] for l in _attr(r, 'sell_levels', [])]
                if not bids or not asks:
                    continue
                bid_volumes = [int(v) for _, v in bids if v is not None]
                ask_volumes = [int(v) for _, v in asks if v is not None]
                lag = (session_dt - event_dt).total_seconds() / 60.0
                _, depth_phase, depth_in_session = quote_session_state(session_dt)
                out[symbol] = {
                    'symbol': symbol, 'bids': bids, 'asks': asks,
                    'bid_volumes': bid_volumes, 'ask_volumes': ask_volumes,
                    'bid_prices': [p for p, _ in bids], 'ask_prices': [p for p, _ in asks],
                    'levels_complete': len(bids) == 5 and len(asks) == 5,
                    'last_price': price, 'prev_close': _num(_attr(r, 'last_close_price')),
                    'timestamp': int(event_dt.replace(tzinfo=CN).timestamp() * 1000),
                    'event_time': event_dt.isoformat(), 'quote_date': server_date.isoformat(),
                    'observed_at': datetime.now(CN).isoformat(),
                    'source': 'eltdx:quotes.get_depth', 'source_time_raw': _attr(r, 'update_time_raw'),
                    'clock_evidence': 'TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMMSS',
                    'stale': lag > max_lag_minutes, 'lag_minutes': round(lag, 2),
                    'session_phase': depth_phase,
                    'freshness_reason': ('IN_SESSION' if depth_in_session else
                        'LUNCH_BREAK_FINAL_BOOK' if depth_phase == 'LUNCH_BREAK' else
                        'AFTER_HOURS_FINAL_BOOK'),
                }
        missing = set(symbols) - set(out)
        if missing:
            raise LiveSourceError(f'eltdx depth omitted {len(missing)} requested symbols: {sorted(missing)[:5]}')
        return out

    def finance_snapshot(self, symbols):
        """Named latest finance fields from eltdx corporate.finance_batch.

        TDX 0x0010 finance batches are fragile: a request with too many missing
        codes exhausts eltdx's 32-request recovery budget. We use small chunks
        and split a failing chunk recursively instead of silently dropping it;
        a single code that genuinely has no finance record is simply absent.
        """
        if self.backend != 'eltdx':
            raise LiveSourceError('Finance snapshot requires eltdx; no AxData finance mapping verified')
        symbols = [canonical_symbol(s) for s in symbols]
        if not symbols:
            return {}
        out = {}
        for offset in range(0, len(symbols), 20):
            codes = [_tdx_code(s) for s in symbols[offset:offset + 20]]
            for record in self._finance_part(codes):
                symbol = _symbol_of(record)
                updated = _attr(record, 'updated_date')
                ipo = _attr(record, 'ipo_date')
                out[symbol] = {
                    'symbol': symbol, 'source': 'eltdx:corporate.finance_batch',
                    'source_updated_date': updated.isoformat() if updated is not None else None,
                    'ipo_date': ipo.isoformat() if ipo is not None else None,
                    **{name: _num(_attr(record, attr)) for name, attr in FINANCE_FIELD_MAP.items()},
                }
        return out

    def _finance_part(self, codes):
        try:
            with warnings.catch_warnings():
                warnings.simplefilter('ignore')
                batch = self._run(lambda c: c.corporate.finance_batch(codes, on_missing='skip'))
            return [r for r in _attr(batch, 'records', []) if _attr(r, 'updated_date') is not None]
        except LiveSourceError:
            if len(codes) == 1:
                return []  # explicitly absent, never zero-filled
            middle = len(codes) // 2
            return self._finance_part(codes[:middle]) + self._finance_part(codes[middle:])

    def daily(self, symbols, start_time=None, end_time=None, asset_type='stock'):
        return self._bars(symbols, start_time, end_time, asset_type, 'day')

    def minute(self, symbols, start_time=None, end_time=None, asset_type='stock', freq='1m'):
        if freq not in {'1m', '5m', '15m', '30m', '60m'}:
            raise ValueError('Unsupported minute frequency')
        return self._bars(symbols, start_time, end_time, asset_type, freq)

    def _bars(self, symbols, start_time, end_time, asset_type, period):
        if self.backend != 'eltdx':
            raise LiveSourceError('AxData only exposes explicit TDX realtime snapshot in this adapter')
        if asset_type not in {'stock', 'index', 'etf'}:
            raise ValueError('Unsupported asset type')
        start, end = _bound(start_time), _bound(end_time, end=True)
        if end < start:
            raise ValueError('end before start')
        out = []
        for symbol in symbols:
            symbol = canonical_symbol(symbol)
            # Bounded manual paging: no hidden provider switch; stop at requested window.
            for page in range(40):
                series = self._run(lambda c: c.bars.get(_tdx_code(symbol, asset_type), period=period,
                    count=800, start=page * 800, adjust='none', bar_time='start'))
                bars = _attr(series, 'bars', [])
                if not bars:
                    break
                for b in bars:
                    stamp = _bound(_attr(b, 'time'))
                    if not start <= stamp <= end:
                        continue
                    prev = _num(_attr(b, 'last_close_price_milli'))
                    prev = prev / 1000 if prev is not None else None
                    row = {'symbol': symbol, 'source': 'eltdx', 'asset_type': asset_type,
                           'open': _num(_attr(b, 'open')), 'high': _num(_attr(b, 'high')),
                           'low': _num(_attr(b, 'low')), 'close': _num(_attr(b, 'close')),
                           'volume': _num(_attr(b, 'volume_lots')), 'amount': _num(_attr(b, 'amount')),
                           'adjust': 'none', 'event_time': stamp.isoformat()}
                    if period == 'day':
                        row.update(date=stamp.date().isoformat(), pre_close=prev,
                            change_pct=row['close'] / prev - 1 if row['close'] is not None and prev else None)
                    else:
                        row.update(datetime=stamp.isoformat(), freq=period)
                    out.append(row)
                if len(bars) < 800 or min(_bound(_attr(b, 'time')) for b in bars) <= start:
                    break
            else:
                raise LiveSourceError('Requested range exceeds bounded eltdx pagination')
        key = 'date' if period == 'day' else 'datetime'
        return sorted({(r['symbol'], r[key]): r for r in out}.values(), key=lambda r:(r['symbol'], r[key]))

    def _ax_quotes(self, symbols):
        out = []
        for symbol in symbols:
            # Fixed interface, not a caller-selected arbitrary AxData plugin.
            rows = self._run(lambda c: c.call('stock_realtime_snapshot_tdx', code=symbol))
            if hasattr(rows, 'to_dict'):
                rows = rows.to_dict('records')
            if isinstance(rows, dict):
                rows = rows.get('data', [rows])
            for r in rows:
                last = _num(r.get('last_price'))
                previous = _num(r.get('prev_close', r.get('pre_close')))
                out.append({'symbol': canonical_symbol(r.get('instrument_id', symbol)),
                    'source': 'axdata:tdx', 'last_price': last, 'prev_close': previous,
                    'change_pct': last / previous - 1 if last is not None and previous else None,
                    'volume': None, 'amount': _num(r.get('amount')),
                    'timestamp': None, 'event_time': None, 'stale': True,
                    'freshness_reason': 'SOURCE_CLOCK_UNKNOWN', 'observed_at': datetime.now(CN).isoformat()})
        if len(out) != len(symbols):
            raise LiveSourceError('AxData omitted requested snapshots')
        return out
