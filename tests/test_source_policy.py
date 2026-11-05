import errno
import socket
from types import SimpleNamespace

import pytest

from overrides.source_policy import NetworkPolicy, SourcePolicyError, validate_preferences, matrix_from_sources


def policy():
    return NetworkPolicy('host.docker.internal', 7818, {'192.168.65.254'})


@pytest.mark.parametrize('address', [('127.0.0.1', 3018), ('::1', 3018), ('localhost', 3018), ('host.docker.internal', 7818), ('192.168.65.254', 7818), '/tmp/ipc.sock'])
def test_local_and_exact_bridge_allowed(address):
    policy().check_address(address)


@pytest.mark.parametrize('address', [('free-api.tickflow.org', 443), ('api.tickflow.org', 443), ('fuyao.aicubes.cn', 443), ('8.8.8.8', 443), ('192.168.65.254', 443), ('host.docker.internal', 80), ('127.0.0.1.evil.test', 3018)])
def test_all_other_egress_denied(address):
    with pytest.raises(SourcePolicyError):
        policy().check_address(address)


def test_dns_never_resolves_disallowed_host():
    calls = []
    def resolve(host, port, *args, **kwargs):
        calls.append(host)
        return []
    p = policy()
    with pytest.raises(SourcePolicyError):
        p.resolve(resolve, 'free-api.tickflow.org', 443)
    assert calls == []
    p.resolve(resolve, 'localhost', 3018)
    assert calls == ['localhost']


def test_provider_updates_cannot_bypass_policy():
    for field in ('daily_data_provider', 'realtime_data_provider', 'financial_data_provider'):
        with pytest.raises(SourcePolicyError):
            validate_preferences({field: 'tickflow'})
    validate_preferences({'daily_data_provider': 'local_quant', 'theme': 'dark'})


def test_matrix_removes_vendor_candidates_and_unverified_datasets():
    spec = [{'id': 'daily', 'label': '日K', 'field': 'daily_data_provider'}, {'id': 'financial', 'label': '财务', 'field': 'financial_data_provider'}]
    sources = [{'name': 'tickflow', 'datasets': {'daily', 'financial'}, 'available': True}, {'name': 'local_quant', 'display': '本地', 'datasets': {'daily'}, 'available': True, 'kind': 'plugin', 'status': 'ok'}]
    result = matrix_from_sources(spec, sources)
    assert result['tickflow_tier'] == 'disabled'
    daily, financial = result['capabilities']
    assert daily['usable'] is True
    assert daily['tf_available'] is False
    assert [x['name'] for x in daily['candidates']] == ['local_quant']
    assert financial['usable'] is False
    assert financial['candidates'] == []


def test_missing_bridge_provider_is_unavailable():
    item = matrix_from_sources([{'id': 'daily', 'label': '日K', 'field': 'daily_data_provider'}], [])['capabilities'][0]
    assert not item['usable']
    assert item['effective'] == 'local_quant'


def test_installed_guard_stops_direct_dns_tcp_and_udp(monkeypatch):
    import overrides.source_policy as module
    calls = []
    def resolve(host, port, *a, **kw):
        calls.append(host)
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('192.168.65.254', port))]
    monkeypatch.setattr(socket, 'getaddrinfo', resolve)
    monkeypatch.setattr(socket.socket, 'connect', lambda sock, address: calls.append(address))
    monkeypatch.setattr(socket.socket, 'connect_ex', lambda sock, address: 0)
    monkeypatch.setattr(socket.socket, 'sendto', lambda sock, data, *args: len(data))
    monkeypatch.setattr(socket, '_tsp_source_policy_installed', False, raising=False)
    monkeypatch.setenv('HTTPS_PROXY', 'http://evil.test:8080')
    module.install_network_guard()
    module.install_network_guard()  # idempotent
    import os
    assert 'HTTPS_PROXY' not in os.environ
    with socket.socket() as sock:
        with pytest.raises(SourcePolicyError): sock.connect(('8.8.8.8', 443))
        assert sock.connect_ex(('8.8.8.8', 443)) == errno.EACCES
        assert sock.connect_ex(('192.168.65.254', 7818)) == 0
        sock.connect(('127.0.0.1', 3018))
        assert sock.sendto(b'query', ('192.168.65.254', 7818)) == 5
        with pytest.raises(SourcePolicyError): sock.sendto(b'query', ('8.8.8.8', 53))
    with pytest.raises(SourcePolicyError): socket.getaddrinfo('api.tickflow.org', 443)
    socket.getaddrinfo('host.docker.internal', 7818)
    assert 'api.tickflow.org' not in calls


def test_guard_installs_even_when_bridge_dns_unavailable(monkeypatch):
    import overrides.source_policy as module
    def unavailable(*a, **kw): raise socket.gaierror('offline')
    monkeypatch.setattr(socket, 'getaddrinfo', unavailable)
    monkeypatch.setattr(socket.socket, 'connect', socket.socket.connect)
    monkeypatch.setattr(socket.socket, 'connect_ex', socket.socket.connect_ex)
    monkeypatch.setattr(socket.socket, 'sendto', socket.socket.sendto)
    monkeypatch.setattr(socket, '_tsp_source_policy_installed', False, raising=False)
    module.install_network_guard()
    with pytest.raises(SourcePolicyError): socket.getaddrinfo('free-api.tickflow.org', 443)


def test_matrix_retains_unavailable_local_source_reason():
    result = matrix_from_sources([{'id': 'daily', 'field': 'daily_data_provider'}], [{'name': 'local_quant', 'datasets': ['daily'], 'available': False, 'status': 'bridge disconnected'}])
    row = result['capabilities'][0]
    assert not row['usable']
    assert row['pending'][0]['status'] == 'bridge disconnected'


