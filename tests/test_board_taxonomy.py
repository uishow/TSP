"""Board taxonomy switch: one whitelist per dimension, no upstream edits."""
import json
import sys
from types import ModuleType, SimpleNamespace

from overrides import board_taxonomy as bt


class _Field:
    def __init__(self, name, label=''):
        self.name = name
        self.label = label


def _config(config_id, *fields):
    return SimpleNamespace(id=config_id, fields=[_Field(f) for f in fields])


def _original(config, kind):
    """Mirror upstream fuzzy matching, enough to test the whitelist."""
    candidates = ['概念', 'concept', 'theme'] if kind == 'concept' else ['行业', 'industry', 'sector']
    for needle in candidates:
        for field in config.fields:
            if needle in f'{field.name} {field.label}'.lower():
                return field.name
    return None


def test_official_whitelist_rejects_every_local_table():
    fn = bt.dimension_field_for('official', _original)
    assert fn(_config('fuyao_ths_concept', '所属概念'), 'concept') == '所属概念'
    assert fn(_config('fuyao_ths_industry', '所属同花顺行业'), 'industry') == '所属同花顺行业'
    for cid, field, kind in [
        ('ext_gn_ths', '所属概念', 'concept'),
        ('local_concepts', '所属概念', 'concept'),
        ('local_tdx_concept', '通达信概念', 'concept'),
        ('ext_hy_ths', '所属同花顺行业', 'industry'),
        ('local_industries', '所属行业', 'industry'),
        ('local_tdx_industry', '通达信行业', 'industry'),
    ]:
        assert fn(_config(cid, field), kind) is None
    # ids must not leak across dimensions
    assert fn(_config('fuyao_ths_concept', '所属概念'), 'industry') is None
    assert fn(_config('fuyao_ths_industry', '所属同花顺行业'), 'concept') is None


def test_local_whitelist_excludes_official_tables():
    fn = bt.dimension_field_for('local', _original)
    assert fn(_config('ext_gn_ths', '所属概念'), 'concept') == '所属概念'
    assert fn(_config('ext_hy_ths', '所属同花顺行业'), 'industry') == '所属同花顺行业'
    assert fn(_config('local_tdx_industry', '通达信行业'), 'industry') == '通达信行业'
    assert fn(_config('fuyao_ths_concept', '所属概念'), 'concept') is None
    assert fn(_config('fuyao_ths_industry', '所属同花顺行业'), 'industry') is None


def test_monitor_fields_follow_taxonomy_without_template_mutation():
    assert bt.monitor_ext_fields('official')['concept']['field'] == 'fuyao_ths_concept.所属概念'
    assert bt.monitor_ext_fields('official')['industry']['field'] == 'fuyao_ths_industry.所属同花顺行业'
    assert bt.monitor_ext_fields('local')['concept']['field'] == 'ext_gn_ths.所属概念'
    assert bt.monitor_ext_fields('unknown') == bt.monitor_ext_fields('local')
    payload = bt.monitor_ext_fields('official')
    payload['concept']['field'] = 'tampered'
    assert bt.monitor_ext_fields('official')['concept']['field'] == 'fuyao_ths_concept.所属概念'


def test_resolve_taxonomy_falls_back_when_official_import_missing(monkeypatch, tmp_path):
    monkeypatch.delenv(bt.TAXONOMY_ENV, raising=False)
    assert bt.resolve_taxonomy(tmp_path) == 'local'


def test_resolve_taxonomy_incomplete_manifest_falls_back(monkeypatch, tmp_path):
    monkeypatch.delenv(bt.TAXONOMY_ENV, raising=False)
    (tmp_path / 'fuyao').mkdir()
    (tmp_path / 'fuyao' / 'manifest.json').write_text(
        json.dumps({'boards': {'complete': False}}), encoding='utf-8')
    assert bt.resolve_taxonomy(tmp_path) == 'local'


def test_resolve_taxonomy_explicit_local_skips_readiness(monkeypatch, tmp_path):
    monkeypatch.setenv(bt.TAXONOMY_ENV, 'local')
    assert bt.resolve_taxonomy(tmp_path) == 'local'
    monkeypatch.setenv(bt.TAXONOMY_ENV, 'bogus')
    # unknown -> default official -> incomplete import -> safe local
    assert bt.resolve_taxonomy(tmp_path) == 'local'


