#!/usr/bin/env python3
"""O23 · 自动环境闸门（用户 2026-11-19「1-5 全部开工」指令 ③④，五问方案 §4.1/§4.3 Step 3）。

大白话（点哪 → 发生什么 → 结果在哪看 → 出错怎么查）：
  监控引擎每轮行情更新会逐条评估 enabled 的策略监控规则并推送告警。原版
  不看市场环境——弱势行情照样推「追高型」策略信号。本补丁在评估每条
  type=strategy 规则前先过一道「环境闸门」：

    当日环境（最近收盘 regime 五档 → 三档：strong/range/weak）
      → 查映射表 data-local/user_data/regime_strategy_map.json
      → 该策略在该环境配的是 "off" → 静默跳过（不推信号）
      → "on" / 未配置 / default_action=allow → 照常评估

  映射表抄自《DS13策略环境适配矩阵成绩单-2026-11-19.html》（13 策略 ×
  strong/range/weak 实测回测），由 #246 人工闸门环节生成并逐项拍板。

安全退回（铁律，任何一步出问题 = 全部放行，绝不白屏/阻断）：
  - 映射表文件不存在 / JSON 解析失败 → 全放行 + REGIME_GATE_SKIPPED 日志
  - enabled=false（总开关关） → 全放行 + SKIPPED
  - regime 历史读不到 / 空 → 全放行 + SKIPPED
  - data_dir 未设置 → 全放行 + SKIPPED
  - 补丁内部任何异常 → 该条规则放行（原样评估），只记 WARNING
  - MonitorRuleEngine._evaluate_rule 不存在（上游升级改名） → 不安装补丁 +
    REGIME_GATE_PATCH_SKIPPED，监控照原版运行

升级兼容性：
  - 不碰镜像 / tag / digest / compose / upstream / 容器内 /app/app / /app/static。
  - 只读挂载卷 data-local/user_data/regime_strategy_map.json（O23 配置）与
    regime 历史 parquet（原生数据）；两处都不写。
  - 包装是 setattr 级（functools.wraps 幂等标记），比文本替换锚点稳：
    上游只要方法名不变就继续生效，方法消失即安全退回。
  - TSP_REGIME_GATE=0 或 overrides/regime_strategy_gate.disabled 一键关闭。

性能：
  - 映射表 300s TTL 缓存（读 JSON 很便宜，防高频 tick 重复 IO）。
  - regime 历史复用 app.services.regime_builder 自带的 mtime 签名缓存。
  - BLOCK/SKIPPED 日志按「规则 × 600s」节流，不会刷屏。
"""
from __future__ import annotations

import functools
import json
import logging
import os
import time
from pathlib import Path

log = logging.getLogger("tsp.override.regime_gate")

_ENV_OFF = "TSP_REGIME_GATE"
_DISABLE_FLAG = Path(__file__).with_name("regime_strategy_gate.disabled")

_MAP_FILENAME = "regime_strategy_map.json"
_MAP_TTL_SECONDS = 300.0
_LOG_EVERY_SECONDS = 600.0

# 五档 → 三档（与上游 mining_runtime._REGIME_FILTERS / 回测环境过滤同口径）
_STATE_TO_BUCKET = {
    "strong": "strong",
    "lean_strong": "strong",
    "range": "range",
    "lean_weak": "weak",
    "weak": "weak",
}

_map_cache: dict = {"sig": None, "at": 0.0, "data": None}
_last_log: dict[str, float] = {}


def _throttled_log(key: str, level, msg: str, *args) -> None:
    now = time.time()
    if now - _last_log.get(key, 0.0) < _LOG_EVERY_SECONDS:
        return
    _last_log[key] = now
    log.log(level, msg, *args)


def _load_map(data_dir: Path) -> dict | None:
    """读映射表（带 TTL+mtime 缓存）。返回 dict；不可用返回 None（=放行）。"""
    p = Path(data_dir) / "user_data" / _MAP_FILENAME
    try:
        stat = p.stat()
        sig = (str(p), stat.st_mtime_ns, stat.st_size)
    except OSError:
        _throttled_log("map_missing", logging.INFO,
                       "REGIME_GATE_SKIPPED: 映射表不存在(%s) → 全部放行", p)
        return None
    now = time.time()
    if _map_cache["sig"] == sig and now - _map_cache["at"] < _MAP_TTL_SECONDS:
        return _map_cache["data"]
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        _map_cache.update(sig=None, at=now, data=None)
        _throttled_log("map_bad", logging.WARNING,
                       "REGIME_GATE_SKIPPED: 映射表解析失败(%s: %s) → 全部放行", p, e)
        return None
    if not isinstance(data, dict):
        _map_cache.update(sig=None, at=now, data=None)
        _throttled_log("map_type", logging.WARNING,
                       "REGIME_GATE_SKIPPED: 映射表不是 JSON 对象 → 全部放行")
        return None
    _map_cache.update(sig=sig, at=now, data=data)
    return data


