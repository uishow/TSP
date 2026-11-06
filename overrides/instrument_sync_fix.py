"""修复本地数据源维表同步的 polars schema 推断冲突 (TSP v0.3.30)。

上游 ``app/services/instrument_sync.py::sync_instruments`` 用
``pl.DataFrame(all_rows)`` 构表；polars 默认 ``infer_schema_length=100``。
本地 ``local_quant`` 数据源返回 5510 行，其中仅 1308 行带 ext 扩展字段
（total_shares / float_shares 为 i64，tick_size 为 f64），其余 4202 行为
None。前 100 行恰好多为 None → 该列被推断成 Null，遇到后面的 i64 就抛：

    could not append value: 1468476655 of type: i64 to the builder;
    make sure that all rows have the same schema or consider increasing
    infer_schema_length

盘后管道因此在第 1 个阶段 sync_instruments 就整体失败，日K/指标/修补
都不会执行。这里只把构表改成 ``infer_schema_length=None``（全量推断），
其余 _preserve_share_fields / as_of / atomic_write_parquet 与原实现一致：
不改镜像、不改数据源、不丢 provider 提供的股本字段。
"""
from __future__ import annotations

import logging
from pathlib import Path

import polars as pl

from app.market_time import cn_today
from app.services import instrument_sync as _mod
from app.services.fs_utils import atomic_write_parquet

logger = logging.getLogger(__name__)

_original_sync_instruments = _mod.sync_instruments


def _sync_instruments_safe(data_dir) -> int:
    all_rows = _mod._fetch_instruments_via_provider()
    if all_rows is None:
        # 非 custom provider 分支（tickflow 直连）。本地部署由 source_policy
        # 禁用该路径；万一走到，交回原实现由其 fail-closed 守卫处理。
        return _original_sync_instruments(data_dir)
    if not all_rows:
        return 0

    df = pl.from_dicts(all_rows, infer_schema_length=None)
    df = _mod._preserve_share_fields(df, Path(data_dir))
    df = df.with_columns(pl.lit(cn_today()).alias("as_of"))
    out = Path(data_dir) / "instruments" / "instruments.parquet"
    out.parent.mkdir(parents=True, exist_ok=True)
    atomic_write_parquet(df, out)
    logger.info("instruments synced (schema-safe): %d rows → %s", df.height, out)
    return df.height


def install() -> None:
    """把 patch 装到模块对象上。

    daily_pipeline 用 ``from app.services import instrument_sync`` +
    ``instrument_sync.sync_instruments(...)``，改模块属性即可生效，
    无需触碰镜像内的任何文件。
    """
    if getattr(_mod, "_tsp_schema_fix_installed", False):
        return
    _mod.sync_instruments = _sync_instruments_safe
    _mod._tsp_schema_fix_installed = True
    logger.info("instrument_sync schema fix installed")
