"""盘后管道日K分块 schema 兼容修复 (TSP v0.3.30 + 本地 local_quant 源)。

``app/services/kline_sync.py::_persist_daily_chunks`` 用
``pl.scan_parquet(files)`` 一次扫描 provider 写出的全部分块，再用
``pl.scan_parquet(existing)`` 扫描已有分区分片。本地数据源不同分块会带
不同的可选列（如 ``adjust``），polars 1.44 在多文件 schema 不一致时抛：

    did not find column adjust, consider passing missing_columns='insert'

盘后管道因此在 sync_daily 中途整体失败。这里只给 ``kline_sync`` 模块内
的 ``pl`` 换一个轻量代理，使该模块的 scan_parquet 带上
``missing_columns='insert' / extra_columns='ignore'``；其余 polars 调用
原样转发，不动镜像、不动已有 parquet、不影响其他模块。
"""
from __future__ import annotations

import logging

import polars as pl

from app.services import kline_sync as _mod

logger = logging.getLogger(__name__)

_original_scan_parquet = pl.scan_parquet


class _PolarsProxy:
    """把除 scan_parquet 外的所有属性原样转给真正的 polars 模块。"""

    def __getattr__(self, name):
        return getattr(pl, name)

    @staticmethod
    def scan_parquet(source, *args, **kwargs):
        kwargs.setdefault("missing_columns", "insert")
        kwargs.setdefault("extra_columns", "ignore")
        return _original_scan_parquet(source, *args, **kwargs)


def install() -> None:
    if getattr(_mod, "_tsp_daily_chunk_fix_installed", False):
        return
    _mod.pl = _PolarsProxy()
    _mod._tsp_daily_chunk_fix_installed = True
    logger.info("daily chunk scan_parquet compat fix installed")
