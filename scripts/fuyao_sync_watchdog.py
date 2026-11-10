#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""fuyao 特色数据「打开 TSP 页面就同步」看门狗（用户 2026-11-10 指令 9）。

大白话（点哪→发生什么→结果在哪看→出错怎么查）：
  你打开 TSP 主网页（127.0.0.1:3018）时，本看门狗自动在宿主机跑一次
  scripts/fuyao_recap_sync.py，把龙虎榜 / 竞价风向标最新数据拉到本地快照
  （data-local/fuyao/recap/）。这样复盘页和异动页在你用的时候总是最新的，
  不用手动去跑那个脚本。
  「页面打开」怎么判断（近似）：看本机有没有进程正连着 127.0.0.1:3018 且连接
  还活着（ESTABLISHED）—— 浏览器开着 TSP 页面会保持长连接，关掉就没了。
  为避免频繁联网，距上次成功同步不足 6 小时（或距上次触发不足 30 分钟）就只探测
  不联网；设 TSP_FUYAO_SYNC_FORCE=1 可强制每次都同步。

升级兼容性（用户原问「如果 TSP 版本升级会不会失效」）：
  本看门狗是**宿主**侧脚本，fuyao 快照也在镜像之外；TSP 升级只换 3018 容器镜像，
  不碰这两个东西。最坏情况是：若新版改变复盘页端点 / 字段，按 docs 重核契约，
  fuyao 页干净降级（主功能不受影响），看门狗本身照常。结论：**不会因升级失效**。

边界（铁律）：
  - 只动 runtime/ 状态文件，并调用脚本 fuyao_recap_sync.py；不改 TSP、不改镜像。
  - Key 只在 runtime/fuyao.env（600，不挂载进容器），本脚本不读取、不打印、不复制。
  - 触发失败不影响主站，下次探测再试。

用法： .venv/bin/python scripts/fuyao_sync_watchdog.py start|stop|status|once|run
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.request
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
RUN = ROOT / "runtime"
if not RUN.is_dir():
    RUN.mkdir(parents=True, exist_ok=True)
STATE = RUN / "fuyao_sync_watchdog.json"
LOG = RUN / "fuyao_sync_watchdog.log"
PID = RUN / "fuyao_sync_watchdog.pid"
RECAP_SYNC = ROOT / "scripts" / "fuyao_recap_sync.py"
PY = ROOT / ".venv" / "bin" / "python"
CHECK_EVERY = 30
COOLDOWN_SYNC_HOURS = 6.0      # 距上次成功同步不足这么久，不联网
MIN_TRIGGER_GAP_MIN = 30       # 两次触发最小间隔
BROWSER_HINTS = ("chrome", "safari", "edge", "firefox", "qqbrowser", "browser", "workbuddy")


def log(msg: str) -> None:
    line = f"{datetime.now().isoformat(timespec='seconds')} {msg}\n"
    with LOG.open("a", encoding="utf-8") as fh:
        fh.write(line)


def page_open() -> tuple[bool, str]:
    """近似判定：本机是否有到 3018 的存活连接（同 bigorder_watchdog）。"""
    if os.environ.get("TSP_FUYAO_SYNC_FORCE") == "1":
        return True, "强制同步 TSP_FUYAO_SYNC_FORCE=1"
    try:
        out = subprocess.run(
            ["/usr/sbin/lsof", "-nP", "-iTCP:3018", "-sTCP:ESTABLISHED"],
            capture_output=True, text=True, timeout=8,
        ).stdout
    except Exception as exc:  # noqa: BLE001
        return False, f"连接探测不可用: {type(exc).__name__}"
    for line in out.splitlines()[1:]:
        parts = line.split()
        if not parts:
            continue
        cmd = parts[0].lower()
        if "docker" in cmd or cmd.startswith("com.doc") or cmd.startswith("vpnkit"):
            continue
        hint = "浏览器" if any(k in cmd for k in BROWSER_HINTS) else "客户端"
        return True, f"{hint}连着主站: {parts[0]}"
    return False, "没有客户端连着主站"


