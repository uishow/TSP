#!/usr/bin/env python3
"""O26 · 触发记录清空前自动备份（2026-11-19 用户拍板ⓠ增强）。

大白话（点哪 → 发生什么 → 结果在哪看 → 出错怎么查）：
  监控页「清空触发记录」原版直接把 data-local/user_data/alerts.jsonl 写空，
  记录即刻消失且无处可查（上游 alert_store.clear 无备份）。
  本补丁在清空动作发生前自动把当前文件复制一份到
  data-local/user_data/alerts_backups/alerts_YYYYMMDD_HHMMSS.jsonl：

    点「清空」 → 备份当前记录（若非空） → 照常清空 → 页面列表清空
    结果在哪看：备份目录 alerts_backups/（保留最近 20 份，超出删最老）
    出错怎么查：日志 grep ALERT_BACKUP（SAVED=备份成功 / ERROR=备份失败
    但清空照常执行，绝不因备份失败卡住清空按钮）。

安全退回（铁律）：
  - alert_store 或 clear 函数不存在（上游升级改名）→ 不安装 +
    ALERT_BACKUP_PATCH_SKIPPED，清空按原版行为（无备份）
  - 备份自身任何异常（磁盘满/权限）→ 记 WARNING 后照常清空
  - TSP_ALERT_BACKUP=0 或 overrides/alerts_backup.disabled 一键关闭

升级兼容性：
  - 不碰镜像 / tag / digest / compose / upstream / 容器内文件。
  - setattr 级替换（幂等标记），函数消失即安全退回。
  - 只读 alerts.jsonl + 写挂载卷 alerts_backups/ 目录，不碰任何行情数据。
"""
from __future__ import annotations

import logging
import os
import shutil
import time
from pathlib import Path

log = logging.getLogger("tsp.override.alert_backup")

_ENV_OFF = "TSP_ALERT_BACKUP"
_DISABLE_FLAG = Path(__file__).with_name("alerts_backup.disabled")

_BACKUP_DIR_NAME = "alerts_backups"
_MAX_BACKUPS = 20          # 保留最近 20 份，超出删最老


def _backup_before_clear(data_dir) -> None:
    p = Path(data_dir) / "user_data" / "alerts.jsonl"
    if not p.exists():
        return
    try:
        size = p.stat().st_size
    except OSError:
        return
    if size <= 0:
        return  # 空文件无需备份
    n_lines = 0
    try:
        with p.open("r", encoding="utf-8") as f:
            n_lines = sum(1 for line in f if line.strip())
    except Exception:  # noqa: BLE001 — 数行数失败不拦备份
        pass
    if n_lines <= 0:
        return
    bdir = p.parent / _BACKUP_DIR_NAME
    bdir.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%d_%H%M%S")
    dst = bdir / f"alerts_{stamp}.jsonl"
    shutil.copy2(p, dst)  # copy2 保留原 mtime，便于对齐清空时刻
    # 超上限删最老（文件名即时间戳，字典序=时间序）
    try:
        backups = sorted(x.name for x in bdir.glob("alerts_*.jsonl"))
        for old in backups[: max(0, len(backups) - _MAX_BACKUPS)]:
            (bdir / old).unlink(missing_ok=True)
    except Exception:  # noqa: BLE001 — 清老备份失败不影响本次
        pass
    log.info("ALERT_BACKUP_SAVED: 清空前已备份 %d 条 → %s（保留最近 %d 份）",
             n_lines, dst, _MAX_BACKUPS)


def install() -> None:
    if os.environ.get(_ENV_OFF) == "0" or _DISABLE_FLAG.exists():
        log.warning("ALERT_BACKUP_PATCH_SKIPPED: %s=0 或存在 alerts_backup.disabled（人工关闭）", _ENV_OFF)
        return
    try:
        from app.services import alert_store
    except Exception as e:  # noqa: BLE001
        log.warning("ALERT_BACKUP_PATCH_SKIPPED: alert_store 不可用(%s) → 不安装", e)
        return
    original = getattr(alert_store, "clear", None)
    if original is None or not callable(original):
        log.warning("ALERT_BACKUP_PATCH_SKIPPED: clear 函数缺失（上游升级改名？）→ 不安装，清空按原版行为")
        return
    if getattr(original, "_tsp_alert_backup_patched", False):
        return

    def _patched_clear(data_dir):
        try:
            _backup_before_clear(data_dir)
        except Exception as e:  # noqa: BLE001 — 备份失败绝不拦清空
            log.warning("ALERT_BACKUP_ERROR(备份失败，清空照常): %s", e)
        return original(data_dir)

    _patched_clear._tsp_alert_backup_patched = True
    alert_store.clear = _patched_clear
    log.info("ALERT_BACKUP_PATCH_APPLIED: O26 已安装（清空前自动备份到 user_data/%s/，保留 %d 份）",
             _BACKUP_DIR_NAME, _MAX_BACKUPS)
