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


def _preserve_display_names(df, data_dir):
    """2026-11-10 #13: 同步写盘前, 用旧维表里的中文名覆盖新表的「代码型 name」。

    本地 free-stockdb 日线 bar 不带 name; eltdx codes 握手在交易时段常超时,
    「数据 → 立即同步」会把 name 写成 000001 这种代码, 连板梯队/搜索/快照
    全部显示代码。这里做最后一道防线: 旧表已有的真实中文名绝不丢。

    - 新上市 / 旧表没有的标的: 保留原值 (诚实回落代码), 不编造名称。
    - 旧表本身全坏 (没有一条中文名): 原样返回, 交给
      scripts/fix_instrument_names.py 用全市场快照修数。
    """
    old = Path(data_dir) / "instruments" / "instruments.parquet"
    if not old.exists() or "name" not in df.columns or "symbol" not in df.columns:
        return df
    try:
        prev = pl.read_parquet(old, columns=["symbol", "name"])
    except Exception:  # noqa: BLE001 -- 旧表不可读不能阻断同步
        return df
    good: dict[str, str] = {}
    for sym, name in zip(prev["symbol"].to_list(), prev["name"].to_list()):
        sym, name = str(sym or ""), str(name or "").strip()
        code = sym.split(".")[0]
        if not name or name == code or (name.isdigit() and len(name) <= 6):
            continue
        good[sym] = name
    if not good:
        return df
    syms = df["symbol"].cast(pl.Utf8).to_list()
    names = df["name"].cast(pl.Utf8).to_list()
    fixed, out = 0, []
    for sym, name in zip(syms, names):
        text = str(name or "").strip()
        code = str(sym or "").split(".")[0]
        bad = (not text or text == code or (text.isdigit() and len(text) <= 6))
        if bad and str(sym) in good:
            out.append(good[str(sym)])
            fixed += 1
        else:
            out.append(name)
    logger.info("instruments display names preserved: %d rows restored", fixed)
    return df.with_columns(pl.Series("name", out, dtype=pl.Utf8))


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
    df = _preserve_display_names(df, Path(data_dir))
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
