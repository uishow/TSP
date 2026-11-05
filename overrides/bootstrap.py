"""Run with uvicorn overrides.bootstrap:app; the policy is installed first."""
from overrides.source_policy import (
    install_network_guard,
    install_app_policy,
    install_enriched_integrity,
)

install_network_guard()
install_app_policy()

# Concept/industry pages must aggregate on exactly one taxonomy. Install this
# BEFORE app.main imports rps_rotation / market_overview_builder, so their
# `from ... import _dimension_field` binding picks up the whitelist.
from overrides.board_taxonomy import (  # noqa: E402
    install_board_taxonomy,
    install_board_taxonomy_bindings,
    install_membership_note,
)
install_board_taxonomy()

from app.main import app  # noqa: E402 — capture policy-protected references only
install_enriched_integrity()
# app.api.overview defines its own dimension matcher; patch it only after the
# API modules are loaded, otherwise the dashboard board ranks mix taxonomies.
install_board_taxonomy_bindings()
# regime.py imports MEMBERSHIP_NOTE inside the endpoint, so patching the
# module constant after app.main has loaded keeps the API note truthful.
install_membership_note()

from overrides.source_panel import attach
attach(app)

# B03: gate every native realtime/depth finalization on per-symbol quality
# fields; a mixed batch is rejected even if its freshest timestamp looks fine.
from overrides.realtime_quality import attach as attach_realtime_quality
attach_realtime_quality(app)

# C08: route native financial sync / backtest through the same PIT rule so a
# historical query can never look back with latest equity / current membership
# / period-end in place of a real announcement date.
from overrides.pit_policy import attach as attach_pit_policy
attach_pit_policy(app)

# Reuse the existing scheduled/manual pipeline for local membership refresh.
from app.jobs import daily_pipeline
from overrides.local_extensions import sync_boards
_original_run_now = daily_pipeline.run_now

def _run_with_local_membership(*args, **kwargs):
    membership = sync_boards()
    result = _original_run_now(*args, **kwargs)
    result['local_membership'] = membership
    return result

daily_pipeline.run_now = _run_with_local_membership
