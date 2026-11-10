#!/usr/bin/env python3
"""大单监控数据服务(3021) 条件启停看门狗（用户 2026-11-10 指令 6）。

大白话：这个 3021 小服务不该一直开着。只有「你打开了 TSP 主网页」并且
「现在是 A 股交易时段」两个条件同时成立，才让它跑；其它时候自动关掉。

「主网页打开」怎么判断（近似，写在文档里）：看本机有没有进程正连着
127.0.0.1:3018 且连接还活着（ESTABLISHED）。浏览器开着 TSP 页面时，
页面会保持长连接（行情流 / keep-alive）；关掉页面连接就没了。
为避免连接一闪就误关，检测到之后给 3 分钟宽限。
需要强制常开时设 TSP_BIGORDER_FORCE=1。

交易时段：工作日 09:15–11:35 / 12:55–15:10（北京），含集合竞价与收盘前后
一点余量；节假日未接交易日历，属已知边界（文档如实标注）。

只动 runtime/ 里的状态文件和 PID，不改 TSP、不改镜像、不改移植包口径。
用法： .venv/bin/python scripts/bigorder_watchdog.py start|stop|status|once|run
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

ROOT = Path(__file__).resolve().parents[1]
RUN = ROOT / 'runtime'
# WorkBuddy 沙盒的 sitecustomize 对 mkdir(exist_ok=True) 会抛 FileExistsError,
# 先判存在再建；runtime/ 本来就是项目自带目录。
if not RUN.is_dir():
    RUN.mkdir(parents=True, exist_ok=True)
STATE = RUN / 'bigorder_watchdog.json'
LOG = RUN / 'bigorder_watchdog.log'
PID = RUN / 'bigorder_watchdog.pid'
MANAGE = ROOT / 'scripts' / 'bigorder_manage.py'
PY = ROOT / '.venv' / 'bin' / 'python'
CHECK_EVERY = 30
IDLE_GRACE = 180
BROWSER_HINTS = ('chrome', 'safari', 'edge', 'firefox', 'qqbrowser', 'browser', 'workbuddy')


def log(msg: str) -> None:
    line = f'{datetime.now().isoformat(timespec="seconds")} {msg}\n'
    with LOG.open('a', encoding='utf-8') as fh:
        fh.write(line)


def trading_now() -> tuple[bool, str]:
    now = datetime.now(ZoneInfo('Asia/Shanghai'))
    if now.weekday() >= 5:
        return False, '周末休市'
    hm = now.hour * 60 + now.minute
    if 9 * 60 + 15 <= hm <= 11 * 60 + 35 or 12 * 60 + 55 <= hm <= 15 * 60 + 10:
        return True, f'交易时段 {now:%H:%M}'
    return False, f'非交易时段 {now:%H:%M}'


def page_open() -> tuple[bool, str]:
    """近似判定：本机是否有到 3018 的存活连接。"""
    if os.environ.get('TSP_BIGORDER_FORCE') == '1':
        return True, '强制常开 TSP_BIGORDER_FORCE=1'
    try:
        out = subprocess.run(
            ['/usr/sbin/lsof', '-nP', '-iTCP:3018', '-sTCP:ESTABLISHED'],
            capture_output=True, text=True, timeout=8,
        ).stdout
    except Exception as exc:  # noqa: BLE001
        return False, f'连接探测不可用: {type(exc).__name__}'
    for line in out.splitlines()[1:]:
        parts = line.split()
        if not parts:
            continue
        cmd = parts[0].lower()
        # lsof 会把进程名截断 (com.docker.backend -> com.docke),
        # 必须一并排除, 否则 Docker 自身到 3018 的转发连接会被误判成「网页开着」。
        if 'docker' in cmd or cmd.startswith('com.doc') or cmd.startswith('vpnkit'):
            continue
        hint = '浏览器' if any(k in cmd for k in BROWSER_HINTS) else '客户端'
        return True, f'{hint}连着主站: {parts[0]}'
    return False, '没有客户端连着主站'


def service_running() -> bool:
    try:
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open('http://127.0.0.1:3021/health', timeout=2) as resp:
            return json.load(resp).get('status') == 'ok'
    except Exception:
        return False


def call(action: str) -> str:
    try:
        p = subprocess.run([str(PY), str(MANAGE), action], cwd=ROOT,
                           capture_output=True, text=True, timeout=40)
        return (p.stdout + p.stderr).strip()[-300:]
    except Exception as exc:  # noqa: BLE001
        return f'{type(exc).__name__}: {exc}'


def read_state() -> dict:
    try:
        return json.loads(STATE.read_text(encoding='utf-8'))
    except Exception:
        return {'last_seen': 0.0}


def tick() -> dict:
    trading, why_t = trading_now()
    opened, why_p = page_open()
    state = read_state()
    now = time.time()
    if opened:
        state['last_seen'] = now
    fresh = (now - float(state.get('last_seen') or 0)) < IDLE_GRACE
    want = bool(trading and (opened or fresh))
    running = service_running()
    action = '无操作'
    if want and not running:
        action = '启动 3021: ' + call('start')
        log(action)
    elif not want and running:
        action = '关闭 3021: ' + call('stop')
        log(action)
    state.update({
        'checked_at': datetime.now().isoformat(timespec='seconds'),
        'trading': trading, 'trading_reason': why_t,
        'page_open': opened, 'page_reason': why_p,
        'within_grace': fresh, 'want_running': want,
        'service_running': service_running(), 'last_action': action,
    })
    tmp = STATE.with_suffix('.tmp')
    tmp.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding='utf-8')
    tmp.replace(STATE)
    return state


def run_forever() -> None:
    log('WATCHDOG_START')
    while True:
        try:
            tick()
        except Exception as exc:  # noqa: BLE001
            log(f'WATCHDOG_TICK_ERROR: {type(exc).__name__}: {exc}')
        time.sleep(CHECK_EVERY)


def start() -> None:
    if PID.exists():
        try:
            os.kill(int(PID.read_text()), 0)
            print('Watchdog already running')
            return
        except OSError:
            PID.unlink()
    with LOG.open('a', encoding='utf-8') as fh:
        p = subprocess.Popen([str(PY), str(Path(__file__).resolve()), 'run'],
                             cwd=ROOT, stdin=subprocess.DEVNULL, stdout=fh,
                             stderr=fh, start_new_session=True)
    PID.write_text(str(p.pid))
    print(f'Watchdog started pid={p.pid}')


def stop() -> None:
    if not PID.exists():
        print('Watchdog not running')
        return
    try:
        os.kill(int(PID.read_text()), 15)
        print('Watchdog stopped')
    except OSError:
        print('Watchdog pid not alive')
    PID.unlink(missing_ok=True)


if __name__ == '__main__':
    action = sys.argv[1] if len(sys.argv) > 1 else 'status'
    if action == 'run':
        run_forever()
    elif action == 'start':
        start()
    elif action == 'stop':
        stop()
    elif action == 'once':
        print(json.dumps(tick(), ensure_ascii=False, indent=2))
    elif action == 'status':
        if PID.exists():
            try:
                os.kill(int(PID.read_text()), 0)
                alive = 'running'
            except OSError:
                alive = 'stale pid'
        else:
            alive = 'stopped'
        print(alive, json.dumps(read_state(), ensure_ascii=False))
    else:
        raise SystemExit('Usage: bigorder_watchdog.py start|stop|status|once|run')
