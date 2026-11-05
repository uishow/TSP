"""Canonical financial schema contract for native TSP tables.

This module is the single source of truth for *what the bridge will assert* about
each native financial table: expected fields, units, report-period semantics
(single-quarter vs cumulative) and the known gpcw column drift across years.

It deliberately asserts **only** what has a verified source. Anything else is
left ``UNKNOWN`` and flagged ``field_mapping_verified=False``. This is the C01
guardrail: no field is admitted into the contract on a hunch, and the local
gpcw observation layer keeps every column numbered (col1..colN) precisely
because the column semantics have not been verified end to end.

The named metrics below come from eltdx's ``corporate.finance_batch`` named
fields, which are the only finance fields whose unit we are willing to assert.
The three statements (income / balance_sheet / cash_flow) and ``shares`` come
from the fuyao offline parquet whose manifest is PIT-disabled.
"""
from __future__ import annotations

# Native table names the upstream TSP expects. Aliases map the legacy bridge
# names onto the canonical ones so a request never 422 on a name we already use.
NATIVE_TABLES = ('metrics', 'income', 'balance_sheet', 'cash_flow', 'shares')
ALIASES = {'balance': 'balance_sheet', 'cashflow': 'cash_flow', 'cashflows': 'cash_flow'}

# gpcw observation tables are NOT three-statement tables; they are raw numbered
# columns from the TDX binary and must never be presented as mapped fields.
OBSERVATION_TABLES = ('raw', 'observation')

# Tables served by the fuyao offline parquet (PIT-disabled, see manifest).
OFFLINE_STATEMENT_TABLES = ('income', 'balance_sheet', 'cash_flow')
OFFLINE_SHARES_TABLE = 'shares'

# Period semantics per statement table. Single-quarter figures must be derived
# from cumulative ones; we never assume a column is single-quarter.
PERIOD_SEMANTICS = {
    'income': 'cumulative_ytd_until_report_end',
    'balance_sheet': 'point_in_time_at_report_end',
    'cash_flow': 'cumulative_ytd_until_report_end',
    'shares': 'point_in_time_at_report_end',
    'metrics': 'point_in_time_latest_named_fields',
}

# Named fields whose unit is asserted because eltdx exposes them by name.
# Monetary items are CNY; share counts are ordinary shares (股).
NAMED_METRIC_FIELDS = {
    'eps': {'unit': 'CNY', 'semantics': 'basic_eps_latest_report'},
    'bps': {'unit': 'CNY', 'semantics': 'net_asset_per_share'},
    'total_shares': {'unit': 'shares', 'semantics': 'total_share_capital'},
    'circulating_shares': {'unit': 'shares', 'semantics': 'float_share_capital'},
    'total_assets_yuan': {'unit': 'CNY', 'semantics': 'total_assets'},
    'net_profit_yuan': {'unit': 'CNY', 'semantics': 'net_profit'},
}

# The gpcw binary keeps reporting columns numbered. Column counts and meaning
# drift across report years (the well-known gpcw schema drift). We therefore
# admit NO semantic mapping here; the observation layer exposes col1..colN and
# marks every field ``field_mapping_verified=False``.
GPCW_OBSERVATION_FIELDS_NOTE = (
    'col1..colN are raw TDX financial binary values; column semantics are '
    'NOT verified. report_period_end is the only admitted date and is the '
    'report header period, never an announcement date.'
)


def normalize_table(name):
    """Return the canonical table name or raise on an unsupported one."""
    if name is None:
        raise ValueError('financial table name required')
    key = str(name).strip().lower()
    if key in NATIVE_TABLES or key in OBSERVATION_TABLES:
        return key
    if key in ALIASES:
        return ALIASES[key]
    raise ValueError(
        f'Unsupported financial table {name!r}; allowed: '
        f'{NATIVE_TABLES + OBSERVATION_TABLES + tuple(ALIASES)}'
    )


def is_observation_table(name):
    return normalize_table(name) in OBSERVATION_TABLES


def is_pit_disabled(table):
    """Every financial table here is PIT-disabled until a verified disclosure date exists."""
    return normalize_table(table) in (
        NATIVE_TABLES + OBSERVATION_TABLES
    )


def expected_fields(table):
    """Fields the contract will assert for a table; observation tables expose none by name."""
    table = normalize_table(table)
    if table in OBSERVATION_TABLES:
        return []  # numbered columns only; semantics unverified
    if table == 'metrics':
        return list(NAMED_METRIC_FIELDS)
    # Three statements / shares: field names are accepted as labels but remain
    # unit-mapping-unverified in this layer. The offline parquet carries its own
    # per-column metadata; we do not re-assert units here.
    return ['report_end', 'announce_date', 'value']


def period_semantics(table):
    return PERIOD_SEMANTICS.get(normalize_table(table), 'unknown')


def verification_status(table):
    """The honest standing of each table's field mapping and PIT readiness."""
    table = normalize_table(table)
    if table in OBSERVATION_TABLES:
        return {
            'table': table,
            'field_mapping_verified': False,
            'pit_verified': False,
            'announce_date_source': None,
            'period_semantics': 'report_header_period_only',
            'note': GPCW_OBSERVATION_FIELDS_NOTE,
        }
    if table in OFFLINE_STATEMENT_TABLES or table == OFFLINE_SHARES_TABLE:
        return {
            'table': table,
            'field_mapping_verified': 'OFFLINE_PARQUET_CARRIES_METADATA',
            'pit_verified': False,  # manifest reports pit_enabled=false
            'announce_date_source': None,
            'period_semantics': period_semantics(table),
            'note': 'Offline parquet present; announcement date unverified, PIT disabled.',
        }
    if table == 'metrics':
        return {
            'table': table,
            'field_mapping_verified': True,  # named eltdx fields only
            'pit_verified': False,
            'announce_date_source': None,
            'period_semantics': period_semantics(table),
            'note': 'Named latest metrics from eltdx finance_batch; not a historical PIT series.',
        }
    return {
        'table': table,
        'field_mapping_verified': False,
        'pit_verified': False,
        'announce_date_source': None,
        'period_semantics': 'unknown',
        'note': 'Table not admitted into the contract.',
    }
