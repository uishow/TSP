#!/usr/bin/env python3
"""O25 · 监控规则保存的 timeframe 硬编码修复（2026-11-19 用户报障：禁用金三角报错）。

大白话（点哪 → 发生什么 → 结果在哪看 → 出错怎么查）：
  在监控中心对 type=strategy 的规则做任何保存（包括点「禁用」开关）时，
  上游 save_rule 一律用硬编码 timeframe='1d' 去引擎校验策略可用性。
  纯分钟级策略（META timeframes=['1m']，如金三角 ai_92e281c2）不支持
  '1d'，于是连禁用都会被 400 拒绝：

      strategy ai_92e281c2 does not support timeframe '1d'; supported=['1m']

  本补丁只针对这个保存路径放行该组合：改用策略自己声明的时间框架
  重建 context 复查（asset_type 资产类型校验保留原强度，不匹配照样
  拒绝）。其他调用方（回测 backtest/strategy.py、引擎内部执行链路
  engine.py）行为完全不变——拿 1d 数据回测 1m 策略仍会被正确拒绝。

放行判据（三个条件全部满足才放行，缺一即原样校验）：
  1. 直接调用方是 api/monitor_rules.py（保存路径，帧文件名判据）
  2. context.timeframe == '1d' 且策略声明的 timeframes 不含 '1d'
     （即只有「保存路径硬编码 1d × 策略纯分钟级」这一组合）
  3. 复查时 asset_type 不匹配仍会抛错（原函数校验）

安全退回（铁律，任何一步出问题 = 等价于未打补丁）：
  - StrategyEngine / validate_context 不存在（上游升级改名）→ 不安装 +
    MONITOR_TF_FIX_PATCH_SKIPPED，保存按原版行为
  - 补丁内部任何异常 → 直接调用原函数
  - TSP_MONITOR_TF_FIX=0 或 overrides/monitor_rule_tf_fix.disabled 一键关闭

升级兼容性：
  - 不碰镜像 / tag / digest / compose / upstream / 容器内文件。
  - setattr 级替换（幂等标记），方法消失即安全退回；帧判据只认
    monitor_rules.py 文件名，上游重构该文件时补丁自动失效退回原行为。

验证路径：
  - 重启后 docker logs 查 MONITOR_TF_FIX_PATCH_APPLIED
  - 监控页对金三角规则做「禁用」应成功（此前必 400）
  - 回测页用 1d 周期跑 1m 策略应仍被拒绝（校验未被放宽）
"""
from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

log = logging.getLogger("tsp.override.monitor_tf_fix")

_ENV_OFF = "TSP_MONITOR_TF_FIX"
_DISABLE_FLAG = Path(__file__).with_name("monitor_rule_tf_fix.disabled")

_ALLOW_LOG_EVERY_SECONDS = 600.0
_last_allow_log: dict[str, float] = {}


def _throttled_allow_log(sid: str) -> None:
    """放行日志按策略节流（保存不频繁，双保险防刷屏）。"""
    import time
    now = time.time()
    if now - _last_allow_log.get(sid, 0.0) < _ALLOW_LOG_EVERY_SECONDS:
        return
    _last_allow_log[sid] = now
    log.info("MONITOR_TF_FIX_ALLOW: 保存路径放行分钟级策略 %s（timeframe 校验改用其声明值，asset_type 仍严格校验）", sid)


def install() -> None:
    if os.environ.get(_ENV_OFF) == "0" or _DISABLE_FLAG.exists():
        log.warning("MONITOR_TF_FIX_PATCH_SKIPPED: %s=0 或存在 monitor_rule_tf_fix.disabled（人工关闭）", _ENV_OFF)
        return
    try:
        from app.strategy.engine import StrategyEngine
    except Exception as e:  # noqa: BLE001
        log.warning("MONITOR_TF_FIX_PATCH_SKIPPED: StrategyEngine 不可用(%s) → 不安装", e)
        return
    original = getattr(StrategyEngine, "validate_context", None)
    if original is None:
        log.warning("MONITOR_TF_FIX_PATCH_SKIPPED: validate_context 方法缺失（上游升级改名？）→ 不安装")
        return
    # staticmethod 经类属性访问已解包为普通函数；双保险取 __func__
    original_func = getattr(original, "__func__", original)
    if getattr(original_func, "_tsp_monitor_tf_patched", False):
        return

    def _patched(strategy, context):
        try:
            meta = getattr(strategy, "meta", None) or {}
            timeframes = list(meta.get("timeframes") or ["1d"])
            if (
                context.timeframe == "1d"
                and "1d" not in timeframes
            ):
                # 仅监控规则保存路径放行（帧文件名判据）
                frame = sys._getframe(1)
                if str(frame.f_code.co_filename).rsplit("/", 1)[-1] == "monitor_rules.py":
                    sid = str(meta.get("id", "?"))
                    from app.strategy.engine import StrategyDataContext
                    retry = StrategyDataContext(
                        asset_type=context.asset_type,
                        timeframe=timeframes[0],
                        as_of=context.as_of,
                    )
                    _throttled_allow_log(sid)
                    return original_func(strategy, retry)
        except Exception as e:  # noqa: BLE001 — 补丁自身异常绝不拖垮校验
            log.warning("MONITOR_TF_FIX_ERROR(回退原校验): %s", e)
        return original_func(strategy, context)

    _patched._tsp_monitor_tf_patched = True
    StrategyEngine.validate_context = staticmethod(_patched)
    log.info("MONITOR_TF_FIX_PATCH_APPLIED: O25 已安装（仅监控保存路径放行分钟级策略；回测/引擎校验不变）")
