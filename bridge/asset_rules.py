"""D03: asset identity, trading rules, units and special-code handling.

Every symbol is resolved to a single, auditable identity before any bar is
read. This is the gate that prevents a stock code from being read as an ETF, an
index dividend unit from being treated as a share price, or a Beijing/92x code
from silently dropping out of a universe. No network; the rules are derived from
the TDX filename prefixes and exchange conventions already enforced elsewhere.
"""
from __future__ import annotations

import re

_SH_INDEX = re.compile(r'^000\d{3}$')          # SH 000xxx indices (incl. 000001 上证指数)
_SZ_INDEX = re.compile(r'^399\d{3}$')          # SZ 399xxx indices
_BJ_INDEX = re.compile(r'^899\d{3}$')          # BJ 899xxx indices
_SH_ETF = re.compile(r'^(5[1268]|51|52|56|58)\d{4}$')
_SZ_ETF = re.compile(r'^15\d{4}$')
_BJ_STOCK = re.compile(r'^8\d{5}$|^4\d{5}$|^92\d{4}$')
_NORMAL_STOCK = re.compile(r'^[036]\d{5}$|^60\d{4}$|^688\d{3}$|^00\d{4}$|^30\d{4}$')


def exchange_of(symbol):
    return symbol[-2:].upper()


def _code(symbol):
    return symbol[:-3] if '.' in symbol else symbol


def classify_asset(symbol):
    """Return 'stock' | 'index' | 'etf' for a well-formed symbol."""
    code = _code(symbol)
    exch = exchange_of(symbol)
    if exch == 'SH':
        if _SH_INDEX.match(code) or code == '000001':
            return 'index'
        if _SH_ETF.match(code):
            return 'etf'
        return 'stock'
    if exch == 'SZ':
        if _SZ_INDEX.match(code):
            return 'index'
        if _SZ_ETF.match(code):
            return 'etf'
        return 'stock'
    if exch == 'BJ':
        if _BJ_INDEX.match(code):
            return 'index'
        return 'stock'  # Beijing stocks incl. 8xx/4xx/92x
    raise ValueError(f'Unknown exchange in symbol {symbol!r}')


def is_special_code(symbol):
    """Codes with non-standard handling: BJ, 92x, index, ETF."""
    code = _code(symbol)
    return (exchange_of(symbol) == 'BJ' or bool(_BJ_STOCK.match(code))
            or classify_asset(symbol) in ('index', 'etf'))


def price_tick(symbol):
    """Minimum price increment. CN A-shares and most ETFs use 0.01 CNY."""
    return 0.01


def volume_unit(asset_type):
    """TDX stores stock volume in 手 (lots=100 shares); indices are unitless counts."""
    return 'hand' if asset_type == 'stock' else 'unit'


def amount_unit():
    return 'CNY'


def asset_identity(symbol):
    """Full auditable identity record for a symbol."""
    code = _code(symbol)
    exch = exchange_of(symbol)
    asset_type = classify_asset(symbol)
    return {
        'symbol': symbol,
        'code': code,
        'exchange': exch,
        'asset_type': asset_type,
        'market': {'SH': 'SSE', 'SZ': 'SZSE', 'BJ': 'BSE'}.get(exch),
        'price_tick': price_tick(symbol),
        'volume_unit': volume_unit(asset_type),
        'amount_unit': amount_unit(),
        'is_special_code': is_special_code(symbol),
        'is_etf': asset_type == 'etf',
        'is_index': asset_type == 'index',
    }


def validate_symbol(symbol):
    if not re.fullmatch(r'\d{6}\.(SH|SZ|BJ)', str(symbol).upper()):
        raise ValueError(f'Malformed symbol {symbol!r}; expected 6 digits + .SH/.SZ/.BJ')
    return asset_identity(symbol)
