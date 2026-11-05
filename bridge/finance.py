"""Financial observation layer for the local TSP deployment.

Two independent, explicitly labelled sources are combined:

* ``vipdoc/cw/gpcw*.dat|zip`` (local, read-only) supplies the **report period
  spine**. The gpcw header contains the report date, so ``period_end`` is a
  verified observation rather than an inference from a disclosure date. Only
  col1/col4 are read; they were numerically cross-checked against the eltdx
  named ``eps_raw`` / ``mei_gu_jing_zi_chan_raw_float`` fields and are exposed
  as ``eps_observation`` / ``bps_observation`` (semantics still not
  authoritatively documented).
* ``eltdx.corporate.finance_batch`` supplies the **latest named snapshot**.
  eltdx documents four unit conversions (shares x10000, monetary x1000);
  every other native field keeps its raw unit behind a ``_raw`` suffix.

What this layer deliberately does NOT do:

* ``announce_date`` stays null. TDX ``updated_date`` is a finance-file update
  date, not a verified disclosure date, so it is stored separately as
  ``source_updated_date``. PIT fundamentals therefore remain disabled.
* The host-side fuyao import (``data-local/fuyao/``) is attached as a labelled
  cross-reference only. Live probing showed its ``report_date_ms`` is a
  plausible disclosure date for recent periods but a back-filled batch date for
  older periods and is sometimes inconsistent across the three statements.
  It is exposed as ``fuyao_announce_date_candidate`` and ``report_date_quality``;
  it NEVER becomes ``announce_date`` and never flips ``pit_verified``.
* Missing values stay null. No zero filling, no forward fill, no silent drop
  of a whole table when one chunk fails.
* ``raw`` / ``observation`` are not handled here; they continue to go through
  ``LocalStore.financials`` -> ``TDXLocal.financials`` with numbered columns.
"""
from __future__ import annotations

import math
import struct
import threading
import time
import zipfile
from datetime import datetime
from pathlib import Path

from .schemas import SourceUnavailable, symbol_parts

ALIASES = {'balance': 'balance_sheet', 'cashflow': 'cash_flow'}

TABLE_FIELDS = {
    'metrics': (
        'eps', 'bps', 'total_shares', 'circulating_shares',
        'total_assets_yuan', 'net_profit_yuan', 'shareholders_raw',
    ),
    'income': (
        'eps', 'revenue_raw', 'operating_profit_raw', 'business_profit_raw',
        'profit_total_raw', 'after_tax_profit_raw', 'net_profit_yuan',
        'investment_income_raw', 'undistributed_profit_raw',
    ),
    'balance_sheet': (
        'total_assets_yuan', 'current_assets_raw', 'fixed_assets_raw',
        'intangible_assets_raw', 'net_assets_raw', 'inventory_raw',
        'receivables_raw', 'current_liabilities_raw',
        'long_term_liabilities_raw', 'capital_reserve_raw',
    ),
    'cash_flow': (
        'operating_cash_flow_raw', 'total_cash_flow_raw', 'net_profit_yuan',
    ),
    'shares': (
        'total_shares', 'circulating_shares', 'state_shares_raw',
        'promoter_shares_raw', 'legal_person_shares_raw', 'b_shares_raw',
        'h_shares_raw',
    ),
}

_UNIT_POLICY = (
    'eps/bps/total_shares/circulating_shares/total_assets_yuan/net_profit_yuan: '
    'eltdx-declared units; *_raw: native TDX unit NOT verified; '
    '*_observation: gpcw numbered column, semantics NOT authoritatively mapped'
)
_NOTE = (
    'updated_date 是通达信财务文件更新日，不等同公告日；announce_date 保持空值，'
    '因此该表不可用于 PIT 财务因子/回测，也不构成完整三大报表。'
    'fuyao 的 report_date 仅作候选公告日交叉标注（fuyao_announce_date_candidate），'
    '其历史期存在按季度回填与三表冲突，未经独立披露日源验证，同样不用于 PIT。'
)