def test_app_policy_keeps_vendor_fallback_closed_and_routes_instruments(monkeypatch):
    import sys
    import types
    import overrides.source_policy as module
    def package(name):
        obj = types.ModuleType(name)
        monkeypatch.setitem(sys.modules, name, obj)
        return obj
    app = package('app')
    dp = package('app.data_providers')
    base = package('app.data_providers.base')
    class ProviderError(RuntimeError): pass
    base.ProviderRequestError = ProviderError
    services = package('app.services')
    prefs = package('app.services.preferences')
    prefs.save = lambda updates: updates
    services.preferences = prefs
    tf = package('app.tickflow')
    client = package('app.tickflow.client')
    p = package('app.tickflow.policy')
    c = package('app.tickflow.capabilities')
    class CapSet:
        pass
    c.CapabilitySet = CapSet
    p._augment_custom_sources = lambda capset: setattr(capset, 'local', True)
    tf.client, tf.policy = client, p
    caps = package('app.data_providers.capabilities')
    caps.CAPABILITY_REGISTRY = [{'id': 'daily', 'label': '日K', 'field': 'daily_data_provider'}]
    caps._declared_sources = lambda: [{'name': 'local_quant', 'datasets': ['daily'], 'available': True}]
    custom = package('app.data_providers.custom')
    custom.loader = custom
    dp.capabilities, dp.custom = caps, custom
    inst = package('app.services.instrument_sync')
    idx = package('app.services.index_sync')
    builtin_presets = package('app.services.ext_presets')
    builtin_presets.ensure_builtin_presets = lambda data_dir: None
    services.instrument_sync, services.index_sync = inst, idx
    services.ext_presets = builtin_presets
    inst._flatten_instruments = lambda rows, current_limits: rows
    rows = [{'symbol': '600031.SH', 'name': '三一重工', 'source': 'free_stockdb'}]
    provider = SimpleNamespace(get_instruments=lambda kind: rows)
    custom.get_provider = lambda name: provider
    custom._register_one_plugin = lambda manifest: manifest
    custom.probe_plugin_key = lambda name, key: (True, 'ok')
    closed = []
    custom._PROVIDERS = {'forbidden': SimpleNamespace(close=lambda: closed.append(True))}
    custom._PLUGIN_STATUS = {'forbidden': {}}
    monkeypatch.setattr(socket, '_tsp_app_policy_installed', False, raising=False)
    module.install_app_policy()
    module.install_app_policy()
    assert closed == [True]
    assert not custom._PLUGIN_STATUS
    assert custom._register_one_plugin({'name': 'fuyao'}) is None
    assert custom._register_one_plugin({'name': 'local_quant'}) == {'name': 'local_quant'}
    assert not custom.probe_plugin_key('tdxquant', 'secret')[0]
    assert custom.probe_plugin_key('local_quant', 'secret')[0]
    with pytest.raises(ProviderError): custom.get_provider('tdxquant')
    with pytest.raises(ProviderError): custom.create_provider({'url': 'https://bad.test'})
    assert prefs.get_daily_data_provider() == 'local_quant'
    assert prefs._allowed_data_providers() == {'local_quant'}
    assert prefs._validated_provider('tickflow', 'daily_data_provider') == 'local_quant'
    assert prefs.save({'theme': 'light'}) == {'theme': 'light'}
    # The settings page writes back every provider field (including upstream
    # defaults). Coerce instead of returning a 500; strict validation still
    # rejects a direct attempt to persist a vendor provider.
    assert prefs.save({'daily_data_provider': 'tickflow', 'theme': 'dark'}) == {
        'daily_data_provider': 'local_quant', 'theme': 'dark'}
    with pytest.raises(SourcePolicyError):
        validate_preferences({'daily_data_provider': 'tickflow'})
    for getter in (client.get_client, client.get_async_client):
        with pytest.raises(ProviderError): getter()
    assert client.get_paid_realtime_client() is None
    assert client.current_mode() == 'local_only'
    assert 'disabled' in client.current_endpoint()
    assert p.detect_capabilities().local
    assert isinstance(p._detect_tickflow_caps(), CapSet)
    assert p.tier_label() == 'Local only'
    assert p.base_tier_name() == 'none'
    assert p.probe_log()
    assert p.missing_caps() == p.extras_caps() == []
    assert caps.build_capability_matrix({})['capabilities'][0]['usable']
    assert caps.resolve_capability_sources()[0]['source'] == 'local_quant'
    assert inst._fetch_instruments_via_provider() == rows
    assert idx._fetch_instruments_by_type('stock', 'stock')['source'].to_list() == ['free_stockdb']
    assert builtin_presets._tsp_local_presets_installed is True
    assert builtin_presets.ensure_builtin_presets.__name__ == '_local_ensure_builtin_presets'
    provider.get_instruments = lambda kind: []
    with pytest.raises(ProviderError): inst._fetch_instruments_via_provider()
    with pytest.raises(ProviderError): idx._fetch_instruments_by_type('index', 'index')


def test_coerce_preferences_only_rewrites_provider_fields():
    from overrides.source_policy import coerce_preferences
    original = {
        'minute_data_provider': 'tickflow',
        'daily_data_provider': 'local_quant',
        'theme': 'dark',
        'realtime_quote_interval': 60,
    }
    payload, changed = coerce_preferences(original)
    assert payload['minute_data_provider'] == 'local_quant'
    assert payload['theme'] == 'dark'
    assert payload['realtime_quote_interval'] == 60
    assert changed == ['minute_data_provider']
    assert original['minute_data_provider'] == 'tickflow'
    assert coerce_preferences({'theme': 'light'})[1] == []
