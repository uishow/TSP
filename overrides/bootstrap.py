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

# 上游 flush_live_*_asset 是「覆写当天分区」语义, 前提是实时源返回全市场行情;
# 本地桥接只返回自选/监控标的, 启动时「收盘最终行情同步」会把 5484 行截断成
# 1 行 (backend.log 20:43:27 -> 20:43:33 可复现)。稀疏快照时转调上游已有的
# merge_live_*_asset (注释即「用于少量自选实时, 不覆盖全市场」)。
from overrides.live_flush_sparse_guard import install as install_sparse_flush_guard  # noqa: E402
install_sparse_flush_guard()

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

# 本地桥接永久不提供已验签的 ETF 复权因子（adj_factor_etf 为空、ETF 未前复权）。
# 上游把「跳过」同时记进 stage_errors 导致每日任务误报 failed；只对这条特定
# SourceUnavailable 降级为同步 0 只，其它异常照常如实失败。
from overrides.pipeline_etf_adj_tolerance import install as install_etf_adj_tolerance  # noqa: E402
install_etf_adj_tolerance()

# 管道 sync_index 会把全市场 1821 只 ETF 写进最近分区，与 sync_etf_from_tdx.py
# 的 52 只策略池历史分区口径不一致（列 schema 也不同、且漏 2 只 LOF）。
# 管道结束后自动收敛回策略池口径，保证明天再跑管道不会复发。
from overrides.etf_universe_converge import install as install_etf_universe_converge  # noqa: E402
install_etf_universe_converge()

# 偏好自动迁移生成的 mr_strategy_* 规则没传 asset_type，normalize 落成默认
# "stock"；且每次启动/保存偏好都会把规则重新 enabled=True，停用或删除都会复活。
# 包装迁移函数，让它按策略 META.asset_types 修正口径并停用手建的重复规则。
from overrides.monitor_strategy_asset_fix import install as install_monitor_strategy_asset_fix  # noqa: E402
install_monitor_strategy_asset_fix()

# 本地财务「核心指标」换算补全: 不改 data-local 数据源, 仅在读取 metrics 时由原始
# 利润表/资产负债表换算衍生指标(ROE/ROA/净利率/资产负债率/同比)并补 EPS 字段名错位。
# 仅包装 financials 模块全局 get_financial_df, 不影响其它直接读取 parquet 的调用方。
from overrides.financials_metrics_enrich import install as install_financials_metrics_enrich  # noqa: E402
install_financials_metrics_enrich()

# 回测页「资产类型」股票/ETF 多选（用户 2026-11-09 选方案 2）。
# 铁律：所有二开不得影响 TSP 自身版本升级 —— 本补丁不改镜像、不改 pinned digest、
# 不改 upstream/ 源码、不写容器内随镜像分发的文件；按路径自动发现 Backtest-*.js
# （升级后内容哈希名会变），任一替换目标缺失即原样返回上游资源并记 SKIPPED 日志，
# 主功能照常可用、绝不白屏或阻断启动。TSP_MULTI_ASSET_PATCH=0 可一键关闭。
# 后端零改动：策略列表并集由「不传 asset_type」实现，回测请求口径由所选策略
# META.asset_types 推导，服务端仍收到合法的单一 asset_type。
from overrides.multi_asset_patch import attach as attach_multi_asset_patch  # noqa: E402
attach_multi_asset_patch(app)

# #105 新页方案：独立的「ETF 策略池监控」页（/etf-view），原系统 watchlist 页
# 一行不动。仅在 overrides 层新增路由，数据来自既有 bridge 接口
# （tdx_local_day / eltdx / tdx_local_lc1）。TSP_ETF_VIEW=0 可一键关闭（不注册路由）。
from overrides.etf_view import attach as attach_etf_view  # noqa: E402
attach_etf_view(app)
