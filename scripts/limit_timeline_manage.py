#!/usr/bin/env python3
"""涨跌停时间轴数据服务（:3023）的启动 / 停止 / 状态。

与 scripts/anomaly_manage.py 同款写法：进程独立、日志与 PID 落 runtime/，
不改 TSP 容器、不改镜像、不参与 TSP 启动链路，随时可停可删。

上游是东财 push2ex 公开接口（无鉴权）。实测宿主直连可达，长驻进程显式
清掉代理环境变量避免继承沙盒失效代理（见项目记忆「代理坑」）。

用法：
    .venv/bin/python scripts/limit_timeline_manage.py start|stop|status
"""
import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUN = ROOT / "runtime"
if not RUN.is_dir():
    RUN.mkdir()
SERVICE_DIR = ROOT / "services" / "limit_timeline"
PID = RUN / "limit_timeline.pid"
PORT = 3023
SERVICE_NAME = "limit-timeline-adapter"


def environment() -> dict[str, str]:
    env = dict(os.environ)
    # 上游东财必须直连：清掉所有代理变量，避免继承沙盒 52132 等失效代理。
    for key in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"):
        env.pop(key, None)
    # 只让本地回环直连（本机前端/健康检查用），无需代理。
    env["NO_PROXY"] = "127.0.0.1,localhost"
    env["no_proxy"] = env["NO_PROXY"]
    return env


def healthy() -> bool:
    try:
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(f"http://127.0.0.1:{PORT}/health", timeout=2) as response:
            payload = json.load(response)
            return payload.get("service") == SERVICE_NAME
    except Exception:
        return False


def start() -> None:
    if healthy():
        print(f"涨跌停时间轴服务已在运行 (127.0.0.1:{PORT})")
        return
    with (RUN / "limit_timeline.log").open("ab") as log:
        process = subprocess.Popen(
            [
                str(ROOT / ".venv/bin/python"),
                "-m",
                "uvicorn",
                "app.main:app",
                "--host",
                "127.0.0.1",
                "--port",
                str(PORT),
                "--no-access-log",
            ],
            cwd=SERVICE_DIR,
            env=environment(),
            stdin=subprocess.DEVNULL,
            stdout=log,
            stderr=log,
            start_new_session=True,
        )
    PID.write_text(str(process.pid))
    for _ in range(30):
        if healthy():
            print(f"涨跌停时间轴服务已就绪：http://127.0.0.1:{PORT}/health  (pid={process.pid})")
            return
        if process.poll() is not None:
            raise RuntimeError("数据服务启动失败，请看 runtime/limit_timeline.log")
        time.sleep(0.5)
    raise RuntimeError("数据服务启动超时，请看 runtime/limit_timeline.log")


def stop() -> None:
    if not PID.exists():
        print("没有记录到运行中的进程")
        return
    pid = int(PID.read_text())
    try:
        os.kill(pid, 0)
    except OSError:
        print("记录的进程已不在运行；未停止任何进程")
        PID.unlink(missing_ok=True)
        return
    if not healthy():
        print("健康检查未通过，拒绝向未核实的 PID 发信号")
        return
    os.kill(pid, 15)
    for _ in range(50):
        if not healthy():
            break
        time.sleep(0.1)
    else:
        raise RuntimeError("进程未停止，拒绝冲突重启")
    PID.unlink(missing_ok=True)
    print("涨跌停时间轴服务已停止")


def main() -> None:
    action = sys.argv[1] if len(sys.argv) > 1 else "status"
    if action == "start":
        start()
    elif action == "stop":
        stop()
    elif action == "status":
        print("running" if healthy() else "stopped")
    else:
        raise SystemExit("Usage: limit_timeline_manage.py start|stop|status")


if __name__ == "__main__":
    main()