def test_official_tables_ready_requires_complete_manifest_and_nonempty_parquet(tmp_path):
    import polars as pl
    (tmp_path / 'fuyao').mkdir()
    (tmp_path / 'fuyao' / 'manifest.json').write_text(
        json.dumps({'boards': {'complete': True}}), encoding='utf-8')
    for cid in bt.OFFICIAL_IDS.values():
        d = tmp_path / 'ext_data' / cid
        d.mkdir(parents=True)
        pl.DataFrame({'symbol': ['600031.SH'], 'x': [1]}).write_parquet(d / 'part.parquet')
    assert bt.official_tables_ready(tmp_path) is True
    empty = tmp_path / 'ext_data' / bt.OFFICIAL_IDS['concept'] / 'part.parquet'
    pl.DataFrame({'symbol': [], 'x': []}).write_parquet(empty)
    assert bt.official_tables_ready(tmp_path) is False


def test_install_patches_both_bindings_writes_preferences_and_clears_caches(monkeypatch):
    app_pkg = ModuleType('app')
    app_pkg.__path__ = []
    svc_pkg = ModuleType('app.services')
    svc_pkg.__path__ = []
    mob = ModuleType('app.services.market_overview_builder')
    mob._dimension_field = _original
    rr = ModuleType('app.services.rps_rotation')
    rr._dimension_field = _original
    rr._map_cache = {'concept': ('df', 3)}
    rr._map_ts = {'concept': 1.0}
    rr._cache = {'key': {}}
    rr._cache_ts = {'key': 1.0}
    rr._cache_days = {'key': 7}
    prefs = ModuleType('app.services.preferences')
    saved = []
    prefs.save = lambda payload: saved.append(payload)
    svc_pkg.market_overview_builder = mob
    svc_pkg.rps_rotation = rr
    svc_pkg.preferences = prefs
    app_pkg.services = svc_pkg
    for name, mod in [
        ('app', app_pkg), ('app.services', svc_pkg),
        ('app.services.market_overview_builder', mob),
        ('app.services.rps_rotation', rr),
        ('app.services.preferences', prefs),
    ]:
        monkeypatch.setitem(sys.modules, name, mod)
    monkeypatch.setattr(bt, '_ACTIVE_TAXONOMY', None)

    selected = bt.install_board_taxonomy(taxonomy='official')
    assert selected == 'official'
    assert mob._dimension_field is rr._dimension_field
    assert mob._dimension_field(_config('fuyao_ths_concept', '所属概念'), 'concept') == '所属概念'
    assert mob._dimension_field(_config('ext_gn_ths', '所属概念'), 'concept') is None
    assert rr._map_cache == {} and rr._cache == {} and rr._cache_ts == {}
    assert saved[0]['monitor_ext_fields']['concept']['field'] == 'fuyao_ths_concept.所属概念'
    assert bt.active_taxonomy() == 'official'
    # idempotent: a second install must not wrap the whitelist again
    bt.install_board_taxonomy(taxonomy='official')
    assert mob._dimension_field(_config('fuyao_ths_concept', '所属概念'), 'concept') == '所属概念'


def test_sync_boards_uses_active_taxonomy(monkeypatch, tmp_path):
    """The daily pipeline must not hard-code the local ids back in."""
    from overrides import local_extensions as le
    from types import SimpleNamespace as NS

    calls = []
    pref_mod = ModuleType('app.services.preferences')
    pref_mod.save = lambda payload: calls.append(payload)
    ext_mod = ModuleType('app.services.ext_data')
    ext_mod.ExtConfigStore = lambda d: object()
    ext_mod.ExtConfig = object
    ext_mod.ExtField = lambda *a, **k: None
    ext_mod.write_ext_parquet = lambda *a, **k: 1
    cfg_mod = ModuleType('app.config')
    cfg_mod.settings = NS(data_dir=tmp_path)
    app_pkg = ModuleType('app')
    app_pkg.__path__ = []
    svc_pkg = ModuleType('app.services')
    svc_pkg.__path__ = []
    svc_pkg.preferences = pref_mod
    svc_pkg.ext_data = ext_mod
    app_pkg.services = svc_pkg
    app_pkg.config = cfg_mod
    for name, mod in [
        ('app', app_pkg), ('app.services', svc_pkg), ('app.config', cfg_mod),
        ('app.services.preferences', pref_mod), ('app.services.ext_data', ext_mod),
    ]:
        monkeypatch.setitem(sys.modules, name, mod)
    monkeypatch.setattr(le, 'collect_membership_rows', lambda: {})
    monkeypatch.setattr(le, 'publish_builtin_boards', lambda *a: {})
    monkeypatch.setattr(le, 'publish_official_boards', lambda *a: {})
    monkeypatch.setattr(bt, '_ACTIVE_TAXONOMY', 'official')
    le.sync_boards()
    assert calls[0]['monitor_ext_fields']['concept']['field'] == 'fuyao_ths_concept.所属概念'


