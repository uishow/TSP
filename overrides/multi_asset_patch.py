"""Backtest page: allow selecting stock AND ETF at the same time.

DEPLOYMENT CONTRACT (user rule 2026-11-09): no customization may interfere
with TSP's own version upgrades. Therefore this module deliberately:

  * lives in the mounted ``overrides/`` volume, never inside the image;
  * never edits ``compose.yaml``, the pinned OCI digest, ``doctor.py``,
    ``upstream/`` sources, or any file shipped by the image;
  * discovers the current ``Backtest-*.js`` chunk by path pattern instead of
    hard-coding a content-hashed filename (which changes on every upgrade);
  * keeps ONE replacement profile per known upstream minifier layout and picks
    the profile whose targets all match exactly once (11 for the v0.3.31 /
    v0.3.34 layouts, 10 for v0.3.35), so a rollback to an older image keeps
    working too;
  * verifies every replacement target exists exactly once; if NO profile fits
    after an upgrade it serves the ORIGINAL asset unchanged and logs
    ``MULTI_ASSET_PATCH_SKIPPED`` -- the page still works, only this
    customization is inactive. It never raises, never white-screens, never
    blocks startup;
  * can be switched off with ``TSP_MULTI_ASSET_PATCH=0`` or by touching
    ``overrides/multi_asset_patch.disabled`` -- neither requires editing
    compose.yaml, the pinned digest, or any image-shipped file.

The patch is pure ASGI middleware. Non-matching requests are forwarded without
wrapping the response, so SSE backtest streams are untouched.

Backend is intentionally NOT modified: the strategy list already returns the
union when ``asset_type`` is omitted (verified), and the backtest request now
carries the asset type declared by the selected strategy, so the server keeps
receiving a valid single value and keeps reading the correct quote table.
"""
from __future__ import annotations

import logging
import os
import re
from pathlib import Path

log = logging.getLogger(__name__)

_DISABLE_FLAG = Path(__file__).with_name("multi_asset_patch.disabled")


def enabled() -> bool:
    """Kill switch that never touches compose.yaml (an upgrade baseline file).

    Disable by either TSP_MULTI_ASSET_PATCH=0 or by creating an empty file
    ``overrides/multi_asset_patch.disabled`` in the mounted volume, then
    restart. No image/digest/config-baseline edit is required.
    """
    if os.environ.get("TSP_MULTI_ASSET_PATCH", "1") == "0":
        return False
    try:
        return not _DISABLE_FLAG.exists()
    except OSError:
        return True


# Matches both /assets/<chunk> and the versioned /_static/<ver>/assets/<chunk>.
# The chunk name is discovered, never pinned.
_CHUNK_RE = re.compile(r"^/(?:_static/[^/]+/)?assets/(Backtest-[A-Za-z0-9_-]+\.js)$")

