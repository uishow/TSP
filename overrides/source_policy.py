"""Deployment-specific policy: local TSP never contacts remote market vendors.

Install before importing app.main, including in spawned worker interpreters.
Only loopback IPC and the pinned host bridge IP/port are permitted. This is a
Python socket guard for this application, not a host firewall.
"""
from __future__ import annotations

import errno
import ipaddress
import logging
import os
import socket
from dataclasses import dataclass

log = logging.getLogger(__name__)
PROVIDER = 'local_quant'
PROVIDER_FIELDS = frozenset({
    'daily_data_provider', 'adj_factor_provider', 'minute_data_provider',
    'full_minute_data_provider', 'depth5_data_provider',
    'realtime_data_provider', 'financial_data_provider',
})


class SourcePolicyError(PermissionError):
    """A configured source or network destination violates this deployment."""


@dataclass(frozen=True)
class NetworkPolicy:
    bridge_host: str
    bridge_port: int
    bridge_ips: frozenset[str] | set[str]

    def check_address(self, address):
        if isinstance(address, (str, bytes)):
            return  # AF_UNIX paths: no network egress.
        host, port = address[:2]
        if isinstance(host, bytes):
            host = host.decode('ascii')
        host = str(host).lower().rstrip('.')
        if host == 'localhost':
            return
        try:
            if ipaddress.ip_address(host).is_loopback:
                return
        except ValueError:
            pass
        if int(port) == self.bridge_port and (host == self.bridge_host or host in self.bridge_ips):
            return
        raise SourcePolicyError(f'SOURCE_POLICY_BLOCKED: only local_quant bridge is allowed ({host}:{port})')

    def resolve(self, original, host, port, *args, **kwargs):
        self.check_address((host, port))
        return original(host, port, *args, **kwargs)


def install_network_guard():
    if getattr(socket, '_tsp_source_policy_installed', False):
        return
    host = 'host.docker.internal'
    port = 7818
    original_resolve = socket.getaddrinfo
    # Resolve exactly one fixed Docker Desktop gateway before restricting DNS.
    try:
        ips = {row[4][0] for row in original_resolve(host, port, type=socket.SOCK_STREAM)}
    except socket.gaierror:
        ips = set()  # Offline containers still enforce policy; bridge then fails explicitly.
    policy = NetworkPolicy(host, port, frozenset(ips))
    original_connect = socket.socket.connect
    original_connect_ex = socket.socket.connect_ex
    original_sendto = socket.socket.sendto

    def connect(sock, address):
        if sock.family in (socket.AF_INET, socket.AF_INET6):
            policy.check_address(address)
        return original_connect(sock, address)

    def connect_ex(sock, address):
        if sock.family in (socket.AF_INET, socket.AF_INET6):
            try:
                policy.check_address(address)
            except SourcePolicyError:
                return errno.EACCES
        return original_connect_ex(sock, address)

    def sendto(sock, data, *args):
        if sock.family in (socket.AF_INET, socket.AF_INET6):
            policy.check_address(args[-1])
        return original_sendto(sock, data, *args)

    socket.getaddrinfo = lambda host, port, *a, **kw: policy.resolve(original_resolve, host, port, *a, **kw)
    socket.socket.connect = connect
    socket.socket.connect_ex = connect_ex
    socket.socket.sendto = sendto
    socket._tsp_source_policy_installed = True
    # The bridge is accessed directly, never via system/environment HTTP proxies.
    for key in ('HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy'):
        os.environ.pop(key, None)
    os.environ['NO_PROXY'] = os.environ['no_proxy'] = 'localhost,127.0.0.1,::1,host.docker.internal'
    log.warning('SOURCE_POLICY_ACTIVE: vendor egress blocked; local_quant bridge only')


def validate_preferences(updates):
    for key in PROVIDER_FIELDS:
        if key in updates and updates[key] != PROVIDER:
            raise SourcePolicyError(f'SOURCE_POLICY_BLOCKED: {key} must remain {PROVIDER}')


def coerce_preferences(updates):
    """Force every provider selector back to the only permitted source.

    The settings page writes all provider fields on each save, including
    upstream defaults such as ``tickflow`` for fields the user never touched.
    Rejecting the whole payload turns a harmless UI save into a 500 while the
    lock is already enforced by the plugin registry, socket guard and matrix.
    Coercion keeps the lock (no vendor value is ever persisted) and records the
    correction; ``validate_preferences`` remains strict for direct callers.
    """
    payload = dict(updates)
    changed = []
    for key in PROVIDER_FIELDS:
        if key in payload and payload[key] != PROVIDER:
            payload[key] = PROVIDER
            changed.append(key)
    return payload, changed


