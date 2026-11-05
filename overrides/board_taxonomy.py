"""Select ONE taxonomy for the concept/industry board pages.

Upstream ``market_overview_builder._dimension_field`` identifies a board
dimension by fuzzy-matching every ExtConfig field name/label against
"概念"/"行业". Once the official THS tables exist, four tables per dimension
contribute at once (built-in, local, TDX and official), so the board list is a
silent mixture. This module installs a config-id whitelist so the board pages
aggregate on exactly one taxonomy.

Design invariants:
  * No upstream source file, ext table, field name or stored data is changed.
  * The whitelist only affects board-dimension aggregation. Monitor columns,
    screener filters, strategy ext fields and the import center are untouched.
  * ``TSP_BOARD_TAXONOMY=official|local`` (default ``official``) is the switch.
  * Fail-closed: an incomplete host-side import falls back to ``local`` rather
    than showing an empty or half-published official board list.
"""
from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

log = logging.getLogger(__name__)

TAXONOMY_ENV = 'TSP_BOARD_TAXONOMY'
DEFAULT_TAXONOMY = 'official'

OFFICIAL_IDS = {'concept': 'fuyao_ths_concept', 'industry': 'fuyao_ths_industry'}
LOCAL_IDS = {
    'concept': {'ext_gn_ths', 'local_concepts', 'local_tdx_concept'},
    'industry': {'ext_hy_ths', 'local_industries', 'local_tdx_industry'},
}
TAXONOMY_IDS = {
    'official': {kind: {cid} for kind, cid in OFFICIAL_IDS.items()},
    'local': LOCAL_IDS,
}
MONITOR_FIELDS = {
    'official': {
        'concept': {'field': 'fuyao_ths_concept.所属概念'},
        'industry': {'field': 'fuyao_ths_industry.所属同花顺行业'},
    },
    'local': {
        'concept': {'field': 'ext_gn_ths.所属概念'},
        'industry': {'field': 'ext_hy_ths.所属同花顺行业'},
    },
}

# Historical mainline rows were computed with the taxonomy that was active when
# each day was recorded. They are NOT recomputed when the board whitelist
# switches, and no historical board-membership version exists to recompute them
# safely. Say so explicitly rather than claiming the whole series is official.
MEMBERSHIP_NOTES = {
    'official': (
        '历史主线按各日期生成时生效的板块分类口径累计，未回补为当前板块页的同花顺官方分类；'
        '分类口径切换前后的历史数据不可直接比较。成分无历史版本，早年主线存在归属漂移，'
        '越近越准。PIT 成分数据未验证。'
    ),
    'local': (
        '概念成分为当前快照回看历史(本地自 2026-07 起留存, 无历史版本), '
        '早年主线存在归属漂移, 越近越准'
    ),
}

# Set once at startup; sync_boards() must not re-resolve and diverge from the
# whitelist already in effect inside the running process.
_ACTIVE_TAXONOMY: str | None = None


def monitor_ext_fields(taxonomy: str | None = None) -> dict:
    """Preferences payload for monitor/alert ext columns. Never mutate templates."""
    table = MONITOR_FIELDS.get(taxonomy or DEFAULT_TAXONOMY, MONITOR_FIELDS['local'])
    return {key: dict(value) for key, value in table.items()}


def _data_dir(explicit=None) -> Path:
    if explicit is not None:
        return Path(explicit)
    try:
        from app.config import settings
        return Path(settings.data_dir)
    except Exception:
        return Path(os.environ.get('TSP_DATA_DIR', 'data-local'))


def official_tables_ready(data_dir=None) -> bool:
    """A complete host import + non-empty published tables are required."""
    root = _data_dir(data_dir)
    manifest = root / 'fuyao' / 'manifest.json'
    if not manifest.is_file():
        return False
    try:
        import json
        import polars as pl
        meta = json.loads(manifest.read_text(encoding='utf-8'))
        if (meta.get('boards') or {}).get('complete') is not True:
            return False
        for cid in OFFICIAL_IDS.values():
            part = root / 'ext_data' / cid / 'part.parquet'
            if not part.is_file() or pl.read_parquet(part).height == 0:
                return False
    except Exception as exc:  # noqa: BLE001 — any check failure means "not ready"
        log.warning('BOARD_TAXONOMY: official table check failed: %s', exc)
        return False
    return True


def resolve_taxonomy(data_dir=None) -> str:
    """Resolve the requested switch, downgrading to local when unsafe."""
    requested = os.environ.get(TAXONOMY_ENV, DEFAULT_TAXONOMY).strip().lower()
    if requested not in TAXONOMY_IDS:
        log.warning('BOARD_TAXONOMY: unknown %s=%r, using %s',
                    TAXONOMY_ENV, requested, DEFAULT_TAXONOMY)
        requested = DEFAULT_TAXONOMY
    if requested == 'official' and not official_tables_ready(data_dir):
        log.warning('BOARD_TAXONOMY: official import incomplete, falling back to local taxonomy')
        return 'local'
    return requested


def active_taxonomy() -> str:
    """The taxonomy installed in this process (or a fresh safe resolution)."""
    return _ACTIVE_TAXONOMY or resolve_taxonomy()