# Exactly-once text substitutions on the minified React chunk.
# Names use a __tsp prefix so they cannot collide with minifier-generated
# single-letter locals inside the component.
# Profile A: upstream v0.3.31 chunk (Backtest-BghTRouv.js, 193,111 B).
_REPLACEMENTS_V031: list[tuple[str, str, str]] = [
    (
        '''[C,R]=c.useState((r==null?void 0:r.assetType)??"stock"),''',
        '''[C,R]=c.useState((r==null?void 0:r.assetType)??"stock"),[__tspVisible,__tspSetVisible]=c.useState(["stock","etf"]),''',
        "multi-select state",
    ),
    (
        '''Ue=re({queryKey:oe.screenerStrategies(C,"all"),queryFn:()=>Q.screenerStrategies(C,"all")})''',
        '''Ue=re({queryKey:oe.screenerStrategies(__tspVisible.length>1?"":__tspVisible[0],"all"),queryFn:()=>Q.screenerStrategies(__tspVisible.length>1?"":__tspVisible[0],"all")})''',
        "strategy list union request",
    ),
    (
        '''bn=c.useMemo(()=>p==="all"?Le:Le.filter(s=>s.source===p),[p,Le]);''',
        '''bn=c.useMemo(()=>p==="all"?Le:Le.filter(s=>s.source===p),[p,Le]);const __tspEffectiveAsset=(()=>{const z=Le.find(t=>t.id===o);return(z==null?void 0:z.asset_types)?.[0]||(__tspVisible.length===1?__tspVisible[0]:C)||"stock"})();''',
        "effective asset type derived from selected strategy",
    ),
    (
        '''Zi({strategy_id:o,asset_type:C,symbols:''',
        '''Zi({strategy_id:o,asset_type:__tspEffectiveAsset,symbols:''',
        "backtest request asset_type",
    ),
    (
        '''gs=C==="etf"?''',
        '''gs=__tspEffectiveAsset==="etf"?''',
        "enriched readiness probe",
    ),
    (
        '''Gr=C==="etf"?"ETF 指标数据":"股票指标数据"''',
        '''Gr=__tspEffectiveAsset==="etf"?"ETF 指标数据":"股票指标数据"''',
        "indicator status label",
    ),
    (
        '''e.jsx(Eo,{value:h,onChange:j,assetType:C})''',
        '''e.jsx(Eo,{value:h,onChange:j,assetType:__tspEffectiveAsset})''',
        "symbol pool candidate scope",
    ),
    (
        '''onClick:()=>{R(s),d(null),j("")}''',
        '''onClick:()=>{__tspSetVisible(t=>t.length>1?[s]:t[0]===s?["stock","etf"]:[s]),R(s)}''',
        "toggle buttons (no longer clear strategy / pool)",
    ),
    (
        '''${C===s?"bg-accent/10 text-accent":"text-muted hover:text-foreground"}''',
        '''${__tspVisible.includes(s)?"bg-accent/10 text-accent":"text-muted hover:text-foreground"}''',
        "both buttons highlighted when union is selected",
    ),
    (
        '''children:"ETF 仅技术类策略,读 ETF enriched"''',
        '''children:"可同时选股票+ETF；回测口径自动跟随所选策略"''',
        "hint text",
    ),
    (
        '''const fs=(s=!1)=>{if(!o||$t)return;''',
        '''const fs=(s=!1)=>{if(!o||$t||!Le.length)return;''',
        "guard: never run before the strategy list is loaded",
    ),
]


# Profile B: upstream v0.3.34 chunk (Backtest-CMN4X2tp.js, 195,474 B).
# Same semantics, different minifier names: C->$, R->L, Ue->Ve, bn->hn,
# Zi->Xi, Eo->Po, oe->ce, Q->H, re->ie. The chunk filename is NOT referenced
# anywhere; profiles are selected purely by which target set matches.
_REPLACEMENTS_V034: list[tuple[str, str, str]] = [
    (
        '''[$,L]=c.useState((r==null?void 0:r.assetType)??"stock"),''',
        '''[$,L]=c.useState((r==null?void 0:r.assetType)??"stock"),[__tspVisible,__tspSetVisible]=c.useState(["stock","etf"]),''',
        "multi-select state",
    ),
    (
        '''Ve=ie({queryKey:ce.screenerStrategies($,"all"),queryFn:()=>H.screenerStrategies($,"all")})''',
        '''Ve=ie({queryKey:ce.screenerStrategies(__tspVisible.length>1?"":__tspVisible[0],"all"),queryFn:()=>H.screenerStrategies(__tspVisible.length>1?"":__tspVisible[0],"all")})''',
        "strategy list union request",
    ),
    (
        '''hn=c.useMemo(()=>p==="all"?Le:Le.filter(s=>s.source===p),[p,Le]);''',
        '''hn=c.useMemo(()=>p==="all"?Le:Le.filter(s=>s.source===p),[p,Le]);const __tspEffectiveAsset=(()=>{const z=Le.find(t=>t.id===o);return(z==null?void 0:z.asset_types)?.[0]||(__tspVisible.length===1?__tspVisible[0]:$)||"stock"})();''',
        "effective asset type derived from selected strategy",
    ),
    (
        '''Xi({strategy_id:o,asset_type:$,symbols:''',
        '''Xi({strategy_id:o,asset_type:__tspEffectiveAsset,symbols:''',
        "backtest request asset_type",
    ),
    (
        '''gs=$==="etf"?''',
        '''gs=__tspEffectiveAsset==="etf"?''',
        "enriched readiness probe",
    ),
    (
        '''Gr=$==="etf"?"ETF 指标数据":"股票指标数据"''',
        '''Gr=__tspEffectiveAsset==="etf"?"ETF 指标数据":"股票指标数据"''',
        "indicator status label",
    ),
    (
        '''e.jsx(Po,{value:b,onChange:j,assetType:$})''',
        '''e.jsx(Po,{value:b,onChange:j,assetType:__tspEffectiveAsset})''',
        "symbol pool candidate scope",
    ),
    (
        '''onClick:()=>{L(s),d(null),j("")}''',
        '''onClick:()=>{__tspSetVisible(t=>t.length>1?[s]:t[0]===s?["stock","etf"]:[s]),L(s)}''',
        "toggle buttons (no longer clear strategy / pool)",
    ),
    (
        '''${$===s?"bg-accent/10 text-accent":"text-muted hover:text-foreground"}''',
        '''${__tspVisible.includes(s)?"bg-accent/10 text-accent":"text-muted hover:text-foreground"}''',
        "both buttons highlighted when union is selected",
    ),
    (
        '''children:"ETF 仅技术类策略,读 ETF enriched"''',
        '''children:"可同时选股票+ETF；回测口径自动跟随所选策略"''',
        "hint text",
    ),
    (
        '''const fs=(s=!1)=>{if(!o||$t)return;''',
        '''const fs=(s=!1)=>{if(!o||$t||!Le.length)return;''',
        "guard: never run before the strategy list is loaded",
    ),
]