def matrix_from_sources(registry, sources):
    source = next((s for s in sources if s['name'] == PROVIDER), None)
    rows = []
    for cap in registry:
        declared = source is not None and cap['id'] in source['datasets']
        available = declared and bool(source.get('available'))
        entry = {
            'name': PROVIDER, 'display': '本地量化 · eltdx/AxData', 'kind': 'plugin',
            'available': bool(available), 'status': source.get('status', '') if source else 'not_loaded',
            'note': None if available else '本地桥接或该数据能力尚未验证',
        }
        rows.append({**cap, 'default': PROVIDER, 'tf_available': False,
                     'usable': bool(available), 'current': PROVIDER,
                     'current_display': entry['display'], 'effective': PROVIDER,
                     'effective_display': entry['display'],
                     'candidates': [entry] if available else [],
                     'pending': [entry] if not available else []})
    return {'tickflow_tier': 'disabled', 'capabilities': rows}


def install_enriched_integrity():
    """Keep enriched frames unique per symbol on BOTH read and write paths.

    A dirty kline_daily_enriched partition once multiplied watchlist rows by a
    LEFT JOIN and also polluted the incremental recursion baseline (duplicates
    propagated into every following refresh). The pinned upstream code is left
    untouched; only these four runtime class methods are wrapped.
    """
    from app.tickflow.repository import KlineRepository

    if getattr(KlineRepository, '_tsp_integrity_installed', False):
        return

    def dedupe(frame):
        if frame is None or frame.is_empty() or 'symbol' not in frame.columns:
            return frame
        if frame['symbol'].n_unique() == frame.height:
            return frame
        return frame.unique(subset=['symbol'], keep='last', maintain_order=True)

    orig_latest = KlineRepository.get_enriched_latest
    orig_asset = KlineRepository.get_enriched_latest_asset
    orig_flush = KlineRepository.flush_live_enriched_asset
    orig_merge = KlineRepository.merge_live_enriched_asset

    def latest(self, *, symbols=None, end=None):
        frame, cache_date = orig_latest(self, symbols=symbols, end=end)
        return dedupe(frame), cache_date

    def latest_asset(self, asset_type, refresh=True):
        frame, cache_date = orig_asset(self, asset_type, refresh=refresh)
        return dedupe(frame), cache_date

    def flush(self, asset_type, df):
        return orig_flush(self, asset_type, dedupe(df))

    def merge(self, asset_type, df):
        return orig_merge(self, asset_type, dedupe(df))

    KlineRepository.get_enriched_latest = latest
    KlineRepository.get_enriched_latest_asset = latest_asset
    KlineRepository.flush_live_enriched_asset = flush
    KlineRepository.merge_live_enriched_asset = merge
    KlineRepository._tsp_integrity_installed = True
    log.warning('ENRICHED_INTEGRITY_ACTIVE: symbol-unique read/write enforced')


