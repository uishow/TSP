"""简单均线交叉策略 — TSP matrix_native 演示策略

演示用途 (对应「写一个简单的策略并跑回测」):
  5 日均线上穿 20 日均线 → 金叉买入; 下穿 → 死叉卖出。
  严格只用 <= t 的收盘价计算均线, 不读任何未来数据 (无未来函数)。
  日频, 作用于 ETF 池 (与本地已同步的 52 只 ETF 对齐, 保证有数据)。
"""

import numpy as np

from app.backtest.matrix import (
    MarketDataMatrix,
    SignalMatrix,
    make_signal_matrix,
)

META = {
    "id": "custom_simple_ma_cross",
    "name": "演示·均线交叉(5/20)",
    "description": "5日与20日均线金叉买入、死叉卖出；仅用历史收盘价，无未来函数。",
    "tags": ["ETF", "均线", "演示", "日频"],
    "asset_types": ["etf"],
    "timeframes": ["1d"],
    # 声明可寻优参数, 供稳健优化 / walk-forward 的参数勾选与网格搜索使用。
    # compute_signals 已按 fast_period / slow_period 取参, 此处仅为暴露可调范围。
    "params": [
        {
            "id": "fast_period",
            "label": "快线周期(天)",
            "type": "int",
            "default": 5,
            "min": 3,
            "max": 20,
            "step": 1,
        },
        {
            "id": "slow_period",
            "label": "慢线周期(天)",
            "type": "int",
            "default": 20,
            "min": 10,
            "max": 60,
            "step": 5,
        },
    ],
}

EXECUTION_BACKEND = "matrix_native"
ENTRY_SIGNALS = ["ma_golden_cross"]
EXIT_SIGNALS = ["ma_death_cross"]
LOOKBACK_DAYS = 20
REQUIRED_FEATURES = ["close"]


def _sma(close, period):
    """等权滑动均值, 仅用 <= t 的数据, 无未来函数。"""
    rows, cols = close.shape
    out = np.full((rows, cols), np.nan, dtype=np.float64)
    for t in range(period - 1, rows):
        out[t] = np.nanmean(close[t - period + 1:t + 1, :], axis=0)
    return out


class SimpleMaCrossMatrixStrategy:
    def required_fields(self):
        return frozenset({"close"})

    def required_warmup_bars(self, params):
        fast = int(params.get("fast_period", 5))
        slow = int(params.get("slow_period", 20))
        return max(slow + 1, 60)

    def compute_signals(self, market: MarketDataMatrix, params: dict) -> SignalMatrix:
        close = np.asarray(market.close, dtype=np.float64)
        rows, cols = close.shape
        fast = int(params.get("fast_period", 5))
        slow = int(params.get("slow_period", 20))

        price = np.where(np.isfinite(close) & (close > 0), close, np.nan)
        ma_fast = _sma(price, fast)
        ma_slow = _sma(price, slow)

        # 金叉: fast 上穿 slow; 死叉: fast 下穿 slow (均按 t 对齐)
        prev_fast = np.roll(ma_fast, 1, axis=0)
        prev_slow = np.roll(ma_slow, 1, axis=0)
        golden = (ma_fast > ma_slow) & (prev_fast <= prev_slow) & np.isfinite(ma_slow)
        death = (ma_fast < ma_slow) & (prev_fast >= prev_slow) & np.isfinite(ma_slow)

        entry = golden.astype(np.uint8)
        exit_ = death.astype(np.uint8)

        # 评分: 快慢均线偏离度, 让引擎在多个金叉里挑最强趋势标的
        with np.errstate(divide="ignore", invalid="ignore"):
            score = (ma_fast - ma_slow) / np.where(
                np.isfinite(ma_slow) & (ma_slow > 0), ma_slow, np.nan
            )
        score = np.nan_to_num(score, nan=0.0, posinf=0.0, neginf=0.0)

        return make_signal_matrix(
            market.shape,
            entry=entry,
            exit=exit_,
            score=score.astype(np.float32),
            entry_signal_code=np.where(entry, 0, -1).astype(np.int16),
            exit_signal_code=np.where(exit_, 0, -1).astype(np.int16),
            entry_signal_ids=("ma_golden_cross",),
            exit_signal_ids=("ma_death_cross",),
        )


MATRIX_STRATEGY = SimpleMaCrossMatrixStrategy()
