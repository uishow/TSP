"""Publish local membership snapshots through TSP's existing extension contract.

The pinned upstream image ships two built-in extension tables (ext_gn_ths /
ext_hy_ths) whose factory pull recipe points at fuyao.aicubes.cn and requires
fuyao_api_key. This deployment blocks all vendor egress, so those tables could
never hold data and every refresh produced "已配置鉴权但未找到凭据 fuyao_api_key".
We keep their upstream field/schema contract (so monitor columns, screener
filters and strategy ext fields keep working) but replace the recipe and the
content with the local board snapshot. Upstream source files are untouched.
"""
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
import hashlib
import json
import logging

log = logging.getLogger(__name__)

FIELDS = {
    'concept': '所属概念', 'industry': '所属行业', 'region': '所属地区',
    'style': '所属风格', 'index_membership': '指数归属',
    'tdx_industry': '通达信行业', 'tdx_concept': '通达信概念',
    'custom_membership': '自定义归属',
}
KEYS = {'concept': 'local_concepts', 'industry': 'local_industries',
        **{k: 'local_' + k for k in FIELDS if k not in ('concept', 'industry')}}
LABELS = {
    'concept': '本地概念', 'industry': '本地申万行业', 'region': '通达信地区',
    'style': '通达信风格', 'index_membership': '通达信指数成分',
    'tdx_industry': '通达信行业', 'tdx_concept': '通达信概念',
    'custom_membership': '通达信自定义',
}

# Built-in presets: preserve the exact upstream column NAMES (referenced by
# monitor_ext_fields / strategy ext columns) while correcting the displayed
# labels so nobody mistakes a local taxonomy for an official THS classification.
BUILTIN_BOARDS = {
    'ext_gn_ths': {
        'label': '扩展概念',
        'primary': 'concept',
        'fallback': 'tdx_concept',
        'value_field': '所属概念',
        'value_label': '本地概念归属(非同花顺)',
        'description': (
            '本地板块归属快照：free_stockdb 概念分类（同花顺体系）为主；'
            '通达信概念分类保留在独立表 local_tdx_concept，不混入本表，'
            '避免概念页按 "/" 前缀聚合出伪大类。数据来自本机只读 boards 源，'
            '非同花顺官方分类，无网络拉取、无鉴权凭据。仅有当期成分归属，'
            '不提供历史成分变更，PIT 成分数据未验证。'
        ),
    },
    'ext_hy_ths': {
        'label': '扩展行业',
        'primary': 'industry',
        'fallback': 'tdx_industry',
        'value_field': '所属同花顺行业',
        'value_label': '本地行业归属(非同花顺)',
        'description': (
            '本地板块归属快照：申万行业分类（申万一级/二级/三级）为主；'
            '通达信行业分类保留在独立表 local_tdx_industry，不混入本表，'
            '避免行业页按 "/" 前缀聚合出伪 "TDX" 大类。数据来自本机只读 boards 源，'
            '非同花顺官方分类，无网络拉取、无鉴权凭据。仅有当期成分归属，'
            '不提供历史成分变更，PIT 成分数据未验证。'
        ),
    },
}

_SEED_MARKER = '.builtin_presets_seeded'

# Official THS classifications imported offline on the host. These are NEW
# independent tables: ext_gn_ths / ext_hy_ths keep the local taxonomy so the
# existing monitor columns, screener filters and daily pipeline do not change.
# Table ids are deliberately distinct and the value fields deliberately match
# the upstream column names, so a user can opt in by repointing
# monitor_ext_fields at fuyao_ths_concept / fuyao_ths_industry.
FUYAO_BOARDS = {
    'fuyao_ths_concept': {
        'kind': 'concept', 'label': '同花顺官方概念', 'value_field': '所属概念',
        'description': (
            '同花顺官方概念分类：宿主机侧持 Key 离线导入 fuyao 板块目录 + 逐板块成分，'
            '容器零外联、无鉴权凭据、无拉取调度。当前成分快照，无历史成分版本，'
            'PIT 成分数据未验证。独立于 ext_gn_ths（本地概念），不覆盖任何内置表。'
        ),
    },
    'fuyao_ths_industry': {
        'kind': 'industry', 'label': '同花顺官方行业', 'value_field': '所属同花顺行业',
        'description': (
            '同花顺官方行业分类：宿主机侧持 Key 离线导入 fuyao 板块目录 + 逐板块成分，'
            '扁平板块无层级，容器零外联、无鉴权凭据、无拉取调度。当前成分快照，'
            '无历史成分版本，PIT 成分数据未验证。独立于 ext_hy_ths（本地申万行业）。'
        ),
    },
}