# Profile C: upstream v0.3.35 chunk (Backtest-CtEK-pBj.js, 197,456 B).
# v0.3.35 still uses `$` for the asset-type state, but renamed almost everything
# else: state setter R/L->g, strategy-list query Ue->le wrapper, presets Le->ke,
# readiness xt/_s, label Gr->Yr, pool Eo->Xo, run handler Zi->xl, guard fs->vs.
# The two former anchors ("effective asset type" + "enriched readiness probe")
# are merged: the effective asset is now declared inside the same `const`
# declaration list, right before `_s`. 10 tuples, same semantics.
_REPLACEMENTS_V035: list[tuple[str, str, str]] = [
    (
        '''[$,g]=c.useState((r==null?void 0:r.assetType)??"stock"),''',
        '''[$,g]=c.useState((r==null?void 0:r.assetType)??"stock"),[__tspVisible,__tspSetVisible]=c.useState(["stock","etf"]),''',
        "multi-select state",
    ),
    (
        '''Ue=le({queryKey:te.screenerStrategies($,"all"),queryFn:()=>H.screenerStrategies($,"all")})''',
        '''Ue=le({queryKey:te.screenerStrategies(__tspVisible.length>1?"":__tspVisible[0],"all"),queryFn:()=>H.screenerStrategies(__tspVisible.length>1?"":__tspVisible[0],"all")})''',
        "strategy list union request",
    ),
    (
        '''_s=$==="etf"?''',
        '''__tspEffectiveAsset=(()=>{const z=ke.find(t=>t.id===o);return(z==null?void 0:z.asset_types)?.[0]||(__tspVisible.length===1?__tspVisible[0]:$)||"stock"})(),_s=__tspEffectiveAsset==="etf"?''',
        "effective asset type + enriched readiness probe",
    ),
    (
        '''xl({strategy_id:o,asset_type:$,symbols:''',
        '''xl({strategy_id:o,asset_type:__tspEffectiveAsset,symbols:''',
        "backtest request asset_type",
    ),
    (
        '''Yr=$==="etf"?"ETF 指标数据":"股票指标数据"''',
        '''Yr=__tspEffectiveAsset==="etf"?"ETF 指标数据":"股票指标数据"''',
        "indicator status label",
    ),
    (
        '''e.jsx(Xo,{value:M,onChange:O,assetType:$})''',
        '''e.jsx(Xo,{value:M,onChange:O,assetType:__tspEffectiveAsset})''',
        "symbol pool candidate scope",
    ),
    (
        '''onClick:()=>{g(s),d(null),O("")}''',
        '''onClick:()=>{__tspSetVisible(t=>t.length>1?[s]:t[0]===s?["stock","etf"]:[s]),g(s)}''',
        "toggle buttons (no longer clear strategy / pool)",
    ),
    (
        '''${$===s?"bg-accent/10 text-accent":"text-muted hover:text-foreground"}''',
        '''${__tspVisible.includes(s)?"bg-accent/10 text-accent":"text-muted hover:text-foreground"}''',
        "both buttons highlighted when union is selected",
    ),
    (
        '''children:"ETF 仅技术类策略,读 ETF enriched"''',
        '''children:"可同时选股票+ETF；回测口径自动跟随所选策略"''',
        "hint text",
    ),
    (
        '''const vs=(s=!1)=>{if(!o||Mt)return;''',
        '''const vs=(s=!1)=>{if(!o||Mt||!ke.length)return;''',
        "guard: never run before the strategy list is loaded",
    ),
]


