"""让偏好自动迁移生成的策略监控规则继承策略声明的 asset_type，并消除重复规则。

问题
----
``app/strategy/monitor_rules.py::migrate_strategy_monitors`` 会在两处被调用：
``app/main.py`` 启动时、``app/api/settings.py`` 保存实时监控偏好时。它对
``mr_strategy_{strategy_id}`` 规则做幂等 upsert，且每次都会把
``rule["enabled"] = True`` 写回：

- 新建规则时只给 normalize() 传 ``id/name/type/scope/...``，没传
  ``asset_type``；``normalize`` 的 ``setdefault("asset_type", "stock")``
  于是把 ETF 策略的监控规则写成 ``stock``。
- 已存在的规则走 ``rule = dict(rule)`` 分支，只 setdefault 少数几个字段，
  **不会**修正已经写错的 ``asset_type``。

后果：ETF 策略的监控规则用股票历史加载器评估，可能报错或产生错误告警；
单纯把规则停用/删除也不行 —— 下次启动或保存偏好时它会被重新生成并启用。

监控引擎 ``app/services/monitor.py`` 按 ``rule.asset_type == "etf"`` 选择
ETF 历史加载器（``app/main.py`` 里 ``set_history_loader_etf``），所以这一列
是实打实的取数口径，不只是展示字段。

策略
----
包装 ``migrate_strategy_monitors``，在原函数完成 upsert 之后：

1. 用 ``optimize_asset_fix._declared_asset_types`` 静态读策略源码的
   ``META.asset_types``（不执行策略代码）；只对「唯一且非 stock」的类型
   介入，内置股票策略保持上游默认行为。
2. 把 ``mr_strategy_*`` 权威规则的 ``asset_type`` 修正为声明值。
3. 把同一 ``strategy_id`` 下**手建的**其它 ``type=strategy`` 规则停用
   （``enabled=False``，不删除），避免双份告警；用户随时可再启用。
4. 返回修正后的规则列表，供调用方使用。

调用方在 migrate 之后都会 ``load_all() -> monitor_engine.set_rules()``，
所以修正后的规则会同步进内存，不需要额外 reload。整个过程 best-effort：
任何异常只记 WARNING 并返回原结果，不拖垮启动或偏好保存。

明确不做：不删除任何规则、不改 preferences、不放宽 source_policy、
不动 type!=strategy 的规则、不动非 ETF 策略的规则。
"""
from __future__ import annotations

import functools
import logging
from pathlib import Path

log = logging.getLogger(__name__)

STRATEGY_RULE_PREFIX = "mr_strategy_"


def install() -> None:
    from app.strategy import monitor_rules as mr
    from overrides.optimize_asset_fix import _declared_asset_types

    original = mr.migrate_strategy_monitors
    if getattr(original, "_tsp_monitor_asset_patched", False):
        return

    @functools.wraps(original)
    def wrapper(data_dir, strategy_ids, strategy_names):
        touched = original(data_dir, strategy_ids, strategy_names)
        try:
            ddir = Path(data_dir)
            wanted: dict[str, str] = {}
            for sid in strategy_ids or []:
                types = _declared_asset_types(ddir, sid)
                if types and len(set(types)) == 1 and types[0] != "stock":
                    wanted[sid] = types[0]
            if not wanted:
                return touched

            changed = 0
            for rule in mr.load_all(ddir):
                sid = rule.get("strategy_id")
                if rule.get("type") != "strategy" or sid not in wanted:
                    continue
                rid = str(rule.get("id", ""))
                is_auto = rid.startswith(STRATEGY_RULE_PREFIX)
                updated = dict(rule)
                dirty = False
                if is_auto:
                    if updated.get("asset_type") != wanted[sid]:
                        updated["asset_type"] = wanted[sid]
                        dirty = True
                elif updated.get("enabled") is not False:
                    updated["enabled"] = False
                    dirty = True
                if dirty:
                    mr.save_one(ddir, updated)
                    changed += 1
                    log.warning(
                        "MONITOR_STRATEGY_FIX: %s -> asset_type=%s enabled=%s",
                        rid, updated.get("asset_type"), updated.get("enabled"),
                    )

            fixed = []
            for rule in touched or []:
                sid = rule.get("strategy_id")
                if sid in wanted and str(rule.get("id", "")).startswith(STRATEGY_RULE_PREFIX):
                    rule = dict(rule)
                    rule["asset_type"] = wanted[sid]
                fixed.append(rule)
            if changed:
                log.warning("MONITOR_STRATEGY_FIX: %d rules corrected", changed)
            return fixed
        except Exception as exc:  # noqa: BLE001 — 修正失败不能阻断启动/偏好保存
            log.warning("MONITOR_STRATEGY_FIX failed (soft): %s", exc)
            return touched

    wrapper._tsp_monitor_asset_patched = True
    mr.migrate_strategy_monitors = wrapper
    log.warning("MONITOR_STRATEGY_FIX: installed")