def install_membership_note(taxonomy: str | None = None) -> str | None:
    """Replace the upstream mainline note with an accurate taxonomy statement.

    ``app.api.regime`` does ``from app.services.market_mainline import
    MEMBERSHIP_NOTE`` inside the endpoint, so patching the module attribute is
    enough; no upstream file is edited. A failure here must never block startup.
    """
    selected = taxonomy or active_taxonomy()
    note = MEMBERSHIP_NOTES.get(selected, MEMBERSHIP_NOTES['local'])
    mainline = sys.modules.get('app.services.market_mainline')
    if mainline is None:
        try:
            import app.services.market_mainline as mainline  # noqa: E402
        except Exception as exc:  # noqa: BLE001 — advisory note only
            log.warning('BOARD_TAXONOMY: cannot patch membership note: %s', exc)
            return None
    mainline.MEMBERSHIP_NOTE = note
    return note


def dimension_field_for(taxonomy: str, original):
    """Drop-in replacement for _dimension_field with a config-id whitelist."""
    allowed = TAXONOMY_IDS.get(taxonomy, TAXONOMY_IDS['local'])

    def _filtered(config, kind):
        if config.id not in allowed.get(kind, set()):
            return None
        return original(config, kind)

    _filtered._tsp_board_whitelist = True
    return _filtered


def _clear_rotation_caches() -> None:
    rr = sys.modules.get('app.services.rps_rotation')
    if rr is None:
        return
    for name in ('_map_cache', '_map_ts', '_cache', '_cache_ts', '_cache_days'):
        cache = getattr(rr, name, None)
        if hasattr(cache, 'clear'):
            cache.clear()


def install_board_taxonomy(data_dir=None, taxonomy: str | None = None) -> str:
    """Install the whitelist BEFORE app.main imports the board services.

    rps_rotation binds ``_dimension_field`` with ``from ... import`` at import
    time, so patching the source module here is enough for later imports; an
    already-imported rps_rotation is patched explicitly as a fallback.
    """
    global _ACTIVE_TAXONOMY
    selected = taxonomy or resolve_taxonomy(data_dir)
    _ACTIVE_TAXONOMY = selected
    try:
        import app.services.market_overview_builder as mob
    except Exception as exc:  # noqa: BLE001 — startup must not be blocked
        log.warning('BOARD_TAXONOMY: cannot patch dimension resolver: %s', exc)
        return selected

    if getattr(mob, '_tsp_board_taxonomy_installed', False):
        return selected
    original = mob._dimension_field
    filtered = dimension_field_for(selected, original)
    mob._dimension_field = filtered
    mob._tsp_board_taxonomy_installed = True

    rr = sys.modules.get('app.services.rps_rotation')
    if rr is not None and getattr(rr, '_dimension_field', None) is original:
        rr._dimension_field = filtered
    _clear_rotation_caches()

    try:
        from app.services import preferences
        preferences.save({'monitor_ext_fields': monitor_ext_fields(selected)})
    except Exception as exc:  # noqa: BLE001 — preferences are advisory here
        log.warning('BOARD_TAXONOMY: monitor_ext_fields update failed: %s', exc)

    log.warning('BOARD_TAXONOMY_ACTIVE: %s (concept=%s, industry=%s)',
                selected, ','.join(sorted(TAXONOMY_IDS[selected]['concept'])),
                ','.join(sorted(TAXONOMY_IDS[selected]['industry'])))
    return selected


# ``app.api.overview`` defines its OWN fuzzy _dimension_field instead of
# importing the builder's version. Patching only market_overview_builder leaves
# the dashboard concept/industry ranks aggregating local + official tables.
BINDING_MODULES = (
    'app.api.overview',
    'app.services.rps_rotation',
    'app.services.market_overview_builder',
)


def install_board_taxonomy_bindings(taxonomy: str | None = None) -> list[str]:
    """Apply the whitelist to every loaded dimension resolver.

    Runs AFTER ``app.main`` has imported the API modules, because
    ``app.api.overview`` is not loaded at the early bootstrap stage. Idempotent:
    resolvers already wrapped by ``dimension_field_for`` are left untouched.
    """
    selected = taxonomy or active_taxonomy()
    patched = []
    for name in BINDING_MODULES:
        module = sys.modules.get(name)
        if module is None:
            continue
        current = getattr(module, '_dimension_field', None)
        if current is None or getattr(current, '_tsp_board_whitelist', False):
            continue
        module._dimension_field = dimension_field_for(selected, current)
        patched.append(name)
    _clear_rotation_caches()
    overview = sys.modules.get('app.api.overview')
    if overview is not None and hasattr(overview, 'invalidate_overview_cache'):
        try:
            overview.invalidate_overview_cache()
        except Exception as exc:  # noqa: BLE001 — cache invalidation is advisory
            log.warning('BOARD_TAXONOMY: overview cache invalidation failed: %s', exc)
    log.warning('BOARD_TAXONOMY_BINDINGS_ACTIVE: %s (%s)',
                ','.join(patched) or 'none', selected)
    return patched