_INDEX_CACHE: dict[tuple, tuple[float, dict]] = {}
_INDEX_LOCK = threading.RLock()


def _finite(value):
    if value is None:
        return None
    number = float(value)
    return number if math.isfinite(number) and abs(number) < 1e30 else None


def _payload(path: Path) -> bytes:
    if path.suffix != '.zip':
        return path.read_bytes()
    with zipfile.ZipFile(path) as archive:
        members = [item for item in archive.infolist() if item.filename.endswith('.dat')]
        if len(members) != 1 or members[0].file_size > 128 * 1024 * 1024:
            raise SourceUnavailable(f'invalid gpcw archive: {path.name}')
        return archive.read(members[0])


def _period_files(root: Path) -> list[Path]:
    cw = root / 'cw'
    if not cw.is_dir():
        return []
    by_period = {p.name[4:12]: p for p in cw.glob('gpcw????????.zip')}
    # .dat wins over .zip for the same report period (matches TDXLocal.financials).
    by_period.update({p.name[4:12]: p for p in cw.glob('gpcw????????.dat')})
    return [by_period[key] for key in sorted(by_period, reverse=True)]


def gpcw_index(root, max_periods=8, ttl=1800.0):
    """Scan local gpcw report periods once; cache the {code: [periods]} spine.

    Only the first four floats of each record are read, so a full-market scan
    stays bounded even with 297 period files and 658 columns per record.
    """
    root = Path(root)
    key = (str(root), max_periods)
    with _INDEX_LOCK:
        hit = _INDEX_CACHE.get(key)
        if hit and time.monotonic() - hit[0] < ttl:
            return hit[1]
    index: dict[str, list[tuple]] = {}
    today = int(datetime.now().strftime('%Y%m%d'))
    for path in _period_files(root):
        stamp = path.name[4:12]
        if not stamp.isdigit() or len(stamp) != 8 or int(stamp) > today:
            continue  # future report placeholder
        try:
            report_date = datetime.strptime(stamp, '%Y%m%d').date().isoformat()
        except ValueError:
            continue
        try:
            payload = _payload(path)
        except Exception as exc:  # noqa: BLE001 — explicit per-file failure below
            raise SourceUnavailable(f'gpcw read failed: {path.name}: {exc}') from exc
        if len(payload) < 20:
            continue
        _, report, count, _, size, _ = struct.unpack_from('<hIHIII', payload)
        if count == 0:
            continue
        if size % 4 or size > 16384 or size < 16 or len(payload) < 20 + 11 * count:
            raise SourceUnavailable(f'invalid gpcw dimensions: {path.name}')
        if str(report) != stamp:
            raise SourceUnavailable(f'gpcw header/report mismatch: {path.name}')
        for i in range(count):
            code, _, offset = struct.unpack_from('<6scI', payload, 20 + 11 * i)
            symbol_code = code.decode('ascii', errors='ignore')
            bucket = index.get(symbol_code)
            if bucket is None:
                bucket = index[symbol_code] = []
            if len(bucket) >= max_periods:
                continue
            if offset + 16 > len(payload):
                continue
            col1, _, _, col4 = struct.unpack_from('<4f', payload, offset)
            bucket.append((report_date, _finite(col1), _finite(col4), path.name))
    with _INDEX_LOCK:
        _INDEX_CACHE[key] = (time.monotonic(), index)
    return index


