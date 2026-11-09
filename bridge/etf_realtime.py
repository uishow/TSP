"""P5: optional ETF realtime augmentation for ``LiveSources.market_snapshot``.

Why this module exists
----------------------
The stock full-market snapshot is built from ``eltdx.realtime_rank('沪深A股')``
and carries a handshake-verified session date plus a per-symbol HHMM clock.
ETF codes are not in that category, so ``quote_service`` classifies zero rows
as ETF (``etf_symbol_count=0``) and never builds a same-day ETF partition.

The explicit ``full_quotes`` path used by ``LiveSources.realtime()`` hard-codes
``stale=True / timestamp=None / SOURCE_CLOCK_UNKNOWN`` for *every* asset type.
That is why the historical shadow probe saw 52/52 stale ETF rows. It is not a
missing upstream clock: ``QuoteSnapshot.time_raw`` is a real per-symbol
HHMMSSmmm value (e.g. 140925854 -> 14:09:25.854). This module parses that raw
value, keeps the untouched original as ``source_time_raw``, and feeds the same
``admit_realtime`` gate and ``clock_evidence`` provenance used by the stock
path. Nothing is invented: undated / skewed / stale rows are rejected.

Design constraints (the "no upgrade breakage" rule)
---------------------------------------------------
* Lives in the host-mounted ``bridge/`` tree. The pinned image is untouched.
* Best-effort only: any exception returns an empty list and logs
  ``ETF_REALTIME_SKIPPED``; the stock snapshot stays authoritative and the
  service never fails to start.
* One-click kill switch: ``TSP_ETF_REALTIME=0`` (process env) or a
  ``bridge/etf_realtime.disabled`` flag file (hot, no restart).
* ``preferences.json`` -> ``realtime_pull_etf: false`` also disables it, so the
  UI switch finally has an effect on this deployment. When the key is absent
  the module defaults to enabled and is governed by the kill switch above.
* Pool is read from the latest ``kline_etf_daily`` partition (the same 52-symbol
  universe the historical partitions use). No full-market ETF scan: that would
  both cost ~6s per poll and overwrite the 52-row daily partition with an
  inconsistent universe. This also removes the historical "50 rows vs 52"
  LOF problem, because no extra symbols are introduced.
"""
from __future__ import annotations

import json
import logging
import os
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from .live_sources import _attr, _num, _symbol_of, _tdx_code
from .quote_quality import admit_realtime, ADMITTED, hhmm, quote_session_state

log = logging.getLogger(__name__)

CN = ZoneInfo('Asia/Shanghai')
ROOT = Path(__file__).resolve().parents[1]
_DISABLE_FLAG = Path(__file__).with_name('etf_realtime.disabled')
_PREFERENCES = ROOT / 'data-local' / 'user_data' / 'preferences.json'
_ETF_DAILY = ROOT / 'data-local' / 'kline_etf_daily'
_ETF_INSTRUMENTS = ROOT / 'data-local' / 'instruments_etf' / 'instruments_etf.parquet'
_INSTRUMENTS = ROOT / 'data-local' / 'instruments' / 'instruments.parquet'
REALTIME_EVIDENCE = 'TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMM'

_pool_cache: tuple[float, list[str]] | None = None
_name_cache: dict[str, str] | None = None


def enabled() -> bool:
    """One-click switch + honour an explicit realtime_pull_etf=false preference."""
    if os.environ.get('TSP_ETF_REALTIME', '1') == '0':
        return False
    try:
        if _DISABLE_FLAG.exists():
            return False
    except OSError:
        return True
    try:
        prefs = json.loads(_PREFERENCES.read_text(encoding='utf-8'))
        if 'realtime_pull_etf' in prefs and not prefs['realtime_pull_etf']:
            return False
    except (OSError, ValueError, TypeError):
        pass  # unreadable preferences must never break the stock snapshot
    return True


def pool() -> list[str]:
    """Strategy-pool ETF symbols that the upstream repository also calls ETF.

    Two independent sources are crossed so the pool can never silently
    collapse:

    * recent ``kline_etf_daily`` partitions -> the historical 52-symbol
      strategy universe (using several partitions, because the *newest* one is
      written by today's live flush and may legitimately be smaller);
    * ``instruments_etf.parquet`` -> the upstream ETF code table that
      ``quote_service`` uses to split ``etf_records`` from ``stock_records``.

    Requesting only the intersection means every returned row is classified as
    ETF upstream, so no LOF quote leaks into the stock partition. The two LOF
    symbols in the strategy pool (161226.SZ / 501018.SH) are absent from the
    upstream ETF table by design; they stay out rather than being relabelled.
    """
    global _pool_cache
    try:
        parts = sorted(_ETF_DAILY.glob('date=*/part.parquet'))[-5:]
        if not parts or not _ETF_INSTRUMENTS.exists():
            return []
        stamp = (parts[-1].stat().st_mtime, _ETF_INSTRUMENTS.stat().st_mtime)
        if _pool_cache and _pool_cache[0] == stamp:
            return _pool_cache[1]
        import polars as pl

        historical: set[str] = set()
        for part in parts:
            frame = pl.read_parquet(str(part))
            if not frame.is_empty() and 'symbol' in frame.columns:
                historical.update(str(s).upper()
                                  for s in frame['symbol'].cast(pl.Utf8).to_list() if s)
        upstream = pl.read_parquet(str(_ETF_INSTRUMENTS))
        recognised = ({str(s).upper() for s in upstream['symbol'].cast(pl.Utf8).to_list()}
                      if 'symbol' in upstream.columns else set())
        symbols = sorted(historical & recognised)
        _pool_cache = (stamp, symbols)
        return symbols
    except Exception as exc:  # noqa: BLE001 -- best-effort only
        log.warning('ETF_REALTIME_SKIPPED: cannot read ETF pool: %s', exc)
        return []


