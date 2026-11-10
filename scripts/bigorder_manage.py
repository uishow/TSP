#!/usr/bin/env python3
"""大单监控数据服务（:3021）的启动 / 停止 / 状态。

与 scripts/manage.py（bridge :7818）同款写法：进程独立、日志与 PID 落 runtime/，
不改 TSP 容器、不改镜像、不参与 TSP 启动链路，随时可停可删。

用法：
    .venv/bin/python scripts/bigorder_manage.py start|stop|status
"""
import json, os, subprocess, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUN = ROOT / 'runtime'
if not RUN.is_dir():
    RUN.mkdir()
ADAPTER_DIR = ROOT / 'services' / 'bigorder_adapter'
DATA_DIR = RUN / 'bigorder-data'
PID = RUN / 'bigorder_adapter.pid'
PORT = 3021


def environment():
    env = dict(os.environ)
    # 封单/竞价采样文件是运行产物，统一放 runtime/（已被 .gitignore 忽略）。
    for sub in ('大单提醒', '封单'):
        (DATA_DIR / sub).mkdir(parents=True, exist_ok=True)
    env['BIGORDER_DATA_DIR'] = str(DATA_DIR)
    # 这个服务是长驻进程，启动时继承的沙盒 HTTP(S)_PROXY 端口会随会话变化；
    # 端口一失效，所有对外请求立刻变成 "All connection attempts failed"（HTTP 502），
    # 而同一时刻从新窗口直连行情站是正常的。数据服务只访问两个公开行情站，
    # 让它们显式直连即可；其它代理设置原样保留，不改全局、不碰上游代码。
    hosts = ('push2.eastmoney.com', 'd.10jqka.com.cn', '127.0.0.1', 'localhost')
    no_proxy = [x.strip() for x in (env.get('NO_PROXY') or '').split(',') if x.strip()]
    for h in hosts:
        if h not in no_proxy:
            no_proxy.append(h)
    env['NO_PROXY'] = ','.join(no_proxy)
    env['no_proxy'] = env['NO_PROXY']
    return env


def healthy():
    try:
        op = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with op.open(f'http://127.0.0.1:{PORT}/health', timeout=2) as r:
            return json.load(r).get('service') == 'big-order-adapter'
    except Exception:
        return False


def start():
    if healthy():
        print(f'大单监控数据服务已在运行 (127.0.0.1:{PORT})')
        return
    with (RUN / 'bigorder_adapter.log').open('ab') as log:
        p = subprocess.Popen(
            [str(ROOT / '.venv/bin/python'), '-m', 'uvicorn', 'app.main:app',
             '--host', '127.0.0.1', '--port', str(PORT), '--no-access-log'],
            cwd=ADAPTER_DIR, env=environment(), stdin=subprocess.DEVNULL,
            stdout=log, stderr=log, start_new_session=True,
        )
    PID.write_text(str(p.pid))
    for _ in range(30):
        if healthy():
            print(f'大单监控数据服务已就绪：http://127.0.0.1:{PORT}/health  (pid={p.pid})')
            return
        if p.poll() is not None:
            raise RuntimeError('数据服务启动失败，请看 runtime/bigorder_adapter.log')
        time.sleep(.5)
    raise RuntimeError('数据服务启动超时，请看 runtime/bigorder_adapter.log')


def stop():
    if not PID.exists():
        print('没有记录到运行中的进程')
        return
    pid = int(PID.read_text())
    try:
        os.kill(pid, 0)
    except OSError:
        print('记录的进程已不在运行；未停止任何进程')
        PID.unlink(missing_ok=True)
        return
    if not healthy():
        print('健康检查未通过，拒绝向未核实的 PID 发信号')
        return
    os.kill(pid, 15)
    for _ in range(50):
        if not healthy():
            break
        time.sleep(.1)
    else:
        raise RuntimeError('进程未停止，拒绝冲突重启')
    PID.unlink(missing_ok=True)
    print('大单监控数据服务已停止')


if __name__ == '__main__':
    action = sys.argv[1] if len(sys.argv) > 1 else 'status'
    if action == 'start':
        start()
    elif action == 'stop':
        stop()
    elif action == 'status':
        print('running' if healthy() else 'stopped')
    else:
        raise SystemExit('Usage: bigorder_manage.py start|stop|status')