class FinancialSources:
    """Assemble upstream-compatible financial rows without inventing PIT data."""

    def __init__(self, tdx, live, max_periods=8, ttl=900.0, fuyao=None):
        self.tdx = tdx
        self.live = live
        self.max_periods = max_periods
        self.ttl = ttl
        self.fuyao = fuyao
        self._lock = threading.RLock()
        self._snapshots: dict[tuple, tuple[float, dict, str | None]] = {}
        self._fuyao_index = None
        self._fuyao_stamp = 0.0

    def candidates(self):
        """Read the host-side fuyao candidate dates, labelled, never as PIT."""
        now = time.monotonic()
        with self._lock:
            if self._fuyao_index is not None and now - self._fuyao_stamp < self.ttl:
                return self._fuyao_index
        store = self.fuyao
        if store is None:
            try:
                from .fuyao_offline import FuyaoStore
                store = FuyaoStore()
            except Exception:  # noqa: BLE001 — an absent import must not break finance
                store = None
        try:
            index = store.candidate_index() if store else {}
        except Exception:  # noqa: BLE001 — degraded cross-reference, not a failure
            index = {}
        with self._lock:
            self._fuyao_index = index
            self._fuyao_stamp = now
        return index

    def snapshot(self, symbols):
        key = tuple(symbols)
        with self._lock:
            hit = self._snapshots.get(key)
            if hit and time.monotonic() - hit[0] < self.ttl:
                return hit[1], hit[2]
        try:
            rows = self.live.finance_snapshot(symbols)
            error = None
        except Exception as exc:  # noqa: BLE001 — explicit, labelled degradation
            rows, error = {}, f'{type(exc).__name__}: {exc}'
        with self._lock:
            self._snapshots[key] = (time.monotonic(), rows, error)
        return rows, error

    def rows(self, table, symbols, latest_only=True):
        table = ALIASES.get(table, table)
        if table not in TABLE_FIELDS:
            raise SourceUnavailable(f'unsupported financial table: {table}')
        symbols = list(dict.fromkeys(symbols or []))
        if not symbols:
            return []
        spine = gpcw_index(self.tdx.vipdoc, self.max_periods)
        snapshot, snapshot_error = self.snapshot(symbols)
        fuyao_index = self.candidates()
        out = []
        for symbol in symbols:
            code, _ = symbol_parts(symbol)
            periods = spine.get(code, [])
            if not periods:
                continue  # no verified report period -> no invented row
            selected = periods[:1] if latest_only else periods[:self.max_periods]
            for position, (period_end, eps_obs, bps_obs, source_file) in enumerate(selected):
                record = snapshot.get(symbol) if position == 0 else None
                row = {
                    'symbol': symbol,
                    'period_end': period_end,
                    'announce_date': None,
                    'ann_date': None,
                    'source': 'tdx_gpcw_period+eltdx_finance_snapshot',
                    'period_end_source': f'tdx_gpcw:{source_file}',
                    'snapshot_source': 'eltdx:corporate.finance_batch' if record else None,
                    'snapshot_status': 'LATEST_SNAPSHOT' if record else (
                        'ELTDX_UNAVAILABLE' if snapshot_error else
                        ('NO_LATEST_RECORD' if position == 0 else 'HISTORICAL_PERIOD_NO_SNAPSHOT')),
                    'snapshot_error': snapshot_error if not record else None,
                    'source_updated_date': record.get('source_updated_date') if record else None,
                    'ipo_date': record.get('ipo_date') if record else None,
                    'eps_observation': eps_obs,
                    'bps_observation': bps_obs,
                    'fuyao_crossref_present': (symbol, period_end) in fuyao_index,
                    'fuyao_report_date': (fuyao_index.get((symbol, period_end)) or {}).get('report_date'),
                    'fuyao_announce_date_candidate': (fuyao_index.get((symbol, period_end)) or {}).get('announce_date_candidate'),
                    'fuyao_report_date_quality': (fuyao_index.get((symbol, period_end)) or {}).get('report_date_quality', 'NO_FUYAO_IMPORT'),
                    'fuyao_pit_verified': False,
                    'pit_verified': False,
                    'announce_date_verified': False,
                    'field_mapping_verified': False,
                    'unit_policy': _UNIT_POLICY,
                    'coverage': 'OBSERVATION_ONLY_NOT_PIT',
                    'note': _NOTE,
                }
                for field in TABLE_FIELDS[table]:
                    row[field] = record.get(field) if record else None
                out.append(row)
        return out
