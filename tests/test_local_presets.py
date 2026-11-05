"""Regression: built-in concept/industry tables must never fall back to fuyao."""
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'upstream'))

from app.services.ext_data import ExtConfig, ExtConfigStore, ExtField, PullConfig
from overrides import local_extensions as le


def _fuyao_config(config_id, value_field):
    return ExtConfig(
        id=config_id, label='扩展概念', mode='snapshot',
        fields=[ExtField('symbol', 'string', '标的代码'),
                ExtField('code', 'string', '代码'),
                ExtField('股票代码', 'string', '股票代码'),
                ExtField('股票简称', 'string', '股票简称'),
                ExtField(value_field, 'string', value_field)],
        description='同花顺概念分类 (fuyao 同花顺指数接口)',
        pull=PullConfig(
            url='https://fuyao.aicubes.cn/api/a-share-index/catalog/ths-index-list?tag=cn_concept',
            enabled=False,
            auth={'type': 'header', 'header': 'X-api-key', 'key_ref': 'fuyao_api_key'},
            fanout={'url': 'https://fuyao.aicubes.cn/api/a-share-index/constituents/ths-stock-list'},
            last_status='error',
            last_message='已配置鉴权但未找到凭据 fuyao_api_key — 请在 设置 → 数据源 配置对应 API Key',
        ),
    )


def _seed_fuyao(store):
    for config_id, spec in le.BUILTIN_BOARDS.items():
        store.upsert(_fuyao_config(config_id, spec['value_field']))


def test_builtin_config_is_credential_free_and_keeps_upstream_field_names():
    for config_id, spec in le.BUILTIN_BOARDS.items():
        cfg = le._builtin_config(config_id, row_count=123)
        assert [f.name for f in cfg.fields][-1] == spec['value_field']
        assert cfg.mode == 'snapshot'
        assert cfg.pull.url == '' and cfg.pull.auth is None and cfg.pull.fanout is None
        assert cfg.pull.enabled is False
        assert cfg.pull.last_status is None and cfg.pull.last_message is None
        assert cfg.pull.last_rows == 123
        assert 'fuyao' not in json.dumps(cfg.to_dict(), ensure_ascii=False)
        assert le._config_is_local(cfg, config_id)


def test_normalize_builtin_configs_erases_vendor_recipe_and_error(tmp_path):
    store = ExtConfigStore(tmp_path)
    _seed_fuyao(store)
    assert set(le.normalize_builtin_configs(store)) == set(le.BUILTIN_BOARDS)
    for config_id in le.BUILTIN_BOARDS:
        raw = json.dumps(store.get(config_id).to_dict(), ensure_ascii=False)
        assert 'fuyao' not in raw
        assert 'fuyao_api_key' not in raw
        assert '已配置鉴权' not in raw
    assert le.normalize_builtin_configs(store) == []


def test_startup_hook_never_resurrects_fuyao_and_publishes_empty_tables(tmp_path, monkeypatch):
    _seed_fuyao(ExtConfigStore(tmp_path))
    calls = []
    monkeypatch.setattr(
        le, 'sync_boards',
        lambda: calls.append(True) or {'builtin_boards': {'ext_gn_ths': 1, 'ext_hy_ths': 1}},
    )
    asyncio.run(le._local_ensure_builtin_presets(tmp_path))
    assert calls == [True]
    assert (tmp_path / 'ext_data' / '.builtin_presets_seeded').exists()
    store = ExtConfigStore(tmp_path)
    for config_id in le.BUILTIN_BOARDS:
        assert le._config_is_local(store.get(config_id), config_id)


def test_startup_hook_skips_republish_when_builtin_tables_have_rows(tmp_path, monkeypatch):
    import polars as pl
    _seed_fuyao(ExtConfigStore(tmp_path))
    for config_id in le.BUILTIN_BOARDS:
        target = tmp_path / 'ext_data' / config_id
        if not target.is_dir():
            target.mkdir(parents=True)
        pl.DataFrame({'symbol': ['600031.SH']}).write_parquet(target / 'part.parquet')
    monkeypatch.setattr(le, 'sync_boards', lambda: (_ for _ in ()).throw(AssertionError('should not publish')))
    asyncio.run(le._local_ensure_builtin_presets(tmp_path))
    assert not le._builtin_tables_empty(tmp_path)


def test_install_local_presets_replaces_factory_initializer(monkeypatch):
    from app.services import ext_presets
    monkeypatch.setattr(ext_presets, 'ensure_builtin_presets', lambda data_dir: None, raising=False)
    monkeypatch.delattr(ext_presets, '_tsp_local_presets_installed', raising=False)
    le.install_local_presets()
    assert ext_presets.ensure_builtin_presets is le._local_ensure_builtin_presets
    le.install_local_presets()  # idempotent
    assert ext_presets._tsp_local_presets_installed is True
