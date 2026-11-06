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

# 本地 local_quant 维表部分标的带 ext 股本字段，polars 默认只推断前 100 行，
# 会让 sync_instruments 抛 i64 类型冲突并中断整个盘后管道。详见模块注释。
from overrides.instrument_sync_fix import install as install_instrument_sync_fix  # noqa: E402
install_instrument_sync_fix()

# 本地数据源的日K分块可选列不一致会让 _persist_daily_chunks 的
# pl.scan_parquet 多文件扫描中断整个盘后管道。详见模块注释。
from overrides.daily_chunk_fix import install as install_daily_chunk_fix  # noqa: E402
install_daily_chunk_fix()

# 稳健优化 / walk-forward 的 Query 参数没有 asset_type，ETF 策略会以默认
# "stock" 构造 StrategyBacktestConfig 并在 worker 的 validate_context 报错；
# 且 first.asset_type 决定读哪张矩阵。必须在主进程构造优化 config 时注入，
# 随 config 序列化进 spawn worker（子进程不继承内存 patch）。
from overrides.optimize_asset_fix import install as install_optimize_asset_fix  # noqa: E402
install_optimize_asset_fix()

# 区间越界时给出可用数据范围与补数方法，避免几百组参数重复同一句英文异常。
# 只替换错误文案，不裁剪区间（裁剪会静默改变回测语义）。
from overrides.matrix_range_hint import install as install_matrix_range_hint  # noqa: E402
install_matrix_range_hint()
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
