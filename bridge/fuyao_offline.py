"""Host-side, offline-only adapter for the THS fuyao API.

This module is deliberately NOT part of the container's data path. The pinned
image runs with a source policy that blocks every vendor domain (including
``fuyao.aicubes.cn``); only the host-side bridge is allowed to reach loopback.
The importer therefore runs on the host, writes ordinary parquet/json files into
``data-local/fuyao/``, and the container only ever reads those local files.

Hard invariants:

* The API key never leaves the host process. It is read from ``FUYAO_API_KEY``
  or ``runtime/fuyao.env`` (0600, not mounted into the container, gitignored).
  It is never written to ``.env`` (compose env_file), to ``data-local/``, to a
  manifest, to a log line or to a response.
* Nothing here registers a TSP data provider, changes the capability matrix or
  relaxes the container network guard.
* ``report_date_ms`` is NOT a verified point-in-time disclosure date. Live
  probing (2026-11-04, 4 symbols x 3 statements x 8 periods) showed that the
  most recent four periods carry plausible per-issuer disclosure dates, while
  older periods are back-filled with the newest batch date for the same quarter
  (lags of 389..479 days) and balance_sheet rows sometimes disagree with the
  other two statements for the same (symbol, period_end). Every row therefore
  keeps ``announce_date_candidate`` + ``report_date_quality`` and
  ``pit_verified=False``. The upstream ``announce_date`` column is never set.
"""
from __future__ import annotations

import json
import os
import threading
import time
from datetime import date, datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import httpx

BASE_URL = 'https://fuyao.aicubes.cn'
KEY_ENV = 'FUYAO_API_KEY'
ROOT = Path(__file__).resolve().parents[1]
KEY_FILE = ROOT / 'runtime' / 'fuyao.env'
OUT_DIR = ROOT / 'data-local' / 'fuyao'

CATALOG_PATH = '/api/a-share-index/catalog/ths-index-list'
CONSTITUENTS_PATH = '/api/a-share-index/constituents/ths-stock-list'
SNAPSHOT_PATH = '/api/a-share/prices/snapshot'
STATEMENT_PATHS = {
    'income': '/api/a-share/financials/income-statements',
    'balance_sheet': '/api/a-share/financials/balance-sheets',
    'cash_flow': '/api/a-share/financials/cash-flow-statements',
}
TAGS = {'concept': 'cn_concept', 'industry': 'industry'}

# Copied from the pinned upstream provider (app/plugins/fuyao/provider.py) so the
# offline tables use the same canonical column names the UI/backtest expect.
# Field mapping is inherited, not independently verified -> field_mapping_verified=False.
FIELD_MAPS = {
    'income': {
        'operating_income': 'revenue', 'operating_costs': 'operating_cost',
        'sales_fee': 'selling_expense', 'manage_fee': 'admin_expense',
        'research_and_development_expenses': 'rd_expense',
        'operating_profit': 'operating_profit', 'interest_expenses': 'financial_expense',
        'profit_total': 'total_profit', 'income_tax_expense': 'income_tax',
        'net_profit': 'net_income', 'parent_holder_net_profit': 'net_income_attributable',
        'basic_eps': 'basic_eps',
    },
    'balance_sheet': {
        'assets_total': 'total_assets', 'total_current_assets': 'total_current_assets',
        'non_current_nets_total': 'total_non_current_assets', 'cash': 'cash_and_equivalents',
        'accounts_receivable': 'accounts_receivable', 'total_debt': 'total_liabilities',
        'holder_equity_total': 'total_equity',
    },
    'cash_flow': {
        'act_cash_flow_net': 'net_operating_cash_flow',
        'invest_cash_flow_net': 'net_investing_cash_flow',
        'financing_cash_flow_net': 'net_financing_cash_flow',
        'pay_fixed_assets_etc_cash': 'capex',
        'cash_equivalents_net_addition': 'net_cash_change',
    },
}

_META_KEYS = {
    'thscode', 'ticker', 'period', 'fiscal_year', 'fiscal_period',
    'period_end_ms', 'report_date_ms', 'currency', 'name',
}
_SH_MS = 28_800_000
_MIN_LAG_DAYS = 10
_MAX_LAG_DAYS = 130