def test_membership_note_patch_states_history_was_not_recomputed(monkeypatch):
    mainline = ModuleType('app.services.market_mainline')
    mainline.MEMBERSHIP_NOTE = 'upstream default'
    monkeypatch.setitem(sys.modules, 'app.services.market_mainline', mainline)
    note = bt.install_membership_note('official')
    assert note == bt.MEMBERSHIP_NOTES['official']
    assert mainline.MEMBERSHIP_NOTE == note
    assert '未回补' in note and '不可直接比较' in note
    assert '同花顺官方分类当前快照回看历史' not in note
    assert bt.install_membership_note('local') == bt.MEMBERSHIP_NOTES['local']
    assert mainline.MEMBERSHIP_NOTE == bt.MEMBERSHIP_NOTES['local']


def test_membership_note_patch_failure_does_not_block_startup(monkeypatch):
    import builtins
    monkeypatch.delitem(sys.modules, 'app.services.market_mainline', raising=False)

    def broken_import(*args, **kwargs):
        raise ImportError('simulated startup failure')

    monkeypatch.setattr(builtins, '__import__', broken_import)
    assert bt.install_membership_note('official') is None


def test_post_import_bindings_patch_overview_and_clear_caches(monkeypatch):
    mob = ModuleType('app.services.market_overview_builder')
    mob._dimension_field = _original
    rr = ModuleType('app.services.rps_rotation')
    rr._dimension_field = _original
    rr._map_cache = {'stale': 1}
    overview = ModuleType('app.api.overview')
    overview._dimension_field = _original  # independent fuzzy matcher
    cleared = []
    overview.invalidate_overview_cache = lambda: cleared.append(True)
    for name, module in [
        ('app.services.market_overview_builder', mob),
        ('app.services.rps_rotation', rr),
        ('app.api.overview', overview),
    ]:
        monkeypatch.setitem(sys.modules, name, module)
    monkeypatch.setattr(bt, '_ACTIVE_TAXONOMY', 'official')

    patched = bt.install_board_taxonomy_bindings()
    assert 'app.api.overview' in patched
    resolver = overview._dimension_field
    assert resolver(_config('fuyao_ths_concept', '所属概念'), 'concept') == '所属概念'
    assert resolver(_config('fuyao_ths_industry', '所属同花顺行业'), 'industry') == '所属同花顺行业'
    for cid, field, kind in [
        ('ext_gn_ths', '所属概念', 'concept'),
        ('local_concepts', '所属概念', 'concept'),
        ('local_tdx_concept', '通达信概念', 'concept'),
        ('ext_hy_ths', '所属同花顺行业', 'industry'),
        ('local_tdx_industry', '通达信行业', 'industry'),
    ]:
        assert resolver(_config(cid, field), kind) is None
    assert cleared == [True]
    assert rr._map_cache == {}
    assert bt.install_board_taxonomy_bindings() == []  # idempotent


def test_post_import_bindings_follow_local_taxonomy(monkeypatch):
    overview = ModuleType('app.api.overview')
    overview._dimension_field = _original
    monkeypatch.setitem(sys.modules, 'app.api.overview', overview)
    monkeypatch.setattr(bt, '_ACTIVE_TAXONOMY', 'local')
    bt.install_board_taxonomy_bindings()
    assert overview._dimension_field(_config('ext_gn_ths', '所属概念'), 'concept') == '所属概念'
    assert overview._dimension_field(_config('fuyao_ths_concept', '所属概念'), 'concept') is None