def membership_rows(boards, instruments):
    lookup = {r['symbol'].split('.')[0]: r for r in instruments}
    members = {k: defaultdict(set) for k in FIELDS}
    for board in boards:
        kind = board.get('type', 'concept')
        if kind.startswith('sw_'):
            kind = 'industry'
        if kind not in members:
            continue
        label = str(board.get('name') or board.get('code'))
        if kind == 'industry':
            label = f"{board.get('category', '行业')}/{label}"
        for code in board.get('symbols', []):
            code = str(code).split('.')[0]
            if code in lookup:
                members[kind][code].add(label)
    result = {}
    for kind, values in members.items():
        field = FIELDS[kind]
        result[kind] = [
            {'symbol': lookup[c]['symbol'], 'code': c, 'name': lookup[c].get('name'),
             field: ';'.join(sorted(tags)),
             'source': 'free_stockdb_board_snapshot' if kind in ('concept', 'industry')
                       else 'tdx_export_membership',
             'pit_verified': False}
            for c, tags in sorted(values.items())
        ]
    return result


def collect_membership_rows():
    """Read the local boards + instrument list once through the pinned provider."""
    from app.data_providers import custom
    provider = custom.get_provider('local_quant')
    boards = provider._request('boards')['rows']
    instruments = provider.get_instruments('stock')
    if not boards or not instruments:
        raise RuntimeError('本地 boards/instruments 为空；拒绝写入空板块表')
    return membership_rows(boards, instruments)


def builtin_rows(membership, config_id):
    """Publish only the primary local taxonomy into a built-in table.

    The Tongdaxin (TDX) taxonomy stays in its own local_tdx_* tables on purpose:
    mixing it into the 同花顺/申万 field made the industry/concept board pages
    aggregate a bogus top-level 'TDX' category (they split on the first '/').
    """
    spec = BUILTIN_BOARDS[config_id]
    primary = {r['symbol']: r for r in membership.get(spec['primary'], [])}
    primary_field = FIELDS[spec['primary']]
    rows = []
    for symbol in sorted(primary):
        head = primary[symbol]
        value = str(head[primary_field] or '').strip()
        if not value:
            continue
        # Deduplicate tags without re-introducing the secondary taxonomy.
        value = ';'.join(sorted({tag.strip() for tag in value.split(';') if tag.strip()}))
        if not value:
            continue
        rows.append({
            'symbol': symbol,
            'code': head['code'],
            '股票代码': head['code'],
            '股票简称': head.get('name'),
            spec['value_field']: value,
        })
    return rows


def _builtin_config(config_id, existing=None, row_count=0):
    from app.services.ext_data import ExtConfig, ExtField, PullConfig
    spec = BUILTIN_BOARDS[config_id]
    fields = [
        ExtField('symbol', 'string', '标的代码'),
        ExtField('code', 'string', '代码'),
        ExtField('股票代码', 'string', '股票代码'),
        ExtField('股票简称', 'string', '股票简称'),
        ExtField(spec['value_field'], 'string', spec['value_label']),
    ]
    # Credential-free, URL-free, fanout-free and disabled: the pull scheduler
    # skips it entirely, so no fuyao_api_key lookup can ever be attempted.
    pull = PullConfig(url='', enabled=False, last_rows=row_count or None)
    return ExtConfig(
        id=config_id, label=spec['label'], mode='snapshot', fields=fields,
        description=spec['description'],
        symbol_map=(existing.symbol_map if existing else None) or {'type': 'mapped', 'col': '股票代码'},
        code_map=(existing.code_map if existing else None) or {
            'type': 'computed', 'from': 'symbol', 'method': 'strip_exchange'},
        created_at=existing.created_at if existing else None,
        updated_at=existing.updated_at if existing else None,
        pull=pull,
    )


def _config_is_local(cfg, config_id):
    if cfg is None or cfg.mode != 'snapshot':
        return False
    pull = cfg.pull
    if pull is None or pull.enabled or pull.url or pull.auth or pull.fanout:
        return False
    if pull.last_status or pull.last_message:
        return False
    names = [f.name for f in cfg.fields]
    return names == ['symbol', 'code', '股票代码', '股票简称',
                     BUILTIN_BOARDS[config_id]['value_field']]


def normalize_builtin_configs(store):
    """Erase every trace of the fuyao recipe from the two built-in tables."""
    changed = []
    for config_id in BUILTIN_BOARDS:
        existing = store.get(config_id)
        if _config_is_local(existing, config_id):
            continue
        store.upsert(_builtin_config(config_id, existing))
        changed.append(config_id)
    return changed


