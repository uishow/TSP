"""交易日历兼容层 —— 宿主侧没有 tdxTSP 的 tqcenter 真实日历。

原 tdxTSP 的 limit_pool.py 只用到 is_trading_day(day) 一个函数，且只影响：
  1. 缓存 TTL（交易时段 2.5s / 非交易 30s）
  2. payload 的 in_session / stale 标记
不影响涨跌停事件本身（那些完全来自东财三池的真实返回）。

这里用「工作日近似 + 显式节假日表」降级。若宿主装有 tqcenter 也可用真实日历，
但绝不因为日历不可用而改变/编造涨跌停数据。
"""
from __future__ import annotations

from datetime import date


def is_trading_day(day: date) -> bool | None:
    """单日是否交易日：工作日近似（周一~周五）。返回 bool，不返回 None。

    节假日会近似成交易日，仅影响缓存刷新频率，不影响数据真实性。
    """
    try:
        return day.weekday() < 5
    except Exception:
        return None