# Order matters only for diagnostics. Each profile is tried against the ORIGINAL
# source; the first profile whose every target occurs exactly once wins.
_PROFILES: tuple[tuple[str, list[tuple[str, str, str]]], ...] = (
    ("v0.3.35+", _REPLACEMENTS_V035),
    ("v0.3.34+", _REPLACEMENTS_V034),
    ("v0.3.31", _REPLACEMENTS_V031),
)


class PatchTargetMissing(RuntimeError):
    """No replacement profile fits this upstream chunk; fall back safely."""


def patch_source(source: str) -> tuple[str, list[str], str]:
    """Apply the first fully-matching profile. Raises if none fits."""
    diagnostics: list[str] = []
    for profile, replacements in _PROFILES:
        out = source
        applied: list[str] = []
        for old, new, label in replacements:
            count = out.count(old)
            if count != 1:
                diagnostics.append(f"{profile}/{label}: expected 1 target, found {count}")
                break
            out = out.replace(old, new, 1)
            applied.append(label)
        else:
            return out, applied, profile
    raise PatchTargetMissing("; ".join(diagnostics[:3]) or "no profiles configured")


def _static_dir() -> Path:
    """Resolve the served static dir without hard-coding an image path."""
    try:
        from app import main as upstream_main
        candidate = getattr(upstream_main, "_static", None)
        if candidate:
            return Path(candidate)
    except Exception:  # noqa: BLE001 - resolution failure must never break startup
        pass
    try:
        from app.config import settings
        return Path(settings.static_dir)
    except Exception:  # noqa: BLE001
        pass
    return Path("/app/static")


class MultiAssetPatchMiddleware:
    """Pure ASGI middleware: patch one JS asset, transparently pass everything else."""

    _announced = False

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or not enabled():
            await self.app(scope, receive, send)
            return
        match = _CHUNK_RE.match(scope.get("path", ""))
        if not match:
            await self.app(scope, receive, send)
            return

        chunk = match.group(1)
        asset = _static_dir() / "assets" / chunk
        try:
            original = asset.read_text(encoding="utf-8")
            patched, applied, profile = patch_source(original)
        except Exception as exc:  # noqa: BLE001 - upgrade-safe degradation
            log.warning(
                "MULTI_ASSET_PATCH_SKIPPED: %s; serving upstream asset unchanged (%s)",
                chunk, exc,
            )
            await self.app(scope, receive, send)
            return

        if not MultiAssetPatchMiddleware._announced:
            log.warning(
                "MULTI_ASSET_PATCH_ACTIVE: %s profile=%s applied=%d bytes %d->%d",
                chunk, profile, len(applied), len(original.encode("utf-8")),
                len(patched.encode("utf-8")),
            )
            MultiAssetPatchMiddleware._announced = True

        from starlette.responses import Response
        response = Response(
            patched,
            media_type="text/javascript",
            headers={"Cache-Control": "no-store"},
        )
        await response(scope, receive, send)


def attach(app) -> None:
    """Register from overrides/bootstrap.py at startup."""
    if not enabled():
        log.warning(
            "MULTI_ASSET_PATCH_DISABLED: env=0 or kill-switch file %s exists",
            _DISABLE_FLAG,
        )
        return
    if getattr(app.state, "_tsp_multi_asset_patch_attached", False):
        return
    app.add_middleware(MultiAssetPatchMiddleware)
    app.state._tsp_multi_asset_patch_attached = True
    log.warning("MULTI_ASSET_PATCH_ATTACHED: upgrade-safe runtime patch ready")