def _last_success_sync() -> float:
    p = ROOT / "data-local" / "fuyao" / "recap" / "latest.json"
    if not p.is_file():
        return 0.0
    try:
        stamp = json.loads(p.read_text(encoding="utf-8")).get("synced_at") or ""
        return datetime.fromisoformat(stamp).timestamp()
    except (OSError, ValueError):
        return 0.0


def read_state() -> dict:
    try:
        return json.loads(STATE.read_text(encoding="utf-8"))
    except Exception:
        return {"last_trigger": 0.0}


def _trigger_sync() -> str:
    try:
        p = subprocess.run(
            [str(PY), str(RECAP_SYNC), "--days", "5"],
            cwd=ROOT, capture_output=True, text=True, timeout=120,
        )
        tail = (p.stdout + p.stderr).strip()[-400:]
        if p.returncode == 0:
            return "同步成功: " + tail
        return f"同步失败(rc={p.returncode}): " + tail
    except Exception as exc:  # noqa: BLE001
        return f"{type(exc).__name__}: {exc}"


def tick() -> dict:
    opened, why_p = page_open()
    state = read_state()
    now = time.time()
    last_sync = _last_success_sync()
    last_trigger = float(state.get("last_trigger") or 0)
    force = os.environ.get("TSP_FUYAO_SYNC_FORCE") == "1"

    cooldown_ok = (now - last_sync) >= COOLDOWN_SYNC_HOURS * 3600
    gap_ok = (now - last_trigger) >= MIN_TRIGGER_GAP_MIN * 60
    want = bool(opened and (force or (cooldown_ok and gap_ok)))
    action = "无操作"
    if want:
        action = "触发 fuyao 同步: " + _trigger_sync()
        state["last_trigger"] = now
        log(action)
    state.update({
        "checked_at": datetime.now().isoformat(timespec="seconds"),
        "page_open": opened, "page_reason": why_p,
        "last_success_sync": datetime.fromtimestamp(last_sync).isoformat(timespec="seconds") if last_sync else None,
        "cooldown_ok": cooldown_ok, "gap_ok": gap_ok,
        "want_sync": want, "last_action": action,
    })
    tmp = STATE.with_suffix(".tmp")
    tmp.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(STATE)
    return state


def run_forever() -> None:
    log("WATCHDOG_START")
    while True:
        try:
            tick()
        except Exception as exc:  # noqa: BLE001
            log(f"WATCHDOG_TICK_ERROR: {type(exc).__name__}: {exc}")
        time.sleep(CHECK_EVERY)


def start() -> None:
    if PID.exists():
        try:
            os.kill(int(PID.read_text()), 0)
            print("Watchdog already running")
            return
        except OSError:
            PID.unlink()
    with LOG.open("a", encoding="utf-8") as fh:
        p = subprocess.Popen([str(PY), str(Path(__file__).resolve()), "run"],
                             cwd=ROOT, stdin=subprocess.DEVNULL, stdout=fh,
                             stderr=fh, start_new_session=True)
    PID.write_text(str(p.pid))
    print(f"fuyao 同步看门狗已启动 pid={p.pid}（打开 TSP 页面即自动同步；--days 5）")


def stop() -> None:
    if not PID.exists():
        print("Watchdog not running")
        return
    try:
        os.kill(int(PID.read_text()), 15)
        print("fuyao 同步看门狗已停止")
    except OSError:
        print("pid not alive")
    PID.unlink(missing_ok=True)


if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "status"
    if action == "run":
        run_forever()
    elif action == "start":
        start()
    elif action == "stop":
        stop()
    elif action == "once":
        print(json.dumps(tick(), ensure_ascii=False, indent=2))
    elif action == "status":
        if PID.exists():
            try:
                os.kill(int(PID.read_text()), 0)
                alive = "running"
            except OSError:
                alive = "stale pid"
        else:
            alive = "stopped"
        print(alive, json.dumps(read_state(), ensure_ascii=False))
    else:
        raise SystemExit("Usage: fuyao_sync_watchdog.py start|stop|status|once|run")