QUALITY_CANDIDATE = 'ANNOUNCE_DATE_CANDIDATE'
QUALITY_BACKFILL = 'HISTORICAL_BACKFILL_SUSPECT'
QUALITY_CONFLICT = 'CROSS_TABLE_CONFLICT'
QUALITY_MISSING = 'REPORT_DATE_MISSING'
QUALITY_NEGATIVE = 'REPORT_DATE_BEFORE_PERIOD_END'
QUALITY_SHORT = 'LAG_OUTSIDE_DISCLOSURE_WINDOW'


class FuyaoOfflineError(RuntimeError):
    """Key missing, transport failure, or a non-zero vendor envelope."""


def load_api_key(explicit: str | None = None) -> tuple[str, str]:
    """Return (key, source label). Never log or echo the key itself."""
    if explicit:
        return explicit.strip(), 'cli-argument'
    value = os.environ.get(KEY_ENV, '').strip()
    if value:
        return value, f'environment:{KEY_ENV}'
    if KEY_FILE.is_file():
        for line in KEY_FILE.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if line.startswith(KEY_ENV + '=') and not line.startswith('#'):
                candidate = line.split('=', 1)[1].strip().strip('"').strip("'")
                if candidate:
                    return candidate, f'host-only-file:{KEY_FILE.name}'
    raise FuyaoOfflineError(
        f'未找到 {KEY_ENV}。请设置环境变量，或写入 {KEY_FILE}（chmod 600，勿写入 .env）。'
    )