def install_app_policy():
    """Patch version-pinned extension points before main captures references."""
    if getattr(socket, '_tsp_app_policy_installed', False):
        return
    from app.data_providers.base import ProviderRequestError
    from app.services import preferences
    from app.tickflow import client, policy
    from app.tickflow.capabilities import CapabilitySet
    from app.data_providers import capabilities, custom
    from app.data_providers.custom import loader as custom_loader

    def denied(*args, **kwargs):
        raise ProviderRequestError('SOURCE_POLICY_BLOCKED: TickFlow/vendor fallback disabled; check local_quant source status')

    # Prevent settings/test endpoints from directly invoking another native SDK
    # or a user-supplied URL outside the selected routing matrix.
    original_provider = custom.get_provider
    original_register = custom_loader._register_one_plugin
    original_probe = custom.probe_plugin_key

    def local_provider(name):
        if name != PROVIDER:
            return denied()
        return original_provider(name)

    def local_register(manifest):
        if manifest.get('name') == PROVIDER:
            return original_register(manifest)
        return None

    def local_probe(name, key):
        if name != PROVIDER:
            return False, 'SOURCE_POLICY_BLOCKED: only local_quant is permitted'
        return original_probe(name, key)

    custom.get_provider = custom_loader.get_provider = local_provider
    custom_loader._register_one_plugin = local_register
    custom.probe_plugin_key = custom_loader.probe_plugin_key = local_probe
    custom.create_provider = custom_loader.create_provider = denied
    for name in list(custom_loader._PROVIDERS):
        if name != PROVIDER:
            custom_loader._PROVIDERS.pop(name).close()
    for name in list(custom_loader._PLUGIN_STATUS):
        if name != PROVIDER:
            custom_loader._PLUGIN_STATUS.pop(name)

    client.get_client = client.get_async_client = denied
    client.get_paid_realtime_client = lambda: None
    client.current_endpoint = lambda: 'local_quant (vendor network disabled)'
    client.current_mode = lambda: 'local_only'
    original_save = preferences.save

    def save(updates):
        payload, changed = coerce_preferences(updates)
        for key in changed:
            log.warning('SOURCE_POLICY_COERCED: %s forced back to %s', key, PROVIDER)
        validate_preferences(payload)
        return original_save(payload)

    preferences.save = save
    preferences._allowed_data_providers = lambda: {PROVIDER}
    preferences._validated_provider = lambda raw, key: PROVIDER
    for name in ('get_daily_data_provider', 'get_adj_factor_provider', 'get_minute_data_provider',
                 'get_full_minute_data_provider', 'get_depth5_data_provider',
                 'get_realtime_data_provider', 'get_financial_provider'):
        setattr(preferences, name, lambda: PROVIDER)

    def matrix(current=None, tickflow_tier='none'):
        return matrix_from_sources(capabilities.CAPABILITY_REGISTRY, capabilities._declared_sources())

    def resolved(tickflow_tier='none'):
        return [dict(id=r['id'], label=r['label'], field=r['field'], source=PROVIDER,
                     source_display=r['effective_display'], usable=r['usable'], tf_available=False)
                for r in matrix()['capabilities']]

    capabilities.build_capability_matrix = matrix
    capabilities.resolve_capability_sources = resolved

    def detect(force=False):
        caps = CapabilitySet()
        # Augmentation honors only the installed local provider's declarations.
        policy._augment_custom_sources(caps)
        return caps

    policy.detect_capabilities = detect
    policy._detect_tickflow_caps = lambda force=False: CapabilitySet()
    policy.tier_label = lambda: 'Local only'
    policy.base_tier_name = lambda: 'none'
    policy.probe_log = lambda: ['local_quant only; TickFlow and vendor fallback disabled']
    policy.missing_caps = policy.extras_caps = lambda: []

    # The stock path catches provider failures and silently tries TickFlow.
    # Fail explicitly instead; retain its existing atomic persistence pipeline.
    from app.services import instrument_sync, index_sync

    def stock_instruments():
        items = custom.get_provider(PROVIDER).get_instruments('stock')
        if not items:
            raise ProviderRequestError('local_quant stock instrument list unavailable')
        rows = instrument_sync._flatten_instruments(items, current_limits=False)
        for row, item in zip(rows, items):
            for field in ('source', 'listing_date', 'total_shares', 'float_shares', 'tick_size', 'event_time'):
                if item.get(field) is not None:
                    row[field] = item[field]
        return rows

    instrument_sync._fetch_instruments_via_provider = stock_instruments

    def typed_instruments(instrument_type, asset_type_label):
        import polars as pl
        items = custom.get_provider(PROVIDER).get_instruments(instrument_type)
        if not items:
            raise ProviderRequestError(f'local_quant {instrument_type} instrument list unavailable')
        return pl.DataFrame([{
            'symbol': x['symbol'], 'name': x.get('name'),
            'code': x['symbol'].split('.')[0], 'asset_type': asset_type_label,
            'source': x.get('source', PROVIDER),
        } for x in items]).unique(subset=['symbol']).sort('symbol')

    index_sync._fetch_instruments_by_type = typed_instruments

    # Upstream lifespan seeds ext_gn_ths / ext_hy_ths with a fuyao HTTP recipe
    # and fuyao_api_key auth. This deployment blocks that vendor, so install a
    # local-board replacement before main imports the preset initializer.
    from overrides.local_extensions import install_local_presets
    install_local_presets()

    socket._tsp_app_policy_installed = True