def publish_builtin_boards(membership, store, data_dir):
    """Write real rows into ext_gn_ths / ext_hy_ths part.parquet."""
    import polars as pl
    from app.services.ext_data import write_ext_parquet

    counts = {}
    for config_id in BUILTIN_BOARDS:
        rows = builtin_rows(membership, config_id)
        if not rows:
            raise RuntimeError(f'{config_id} 本地板块行数为 0；拒绝写入空表')
        cfg = _builtin_config(config_id, store.get(config_id), len(rows))
        # A snapshot must be an exact replacement, not a union with stale
        # symbols. Drop the previous generated file before the upstream writer.
        out = Path(data_dir) / 'ext_data' / config_id / 'part.parquet'
        if out.exists():
            out.unlink()
        written = write_ext_parquet(pl.DataFrame(rows), cfg, Path(data_dir))
        store.upsert(_builtin_config(config_id, store.get(config_id), written))
        counts[config_id] = written
    return counts


def official_rows(membership, config_id, imported_at=None):
    """One row per symbol; keep the upstream column name for opt-in switching.

    Board pages split the value on '/' and ';' to aggregate categories. The
    importer already sanitises names, but enforce it again here so a stale or
    hand-edited import can never recreate the bogus 'TDX'-style top category.
    """
    spec = FUYAO_BOARDS[config_id]
    grouped = defaultdict(set)
    names = {}
    for record in membership:
        symbol = str(record.get('symbol') or '').strip()
        board = str(record.get('board_name') or '').strip()
        if not symbol or not board:
            continue
        grouped[symbol].add(board.replace('/', '／').replace(';', '；'))
        if record.get('name'):
            names[symbol] = str(record['name'])
    code_of = lambda s: s.split('.')[0]  # noqa: E731
    return [{
        'symbol': symbol,
        'code': code_of(symbol),
        '股票代码': code_of(symbol),
        '股票简称': names.get(symbol, ''),
        spec['value_field']: ';'.join(sorted(grouped[symbol])),
        '板块数': len(grouped[symbol]),
        'source': 'fuyao_offline_import:ths_index_constituents',
        'imported_at': imported_at or '',
        'pit_verified': False,
    } for symbol in sorted(grouped)]


def _official_config(config_id, row_count=0):
    from app.services.ext_data import ExtConfig, ExtField, PullConfig
    spec = FUYAO_BOARDS[config_id]
    fields = [
        ExtField('symbol', 'string', '标的代码'),
        ExtField('code', 'string', '代码'),
        ExtField('股票代码', 'string', '股票代码'),
        ExtField('股票简称', 'string', '股票简称'),
        ExtField(spec['value_field'], 'string', spec['label']),
        ExtField('板块数', 'int', '所属板块数'),
        ExtField('source', 'string', '来源'),
        ExtField('imported_at', 'string', '离线导入时间'),
        ExtField('pit_verified', 'bool', '历史归属已验证'),
    ]
    # Credential-free and disabled: the container never pulls these tables.
    pull = PullConfig(url='', enabled=False, last_rows=row_count or None)
    return ExtConfig(
        id=config_id, label=spec['label'], mode='snapshot', fields=fields,
        description=spec['description'],
        symbol_map={'type': 'mapped', 'col': '股票代码'},
        code_map={'type': 'computed', 'from': 'symbol', 'method': 'strip_exchange'},
        pull=pull,
    )


def publish_official_boards(store, data_dir):
    """Publish host-side official THS tables as NEW ext_data ids.

    Returns {} when the offline import is absent or incomplete: never publish a
    partial classification and never touch ext_gn_ths / ext_hy_ths.
    """
    import polars as pl

    root = Path(data_dir) / 'fuyao'
    if not (root / 'manifest.json').is_file():
        return {}
    try:
        manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
    except Exception as exc:  # noqa: BLE001 — unreadable import => publish nothing
        log.warning('FUYAO_OFFLINE: manifest unreadable, skipping publish: %s', exc)
        return {}
    if not (manifest.get('boards') or {}).get('complete'):
        log.warning('FUYAO_OFFLINE: board import incomplete, skipping publish')
        return {}
    from app.services.ext_data import write_ext_parquet
    counts = {}
    for config_id, spec in FUYAO_BOARDS.items():
        path = root / f"ths_{spec['kind']}_membership.parquet"
        if not path.is_file():
            continue
        rows = official_rows(pl.read_parquet(path).to_dicts(), config_id,
                             manifest.get('imported_at'))
        if not rows:
            raise RuntimeError(f'{config_id} 官方分类行数为 0；拒绝写入空表')
        cfg = _official_config(config_id, len(rows))
        store.upsert(cfg)
        out = Path(data_dir) / 'ext_data' / config_id / 'part.parquet'
        if out.exists():
            out.unlink()  # snapshot is an exact replacement, not a union
        counts[config_id] = write_ext_parquet(pl.DataFrame(rows), cfg, Path(data_dir))
    if counts:
        log.warning('FUYAO_OFFLINE: official classifications published %s', counts)
    return counts