def date_of_ms(value) -> str | None:
    """fuyao *ms is Beijing midnight; +8h converts it to a calendar date."""
    if value is None:
        return None
    try:
        stamp = int(value)
    except (TypeError, ValueError):
        return None
    if stamp <= 0:
        return None
    return datetime.fromtimestamp((stamp + _SH_MS) // 1000, tz=timezone.utc).date().isoformat()


def classify_report_date(period_end: str | None, report_date: str | None) -> str:
    """Label an individual row's disclosure-date quality. Never claims PIT."""
    if not period_end or not report_date:
        return QUALITY_MISSING
    try:
        lag = (date.fromisoformat(report_date) - date.fromisoformat(period_end)).days
    except ValueError:
        return QUALITY_MISSING
    if lag < 0:
        return QUALITY_NEGATIVE
    if lag > _MAX_LAG_DAYS:
        return QUALITY_BACKFILL
    if lag < _MIN_LAG_DAYS:
        return QUALITY_SHORT
    return QUALITY_CANDIDATE


class FuyaoOfflineClient:
    """Bounded, retrying REST client. No provider registration, no fallback."""

    def __init__(self, api_key: str, base_url: str = BASE_URL,
                 timeout: float = 20.0, retries: int = 3):
        if not api_key:
            raise FuyaoOfflineError('empty fuyao key')
        self._http = httpx.Client(
            base_url=base_url, headers={'X-api-key': api_key}, timeout=timeout)
        self.retries = max(1, retries)

    def close(self):
        self._http.close()

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()

    def get(self, path: str, params: dict) -> dict:
        last = None
        for attempt in range(self.retries):
            try:
                response = self._http.get(path, params=params)
            except httpx.HTTPError as exc:
                last = f'network: {type(exc).__name__}'
            else:
                if response.status_code == 200:
                    try:
                        payload = response.json()
                    except ValueError as exc:
                        raise FuyaoOfflineError(f'non-JSON response: {path}') from exc
                    code = payload.get('code')
                    if code in (0, '0', None):
                        return payload.get('data') or {}
                    # 4001 = rate limit; retry. Everything else is terminal.
                    last = f'code={code}: {payload.get("message", "")}'
                    if str(code) != '4001':
                        raise FuyaoOfflineError(f'{path}: {last}')
                elif response.status_code in (429, 500, 502, 503, 504):
                    last = f'HTTP {response.status_code}'
                else:
                    raise FuyaoOfflineError(f'{path}: HTTP {response.status_code}')
            if attempt + 1 < self.retries:
                time.sleep(0.4 * (2 ** attempt))
        raise FuyaoOfflineError(f'{path}: retries exhausted ({last})')

    @staticmethod
    def _item(data: dict) -> list[dict]:
        rows = data.get('item')
        return rows if isinstance(rows, list) else []

    def universe(self) -> list[str]:
        """All A-share thscodes from the paginated snapshot (one page at 6000)."""
        out, offset = [], 0
        for _ in range(50):
            data = self.get(SNAPSHOT_PATH, {'limit': 6000, 'offset': offset})
            rows = self._item(data)
            if not rows:
                break
            out.extend(str(r['thscode']) for r in rows
                       if isinstance(r, dict) and r.get('thscode'))
            total = int(data.get('total') or 0)
            offset += len(rows)
            if total and len(out) >= total:
                break
        return list(dict.fromkeys(out))

    def financial_statements(self, stmt: str, thscode: str, limit: int = 8) -> list[dict]:
        path = STATEMENT_PATHS.get(stmt)
        if path is None:
            raise FuyaoOfflineError(f'unknown statement: {stmt}')
        return self._item(self.get(path, {
            'thscode': thscode, 'period': 'quarterly',
            'limit': max(1, min(20, limit)),
        }))

    def catalog(self, tag: str) -> list[dict]:
        return self._item(self.get(CATALOG_PATH, {'tag': tag}))

    def constituents(self, thscode: str) -> list[dict]:
        return self._item(self.get(CONSTITUENTS_PATH, {'thscode': thscode}))


def normalize_statement(stmt: str, symbol: str, raw: dict, imported_at: str) -> dict:
    """One raw vendor row -> labelled canonical row. No invented announce_date."""
    field_map = FIELD_MAPS[stmt]
    period_end = date_of_ms(raw.get('period_end_ms'))
    report_date = date_of_ms(raw.get('report_date_ms'))
    quality = classify_report_date(period_end, report_date)
    row = {
        'symbol': symbol,
        'period_end': period_end,
        'fiscal_year': raw.get('fiscal_year'),
        'fiscal_period': raw.get('fiscal_period'),
        'currency': raw.get('currency'),
        'report_date': report_date,
        'report_date_ms': raw.get('report_date_ms'),
        'period_end_ms': raw.get('period_end_ms'),
        'announce_date_candidate': report_date if quality == QUALITY_CANDIDATE else None,
        'report_date_quality': quality,
        'source': f'fuyao:{stmt}',
        'source_endpoint': STATEMENT_PATHS[stmt],
        'field_mapping_source': 'upstream_fuyao_provider_canonical_map',
        'field_mapping_verified': False,
        'announce_date_verified': False,
        'pit_verified': False,
        'coverage': 'OFFICIAL_STATEMENT_VALUES_NOT_PIT',
        'imported_at': imported_at,
    }
    for src, dst in field_map.items():
        row[dst] = _number(raw.get(src))
    for src, value in raw.items():
        if src in _META_KEYS or src in field_map or src in row:
            continue
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            row[src] = float(value)
    return row


def _number(value):
    if value is None or isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if number == number and abs(number) < 1e30 else None


def resolve_announce_candidates(statements: dict[str, list[dict]]) -> list[dict]:
    """Cross-check the three statements for one (symbol, period_end).

    A candidate is only kept when all three statements agree and every row's
    lag is inside the statutory disclosure window. Conflict/backfill rows are
    retained with an explicit label, never silently dropped or zero-filled.
    """
    grouped: dict[tuple, dict[str, dict]] = {}
    for stmt, rows in statements.items():
        for row in rows:
            key = (row.get('symbol'), row.get('period_end'))
            if None in key:
                continue
            grouped.setdefault(key, {})[stmt] = row
    out = []
    for (symbol, period_end), by_stmt in sorted(grouped.items()):
        dates = {r.get('report_date') for r in by_stmt.values()}
        qualities = {r.get('report_date_quality') for r in by_stmt.values()}
        if len(dates) > 1:
            quality, candidate = QUALITY_CONFLICT, None
        elif QUALITY_BACKFILL in qualities or QUALITY_NEGATIVE in qualities or QUALITY_SHORT in qualities:
            quality, candidate = sorted(qualities)[0], None
        elif len(by_stmt) == len(STATEMENT_PATHS) and qualities == {QUALITY_CANDIDATE}:
            quality, candidate = QUALITY_CANDIDATE, next(iter(dates))
        else:
            quality, candidate = QUALITY_MISSING, None
        out.append({
            'symbol': symbol,
            'period_end': period_end,
            'report_date': next(iter(dates)) if len(dates) == 1 else None,
            'report_date_variants': sorted(str(d) for d in dates if d),
            'tables_present': sorted(by_stmt),
            'announce_date_candidate': candidate,
            'report_date_quality': quality,
            'announce_date_verified': False,
            'pit_verified': False,
            'coverage': 'CANDIDATE_ONLY_NO_PIT_CLAIM',
            'source': 'fuyao:financials:3-statement-crosscheck',
            'note': (
                'report_date_ms 仅对最近若干期表现为个股披露日；历史期被按季度回填为'
                '最新批次日，且三表偶有冲突。未经独立披露日源验证，不得作为 PIT 公告日。'
            ),
        })
    return out


def uniform_rows(rows: list[dict]) -> list[dict]:
    """Pad every row to the same key set so parquet schema inference is stable."""
    if not rows:
        return []
    keys = sorted({k for row in rows for k in row})
    return [{k: row.get(k) for k in keys} for row in rows]


def write_parquet(rows: list[dict], path: Path):
    import polars as pl

    cleaned = uniform_rows(rows)
    if not cleaned:
        return 0
    if not path.parent.is_dir():
        path.parent.mkdir(parents=True)
    tmp = path.with_name(path.name + '.part')
    pl.DataFrame(cleaned, infer_schema_length=None).write_parquet(tmp)
    tmp.replace(path)
    return len(cleaned)


class FuyaoStore:
    """Read-only view of the host-side import. Safe to call from the container."""

    def __init__(self, root=None):
        self.root = Path(root) if root else OUT_DIR
        self._lock = threading.RLock()
        self._cache: dict[str, tuple[float, object]] = {}

    def _read_parquet(self, name):
        path = self.root / name
        if not path.is_file():
            return []
        stamp = path.stat().st_mtime_ns
        with self._lock:
            hit = self._cache.get(name)
            if hit and hit[0] == stamp:
                return hit[1]
        try:
            import polars as pl
            rows = pl.read_parquet(path).to_dicts()
        except Exception:
            rows = []
        with self._lock:
            self._cache[name] = (stamp, rows)
        return rows

    def manifest(self):
        path = self.root / 'manifest.json'
        if not path.is_file():
            return {}
        try:
            return json.loads(path.read_text(encoding='utf-8'))
        except (OSError, ValueError):
            return {}

    def statements(self, table, symbols=None):
        name = f'financial_{table}.parquet'
        rows = self._read_parquet(name)
        if symbols:
            wanted = set(symbols)
            rows = [r for r in rows if r.get('symbol') in wanted]
        return rows

    def candidates(self):
        return self._read_parquet('financial_announce_candidates.parquet')

    def candidate_index(self):
        return {(r.get('symbol'), r.get('period_end')): r for r in self.candidates()}

    def membership(self, kind):
        return self._read_parquet(f'ths_{kind}_membership.parquet')

    def status(self):
        manifest = self.manifest()
        return {
            'available': bool(manifest),
            'key_location': 'host-only: runtime/fuyao.env or FUYAO_API_KEY (never in container)',
            'key_in_manifest': False,
            'container_network': 'UNCHANGED_BLOCKED',
            'capability_matrix': 'UNCHANGED',
            'imported_at': manifest.get('imported_at'),
            'statement_tables': (manifest.get('financial') or {}).get('statement_counts', {}),
            'announce_candidates': len(self.candidates()),
            'official_boards': {
                kind: len(self.membership(kind)) for kind in TAGS
            },
            'announce_date_semantics': manifest.get('report_date_verdict'),
            'pit_verified': False,
            'announce_date_verified': False,
            'field_mapping_verified': False,
        }


def now_iso():
    return datetime.now(ZoneInfo('Asia/Shanghai')).isoformat(timespec='seconds')
