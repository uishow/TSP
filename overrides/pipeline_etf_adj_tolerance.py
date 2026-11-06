"""把「本地源未提供已验签 ETF 复权因子」从阶段失败降级为 0 只跳过。

背景
----
``app/jobs/daily_pipeline.py`` 的 ETF 复权因子阶段::

    try:
        _, affected_etfs = index_sync.sync_etf_adj_factor(...)
    except Exception as e:
        logger.warning("ETF adj_factor skipped: %s", e)   # 记为「跳过」
        stage_errors.append(f"ETF adj_factor: {e}")       # 却又记为「失败」

末尾 ``if stage_errors: raise PipelineStageError`` 会让整个 job 变成
``failed`` / ``result=None`` / ``last_pipeline_run`` 不更新。日志说跳过、
终态判失败，自相矛盾。

桥接对 ETF 复权因子的返回是**永久性的、已知的不可用**::

    SourceUnavailable: local ETF/index adjustment factors not verified
    禁止网络回退

本地 ``adj_factor_etf`` 目录本来就为空，ETF 日线口径是未前复权；这一阶段
不产生任何数据，却让每日定时任务一直显示失败。

策略
----
只 patch ``app.services.index_sync.sync_etf_adj_factor``：遇到**这条特定**
不可用错误时返回 ``(0, [])``（= 同步 0 只），并打 WARNING 说明「维持未前
复权口径、不写 adj_factor_etf」。其它任何异常照常抛出，job 仍如实 failed。
匹配条件刻意收得很窄，避免吞掉将来真实的数据源故障。

明确不做：不放宽 ``source_policy`` 白名单、不伪造复权因子、不写
``adj_factor_etf``、不改 ETF 未前复权口径。
"""
from __future__ import annotations

import functools
import logging

log = logging.getLogger(__name__)

# 必须同时命中，避免把别的 SourceUnavailable 一起吞掉。
_MARKERS = (
    "SourceUnavailable",
    "local ETF/index adjustment factors not verified",
)


def _is_known_skip(exc: BaseException) -> bool:
    text = str(exc)
    return all(m in text for m in _MARKERS)


def install() -> None:
    from app.services import index_sync

    original = index_sync.sync_etf_adj_factor
    if getattr(original, "_tsp_etf_adj_tolerant", False):
        return

    @functools.wraps(original)
    def wrapper(*args, **kwargs):
        try:
            return original(*args, **kwargs)
        except Exception as exc:  # noqa: BLE001 — 只降级已知的那一种
            if not _is_known_skip(exc):
                raise
            log.warning(
                "PIPELINE_ETF_ADJ_TOLERATED: 本地源未提供已验签 ETF 复权因子，"
                "按同步 0 只跳过；ETF 维持未前复权口径，不写 adj_factor_etf: %s",
                exc,
            )
            return (0, [])

    wrapper._tsp_etf_adj_tolerant = True
    index_sync.sync_etf_adj_factor = wrapper
    log.warning("PIPELINE_ETF_ADJ_TOLERANCE: installed")
