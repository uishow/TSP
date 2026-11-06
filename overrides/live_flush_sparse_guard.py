"""防止稀疏实时快照覆写当日全市场分区 (TSP v0.3.31 + 本地 local_quant 源)。

问题
----
``QuoteService`` 的「收盘最终行情同步」对 stock/etf 调用
``KlineRepository.flush_live_daily_asset`` / ``flush_live_enriched_asset``。
这两个方法在上游源码里的语义是「覆写当天分区 (实时行情落盘, 非merge)」,
前提是实时源返回**全市场**行情。本机桥接只返回自选/监控标的
(实测 2026-11-06 20:43 为 1 只股票 / 0 只 ETF / 9 只指数), 因此每次容器
启动都会把当日 5484 行的股票分区截断成 1 行, 并连带污染 enriched 缓存、
策略池矩阵与回测区间。20:43:27 读到 5484 行 → 20:43:33 "enriched 全量:
1 只" → 20:44 起只剩 1 行, backend.log 可复现。指数路径上游本就用
``merge_live_daily_asset``, 所以只有 stock/etf 受害。

做法
----
上游已经提供 ``merge_live_daily_asset`` / ``merge_live_enriched_asset``,
docstring 明确写着「用于少量自选实时, 不覆盖全市场」。本 patch 只在
「当日分区已有大量标的、而本次快照明显稀疏」时把 flush 转调 merge;
全市场快照 (>= 已有行数的一半) 完全保持上游覆写语义不变。

约束
----
* 只作用于 stock/etf; index 保持原样。
* 只读取当日单个 parquet 的行数, 不改写数据内容。
* 任何异常都回退到上游原方法 (best-effort), 不阻断实时链路。
* 幂等: 以类属性 ``_tsp_sparse_flush_installed`` 防重复包装。
"""
from __future__ import annotations

import logging

log = logging.getLogger(__name__)

# ETF 策略池分区只有 52 行, 阈值必须低于它才能同样受保护。
_MIN_EXISTING_ROWS = 20
_SPARSE_RATIO = 0.5
_TABLES = {
    "daily": {
        "stock": "kline_daily",
        "etf": "kline_etf_daily",
        "index": "kline_index_daily",
    },
    "enriched": {
        "stock": "kline_daily_enriched",
        "etf": "kline_etf_enriched",
        "index": "kline_index_enriched",
    },
}


def _existing_rows(self, kind: str, asset_type: str, df) -> int | None:
    """当日分区已有行数; 表未知时返回 None 表示放弃保护。"""
    import polars as pl

    table = _TABLES[kind].get(asset_type)
    if not table:
        return None
    dt = df["date"][0]
    ds = dt.isoformat() if hasattr(dt, "isoformat") else str(dt)
    out = self.store.data_dir / table / f"date={ds}" / "part.parquet"
    if not out.exists():
        return 0
    # read_parquet 兼容本项目所有 polars 版本; 单个当日分区仅数千行, 开销可忽略。
    return int(pl.read_parquet(out).height)


def _make_wrapper(kind: str, original, merge_name: str):
    def wrapped(self, asset_type, df, *args, **kwargs):
        if (
            asset_type in {"stock", "etf"}
            and df is not None
            and not df.is_empty()
            and "date" in df.columns
        ):
            try:
                existing = _existing_rows(self, kind, asset_type, df)
                if (
                    existing is not None
                    and existing >= _MIN_EXISTING_ROWS
                    and df.height < existing * _SPARSE_RATIO
                ):
                    merge = getattr(type(self), merge_name, None) or getattr(
                        self, merge_name
                    )
                    log.warning(
                        "SPARSE_FLUSH_GUARD: %s %s snapshot=%d rows, existing=%d rows -> %s (keep full market partition)",
                        kind, asset_type, df.height, existing, merge_name,
                    )
                    return merge(self, asset_type, df)
            except Exception as exc:  # noqa: BLE001 -- best-effort guard
                log.warning(
                    "SPARSE_FLUSH_GUARD: guard failed (%s), fallback to upstream flush",
                    exc,
                )
        return original(self, asset_type, df, *args, **kwargs)

    wrapped.__name__ = getattr(original, "__name__", "flush_live_asset")
    return wrapped


def install() -> None:
    from app.tickflow.repository import KlineRepository

    if getattr(KlineRepository, "_tsp_sparse_flush_installed", False):
        return

    original_daily = KlineRepository.flush_live_daily_asset
    original_enriched = KlineRepository.flush_live_enriched_asset
    KlineRepository.flush_live_daily_asset = _make_wrapper(
        "daily", original_daily, "merge_live_daily_asset"
    )
    KlineRepository.flush_live_enriched_asset = _make_wrapper(
        "enriched", original_enriched, "merge_live_enriched_asset"
    )
    KlineRepository._tsp_sparse_flush_installed = True
    log.warning("SPARSE_FLUSH_GUARD: installed (stock/etf sparse live snapshots)")
