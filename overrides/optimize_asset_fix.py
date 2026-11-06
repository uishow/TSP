"""为优化器入口补齐 asset_type，使 ETF 策略能用正确的矩阵回测。

根因
----
``/api/backtest/optimize-robust/stream`` 与 ``/walkforward/stream`` 的 Query
参数里没有 ``asset_type``，``_opt_backtest_kwargs()`` 也不返回它，于是
``RobustOptimizeConfig.backtest_kwargs`` / ``WalkForwardConfig.backtest_kwargs``
为空，worker 里 ``StrategyBacktestConfig.asset_type`` 落到默认 ``"stock"``：

    prepare_matrix_optimization -> StrategyEngine.validate_context
    ValueError: strategy ... does not support asset_type 'stock'; supported=['etf']

而且 ``first.asset_type`` 会一路传给 ``resolver.resolve`` /
``build_matrix_cache_profile`` / ``load_market_data_matrix_for_backtest``。
所以只放宽 ``validate_context`` 校验是不够的：那样会去读
``kline_daily_enriched``（股票）而不是 ``kline_etf_enriched``，结果全错。
必须让 config 本身就是 ``asset_type="etf"``。

worker 使用 ``mp.get_context("spawn")``，子进程不继承主进程的内存 patch。
因此本 patch 只在**主进程构造优化 config** 时把 asset_type 写进
``backtest_kwargs``，随 config 一起序列化传给 worker；worker 侧无需任何 patch。

资产类型用 ``ast`` 从 ``data/strategies/{custom,ai,composite}/<id>.py`` 的
``META`` 读取（不执行策略代码）。仅当策略声明的 ``asset_types`` 恰好一个且
不含 ``"stock"`` 时注入；股票策略、普通回测入口行为完全不变，调用方若显式
传了 ``asset_type`` 也不覆盖。

覆盖 ``RobustOptimizeConfig`` / ``WalkForwardConfig`` 两个 API 入口的 config，
外加 ``OptimizeConfig``（walkforward 折内训练用）。三者都自带 ``strategy_id``
与 ``backtest_kwargs``，可共用同一套注入逻辑。
"""
from __future__ import annotations

import ast
import functools
import logging
from pathlib import Path

log = logging.getLogger(__name__)

_STRATEGY_SUBDIRS = ("custom", "ai", "composite")


def _declared_asset_types(data_dir: Path, strategy_id: str) -> list[str] | None:
    """Read META.asset_types from a strategy source file without executing it."""
    for sub in _STRATEGY_SUBDIRS:
        path = Path(data_dir) / "strategies" / sub / f"{strategy_id}.py"
        if not path.is_file():
            continue
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"))
        except Exception as exc:  # noqa: BLE001 — unreadable file must not break optimization
            log.warning("OPT_ASSET: parse failed %s: %s", path, exc)
            continue
        for node in tree.body:
            if not isinstance(node, ast.Assign):
                continue
            if not any(isinstance(t, ast.Name) and t.id == "META" for t in node.targets):
                continue
            if not isinstance(node.value, ast.Dict):
                continue
            # Only evaluate the value we need; other META entries may reference
            # module-level constants that ast.literal_eval cannot resolve.
            for key, value in zip(node.value.keys, node.value.values):
                if isinstance(key, ast.Constant) and key.value == "asset_types":
                    return [str(x) for x in ast.literal_eval(value)]
    return None


def _install_on(cls) -> None:
    if getattr(cls, "_tsp_opt_asset_patched", False):
        return
    original = cls.__init__

    @functools.wraps(original)
    def __init__(self, *args, **kwargs):
        original(self, *args, **kwargs)
        try:
            from app.config import settings

            bt = dict(self.backtest_kwargs or {})
            if "asset_type" in bt:  # caller explicitly chose one; never override
                return
            types = _declared_asset_types(settings.data_dir, self.strategy_id)
            if types and len(types) == 1 and "stock" not in types:
                bt["asset_type"] = types[0]
                self.backtest_kwargs = bt
                log.warning("OPT_ASSET: %s -> asset_type=%s", self.strategy_id, types[0])
        except Exception as exc:  # noqa: BLE001 — inference is best-effort
            log.warning("OPT_ASSET: inference skipped: %s", exc)

    cls.__init__ = __init__
    cls._tsp_opt_asset_patched = True


def install() -> None:
    from app.backtest.optimizer import OptimizeConfig
    from app.backtest.robust_optimizer import RobustOptimizeConfig
    from app.backtest.walkforward import WalkForwardConfig

    # OptimizeConfig 本身没有独立 API 路由, 但 walkforward 每折训练会在 worker
    # 里构造它 (backtest_kwargs={**cfg.backtest_kwargs, "mode": "position"})。
    # 一并覆盖可保证任何绕开主进程构造的路径也不会丢 asset_type。
    for cls in (RobustOptimizeConfig, WalkForwardConfig, OptimizeConfig):
        _install_on(cls)
    log.warning("OPT_ASSET: optimizer asset_type inference installed")