def sync_boards():
    """Refresh all local membership tables (called by the daily pipeline hook)."""
    import polars as pl
    from app.config import settings
    from app.services.ext_data import ExtConfig, ExtConfigStore, ExtField, write_ext_parquet
    from app.services import preferences

    membership = collect_membership_rows()
    store = ExtConfigStore(settings.data_dir)
    today = datetime.now(ZoneInfo('Asia/Shanghai')).date()
    counts = {}
    for kind, data in membership.items():
        key = KEYS[kind]
        field = FIELDS[kind]
        cfg = ExtConfig(
            id=key, label=LABELS[kind], mode='timeseries',
            fields=[ExtField('symbol', 'string', '标的'), ExtField('code', 'string', '代码'),
                    ExtField('name', 'string', '名称'), ExtField(field, 'string', field),
                    ExtField('source', 'string', '来源'), ExtField('pit_verified', 'bool', '历史归属已验证')],
            description=LABELS[kind] + '当前文件/数据库映射；按采集日保留版本，无历史成分归属证明，不作为PIT成分数据。',
            symbol_map={'type': 'mapped', 'col': 'symbol'},
        )
        store.upsert(cfg)
        if data:
            frame = pl.DataFrame(data)
            # Every collected content revision also has an immutable evidence copy.
            raw = json.dumps(data, ensure_ascii=False, sort_keys=True).encode()
            digest = hashlib.sha256(raw).hexdigest()
            evidence = settings.data_dir / 'local_source_evidence' / key / today.isoformat() / f'{digest}.json'
            if not evidence.parent.is_dir():
                evidence.parent.mkdir(parents=True)
            if not evidence.exists():
                evidence.write_bytes(raw)
            counts[key] = write_ext_parquet(frame, cfg, settings.data_dir, snapshot_date=today)

    builtin = publish_builtin_boards(membership, store, settings.data_dir)
    counts.update(builtin)
    # Monitor/alert columns must follow the SAME taxonomy the board pages use.
    # Hard-coding the built-in ids here silently undid a user's switch on every
    # daily pipeline run, so resolve from the taxonomy installed at startup.
    from overrides.board_taxonomy import active_taxonomy, monitor_ext_fields
    preferences.save({'monitor_ext_fields': monitor_ext_fields(active_taxonomy())})
    # Official THS tables are independent: a failed/incomplete host import must
    # never break the local taxonomy refresh.
    try:
        official = publish_official_boards(store, settings.data_dir)
    except Exception as exc:  # noqa: BLE001 — startup/daily pipeline must survive
        official = {}
        log.warning('FUYAO_OFFLINE: official board publish failed: %s', exc)
    return {'boards': len(membership), 'published': counts,
            'builtin_boards': builtin, 'official_boards': official,
            'membership_pit_verified': False}


def _builtin_tables_empty(data_dir):
    for config_id in BUILTIN_BOARDS:
        path = Path(data_dir) / 'ext_data' / config_id / 'part.parquet'
        if not path.exists():
            return True
        try:
            import polars as pl
            if pl.read_parquet(path).height == 0:
                return True
        except Exception:
            return True
    return False


async def _local_ensure_builtin_presets(data_dir):
    """Startup replacement for upstream ensure_builtin_presets (no vendor recipe)."""
    from app.services.ext_data import ExtConfigStore

    store = ExtConfigStore(data_dir)
    marker = Path(data_dir) / 'ext_data' / _SEED_MARKER
    if not marker.parent.is_dir():
        marker.parent.mkdir(parents=True)
    if not marker.exists():
        marker.write_text('')
    changed = normalize_builtin_configs(store)
    if changed:
        log.warning('LOCAL_PRESETS: fuyao recipe removed from %s', ','.join(changed))
    if _builtin_tables_empty(data_dir):
        try:
            result = sync_boards()
            log.warning('LOCAL_PRESETS: built-in boards published %s', result['builtin_boards'])
        except Exception as exc:  # startup must never be blocked by a source read
            log.warning('LOCAL_PRESETS: board publish failed (daily pipeline will retry): %s', exc)


def install_local_presets():
    """Patch before app.main.lifespan imports ensure_builtin_presets."""
    from app.services import ext_presets
    if getattr(ext_presets, '_tsp_local_presets_installed', False):
        return
    ext_presets.ensure_builtin_presets = _local_ensure_builtin_presets
    ext_presets._tsp_local_presets_installed = True
    log.warning('LOCAL_PRESETS_ACTIVE: fuyao concept/industry factory recipes disabled')
