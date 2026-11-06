"""把矩阵区间越界的英文异常换成带可用数据范围的中文提示。

TSP 原生错误 ``matrix parquet range contains no market data`` 不说明是哪张表、
可用日期是什么。K 段稳健优化会让几百组参数重复同一句，用户无法定位，只能看到
"0/624 组完成 + 624 行相同英文"。典型触发：ETF 历史被股票日线范围截断后，
用长区间做 K=4 切分，前几段完全落在数据起始日之前。

本 patch **只替换异常文案，不改任何加载行为、不裁剪区间、不放宽校验**：
仅当 ``ValueError``/异常文本含上述标记时才替换。自动裁剪区间会静默改变回测
语义，在强调无未来函数 / 证据链的系统里不可接受，所以坚持如实报错。

两个挂载点是必要的：
1. ``BacktestEngine.load_market_data_matrix_for_backtest`` — 主进程内的普通回测。
2. ``app.backtest.worker.run_worker_task`` — 稳健优化 / walk-forward 用
   ``mp.get_context("spawn")``，子进程不继承主进程内存 patch，所以必须在
   主进程接收 worker 异常的位置改写；同时这里能拿到 task 里的完整请求区间。
"""
from __future__ import annotations

import functools
import logging
from pathlib import Path

log = logging.getLogger(__name__)

_MARK = "matrix parquet range contains no market data"


def _range_text(asset_type: str, data_dir: Path) -> str:
    from app.tickflow.repository import enriched_dirname

    try:
        sub = enriched_dirname(asset_type)
    except Exception:  # noqa: BLE001 — 版本差异时退回约定目录名
        sub = "kline_etf_enriched" if asset_type == "etf" else "kline_daily_enriched"
    root = Path(data_dir) / sub
    names = sorted(
        p.name[5:] for p in root.glob("date=*")
        if p.is_dir() and p.name.startswith("date=")
    )
    if not names:
        return f"{sub} 无日期分区"
    return f"{sub}: {names[0]} ~ {names[-1]}（{len(names)} 个交易日）"


def _hint(start, end, asset_type: str, data_dir) -> str:
    try:
        detail = _range_text(asset_type, Path(data_dir))
    except Exception as exc:  # noqa: BLE001
        detail = f"可用范围读取失败({exc})"
    return (
        f"回测区间 {start} ~ {end} 与本地 {asset_type} 日线无交集；"
        f"可用范围 {detail}。请把起止日期调整到该范围内，"
        f"或先同步更长历史（ETF: python3 scripts/sync_etf_from_tdx.py "
        f"--mode host --start YYYY-MM-DD，再跑 container 模式并重启容器）。"
    )


def install() -> None:
    from app.backtest import worker as worker_mod
    from app.backtest.engine import BacktestEngine
    from app.config import settings

    if not getattr(BacktestEngine, "_tsp_range_hint_patched", False):
        original = BacktestEngine.load_market_data_matrix_for_backtest

        @functools.wraps(original)
        def engine_wrapper(
            self, symbols, start, end, feature_plan, asset_type="stock", *args, **kwargs
        ):
            try:
                return original(
                    self, symbols, start, end, feature_plan, asset_type, *args, **kwargs
                )
            except ValueError as exc:
                if _MARK not in str(exc):
                    raise
                raise ValueError(
                    _hint(start, end, asset_type, self.repo.store.data_dir)
                ) from exc

        BacktestEngine.load_market_data_matrix_for_backtest = engine_wrapper
        BacktestEngine._tsp_range_hint_patched = True

    if not getattr(worker_mod.run_worker_task, "_tsp_range_hint_patched", False):
        original_run = worker_mod.run_worker_task

        @functools.wraps(original_run)
        def run_wrapper(task, *args, **kwargs):
            try:
                return original_run(task, *args, **kwargs)
            except Exception as exc:  # noqa: BLE001 — 仅改写含标记的异常
                if _MARK not in str(exc):
                    raise
                cfg = task.get("config") if isinstance(task, dict) else None
                cfg = cfg if isinstance(cfg, dict) else {}
                bt = cfg.get("backtest_kwargs") or {}
                asset_type = bt.get("asset_type", "stock") if isinstance(bt, dict) else "stock"
                data_dir = (
                    task.get("data_dir") if isinstance(task, dict) else None
                ) or settings.data_dir
                raise ValueError(
                    _hint(cfg.get("start", "?"), cfg.get("end", "?"), asset_type, data_dir)
                ) from exc

        run_wrapper._tsp_range_hint_patched = True
        worker_mod.run_worker_task = run_wrapper

    log.warning("MATRIX_RANGE_HINT: installed")