def _current_bucket(data_dir: Path) -> str | None:
    """最近收盘日 regime 状态 → 三档桶。读不到返回 None（=放行）。

    盘中 T 日的环境用最近收盘（T-1）值——与回测环境过滤的 T-1 对齐口径
    一致（防未来函数：今天的环境分今天 15:35 才算得出来）。
    """
    try:
        from app.services import regime_builder
        df = regime_builder.load_regime_history(Path(data_dir))
        if df is None or df.is_empty() or "state" not in df.columns:
            return None
        row = df.sort("date").tail(1)
        state = str(row.get_column("state").to_list()[-1])
        bucket = _STATE_TO_BUCKET.get(state)
        if bucket is None:
            _throttled_log("state_unknown", logging.WARNING,
                           "REGIME_GATE_SKIPPED: 未知环境状态 %r → 全部放行", state)
        return bucket
    except Exception as e:  # noqa: BLE001 — 任何异常都安全退回
        _throttled_log("regime_err", logging.WARNING,
                       "REGIME_GATE_SKIPPED: 环境历史读取失败(%s) → 全部放行", e)
        return None


def _gate_blocks(engine, rule: dict) -> bool:
    """该规则是否应被环境闸门拦截。任何不确定 = False（放行）。"""
    if rule.get("type") != "strategy":
        return False
    data_dir = getattr(engine, "_data_dir", None)
    if not data_dir:
        _throttled_log("no_ddir", logging.INFO,
                       "REGIME_GATE_SKIPPED: data_dir 未设置 → 全部放行")
        return False
    mapping_data = _load_map(Path(data_dir))
    if mapping_data is None:
        return False
    if mapping_data.get("enabled") is False:
        _throttled_log("disabled", logging.INFO,
                       "REGIME_GATE_SKIPPED: 映射表 enabled=false → 全部放行")
        return False
    bucket = _current_bucket(Path(data_dir))
    if bucket is None:
        return False
    mapping = mapping_data.get("mapping")
    if not isinstance(mapping, dict):
        return False
    default_action = str(mapping_data.get("default_action", "allow")).lower()
    sid = str(rule.get("strategy_id", ""))
    per = mapping.get(sid)
    if not isinstance(per, dict):
        return default_action == "block"
    action = str(per.get(bucket, "allow")).lower()
    if action == "off":
        _throttled_log(f"block:{sid}:{bucket}", logging.INFO,
                       "REGIME_GATE_BLOCK: %s 在 %s 环境配置为 off → 本轮不评估",
                       sid, bucket)
        return True
    return False


def install() -> None:
    if os.environ.get(_ENV_OFF) == "0" or _DISABLE_FLAG.exists():
        log.warning("REGIME_GATE_PATCH_SKIPPED: %s=0 或存在 regime_strategy_gate.disabled（人工关闭）", _ENV_OFF)
        return
    try:
        from app.strategy.monitor import MonitorRuleEngine
    except Exception as e:  # noqa: BLE001
        log.warning("REGIME_GATE_PATCH_SKIPPED: MonitorRuleEngine 不可用(%s) → 不安装", e)
        return
    original = getattr(MonitorRuleEngine, "_evaluate_rule", None)
    if original is None:
        log.warning("REGIME_GATE_PATCH_SKIPPED: _evaluate_rule 方法缺失（上游升级改名？）→ 不安装，监控按原版运行")
        return
    if getattr(original, "_tsp_regime_gate_patched", False):
        return

    @functools.wraps(original)
    def wrapper(self, df, rule, now):
        try:
            if _gate_blocks(self, rule):
                return []
        except Exception as e:  # noqa: BLE001 — 补丁自身异常绝不拖垮监控
            _throttled_log("internal", logging.WARNING,
                           "REGIME_GATE_ERROR(放行): %s", e)
        return original(self, df, rule, now)

    wrapper._tsp_regime_gate_patched = True
    MonitorRuleEngine._evaluate_rule = wrapper
    log.info("REGIME_GATE_PATCH_APPLIED: O23 环境闸门已安装（映射表 %s；缺表/坏表/开关关=全部放行）", _MAP_FILENAME)