def _names() -> dict[str, str]:
    global _name_cache
    if _name_cache is not None:
        return _name_cache
    result: dict[str, str] = {}
    try:
        import polars as pl

        if _INSTRUMENTS.exists():
            frame = pl.read_parquet(str(_INSTRUMENTS))
            if 'symbol' in frame.columns and 'name' in frame.columns:
                for symbol, name in zip(frame['symbol'].cast(pl.Utf8).to_list(),
                                        frame['name'].cast(pl.Utf8).to_list()):
                    if name and name != symbol:
                        result[str(symbol).upper()] = str(name)
    except Exception as exc:  # noqa: BLE001 -- names are cosmetic
        log.debug('ETF_REALTIME name lookup unavailable: %s', exc)
    _name_cache = result
    return result


def _normalise_clock(raw) -> int | None:
    """HHMMSSmmm (9 digits) -> HHMMSSmm (8 digits) for admit_realtime's HHMM gate.

    ``quote_quality.admit_realtime`` reads ``clock_raw // 10000`` as HHMM, i.e.
    it expects the first four digits to be the hour/minute. The explicit quote
    record carries one extra trailing digit compared with the category-ranking
    record. Truncating to the leading eight digits is pure field parsing; the
    untouched original value is always retained in ``source_time_raw``.
    """
    if not isinstance(raw, int) or raw <= 0:
        return None
    text = str(raw)
    if len(text) < 8 or not text.isdigit():
        return None
    return int(text[:8])


def augment(live, server_dt: datetime, max_lag_minutes: int = 10) -> list[dict]:
    """Return ADMITTED ETF rows shaped exactly like ``market_snapshot`` rows.

    ``server_dt`` is the already handshake-verified TDX session datetime; the
    caller (``market_snapshot``) has already proven the session date equals the
    Beijing date. Any failure here is isolated: return [] and log, never raise.
    """
    if not enabled():
        return []
    if not isinstance(server_dt, datetime) or server_dt.date() != datetime.now(CN).date():
        return []  # after-hours / unexpected session: leave the stock snapshot alone
    symbols = pool()
    if not symbols:
        return []
    try:
        started = time.perf_counter()
        quotes = live._run(
            lambda c: c.helpers.full_quotes([_tdx_code(s, 'etf') for s in symbols])
        )
        ts_ms = int(server_dt.replace(tzinfo=CN).timestamp() * 1000)
        wall_minutes = server_dt.hour * 60 + server_dt.minute
        reference, _phase, _in_session = quote_session_state(server_dt)
        names = _names()
        out: list[dict] = []
        rejected: dict[str, int] = {}
        for quote in quotes or []:
            symbol = _symbol_of(quote)
            if not symbol or symbol not in symbols:
                continue  # never introduce a symbol outside the 52-symbol pool
            clock_raw = _attr(quote, 'time_raw')
            clock = _normalise_clock(clock_raw)
            price = _num(_attr(quote, 'last_price'))
            prev = _num(_attr(quote, 'pre_close_price'))
            volume = _num(_attr(quote, 'total_hand'))
            verdict, detail = admit_realtime(symbol, price, prev, volume,
                                             clock, server_dt, max_lag_minutes)
            if verdict != ADMITTED:
                rejected[str(verdict)] = rejected.get(str(verdict), 0) + 1
                continue
            minutes = detail['minutes']
            wall_lag = wall_minutes - minutes
            phase = detail['session_phase']
            in_session = detail['in_session']
            out.append({
                'symbol': symbol,
                # Honest fallback to the code when the local instrument table
                # has no Chinese name for this ETF (same policy as the 16
                # unnamed index/ETF instruments elsewhere in the deployment).
                'name': names.get(symbol) or symbol,
                'source': 'eltdx:full_quotes_etf',
                'last_price': price,
                'prev_close': prev,
                'open': _num(_attr(quote, 'open_price')),
                'high': _num(_attr(quote, 'high_price')),
                'low': _num(_attr(quote, 'low_price')),
                'volume': volume,
                'amount': _num(_attr(quote, 'amount')),
                'change_pct': price / prev - 1 if price is not None and prev else None,
                'change_amount': price - prev,
                'timestamp': ts_ms,
                'event_time': server_dt.isoformat(),
                'observed_at': datetime.now(CN).isoformat(),
                'stale': wall_lag > max_lag_minutes,
                'wall_clock_lag_minutes': wall_lag,
                'session_phase': phase,
                'quote_boundary_hhmm': hhmm(reference) if reference is not None else None,
                'source_event_hhmm': hhmm(minutes),
                'freshness_reason': ('IN_SESSION' if in_session else
                    'LUNCH_BREAK_FINAL_SNAPSHOT' if phase == 'LUNCH_BREAK' else
                    'AFTER_HOURS_FINAL_SNAPSHOT'),
                'clock_evidence': REALTIME_EVIDENCE,
                'source_time_raw': clock_raw,
            })
        log.info('ETF_REALTIME_ACTIVE: pool=%d admitted=%d rejected=%s elapsed=%.2fs',
                 len(symbols), len(out), rejected or '{}', time.perf_counter() - started)
        return out
    except Exception as exc:  # noqa: BLE001 -- never break the stock snapshot
        log.warning('ETF_REALTIME_SKIPPED: %s (%s)', exc, type(exc).__name__)
        return []
