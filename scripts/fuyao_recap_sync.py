#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""宿主侧同步 fuyao（同花顺）特色数据：龙虎榜三榜 + 竞价短线风向标。

给谁用 / 解决什么：
  复盘页的「龙虎榜」和异动监控页的「竞价异动」原本提示「数据源未配置」，
  因为容器里零外联、只准用 local_quant 一个数据源。本脚本在**宿主机**持 Key
  把两类特色数据拉下来，存成普通 JSON 快照；容器里的
  overrides/fuyao_recap.py 只读这些快照，Key 不进容器、主数据源不变。

安全边界（必须保持）：
  - Key 只从环境变量 FUYAO_API_KEY 或 runtime/fuyao.env（权限 600）读取，
    绝不打印、绝不写进 data-local/、绝不进 Git（runtime/ 与 data-local/* 已被忽略）。
  - 不写 .env（compose 的 env_file，会注入容器），不写 user_data/secrets.json
    （该目录挂载进容器）。与 docs/fuyao-offline.md 的既有约定一致。
  - 只用标准库，任何宿主 Python 都能跑；沙盒代理用 ProxyHandler({}) 显式绕过。

数据口径（不能改）：
  - 只按接口返回的**真实** trade_date / date 落盘，绝不按请求日期落盘。
    避免把「当日榜单还没发布」的空榜、或未来数据伪装成历史数据。
  - 当日 0 行（榜单未发布）不落盘，让上游自带的 fallback_prev 回退到
    上一交易日，页面会显示「已回退上一期」而不是空白或伪造数字。
  - 龙虎榜三榜必须同日且都有内容才落盘（上游 _fetch_boards 的整日失败语义）。

用法（在项目根目录）：
  .venv/bin/python scripts/fuyao_recap_sync.py                # 补最近 5 个交易日
  .venv/bin/python scripts/fuyao_recap_sync.py --days 20      # 补最近 20 个交易日
  .venv/bin/python scripts/fuyao_recap_sync.py --date 2026-11-07
  .venv/bin/python scripts/fuyao_recap_sync.py --force        # 已有快照也重拉
  .venv/bin/python scripts/fuyao_recap_sync.py --dry-run      # 只看计划，不联网不写盘
  .venv/bin/python scripts/fuyao_recap_sync.py --loop         # 可选：常驻自动刷新（默认不开）

升级兼容性：
  本脚本不碰镜像、不改 compose、不写容器内随镜像分发的文件；产物只是一份
  本地 JSON 快照。TSP 升级后只要 /app/data 挂载还在，快照照常可读。
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KEY_FILE = ROOT / "runtime" / "fuyao.env"
KEY_ENV = "FUYAO_API_KEY"
OUT = ROOT / "data-local" / "fuyao" / "recap"
KDAILY = ROOT / "data-local" / "kline_daily"

BASE = "https://fuyao.aicubes.cn"
DRAGON_PATH = "/api/a-share/special-data/dragon-tiger-list"
BENCH_PATH = "/api/a-share/auction/short-term-benchmark"
BOARDS = ("all", "org", "hot_money")
DATE_DIR_RE = re.compile(r"^date=(\d{4}-\d{2}-\d{2})$")
DATE_FILE_RE = re.compile(r"^date=(\d{4}-\d{2}-\d{2})\.json$")


# ---------------------------------------------------------------- Key / 网络

def load_api_key(explicit: str | None = None) -> tuple[str, str]:
    """返回 (key, 来源标签)。函数签名与 bridge/fuyao_offline.py 一致，绝不回显 Key。"""
    if explicit:
        return explicit.strip(), "命令行参数"
    value = os.environ.get(KEY_ENV, "").strip()
    if value:
        return value, "环境变量"
    if KEY_FILE.is_file():
        for line in KEY_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith(KEY_ENV + "=") and not line.startswith("#"):
                candidate = line.split("=", 1)[1].strip().strip('"').strip("'")
                if candidate:
                    return candidate, "本机文件:" + KEY_FILE.name
    raise RuntimeError(
        "没找到 fuyao Key。请设置环境变量 %s，或写入 %s（chmod 600）。"
        % (KEY_ENV, KEY_FILE)
    )


def make_opener():
    """显式不使用系统/沙盒代理，避免长驻会话里代理端口漂移造成 502。"""
    return urllib.request.build_opener(urllib.request.ProxyHandler({}))


def api_get(opener, key: str, path: str, params: dict | None = None,
            retries: int = 2) -> dict:
    """GET + 信封解包，返回响应里的 data 容器。异常信息里绝不含 Key。"""
    url = BASE + path + ("?" + urllib.parse.urlencode(params) if params else "")
    last: Exception | None = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(
                url, headers={"X-api-key": key, "Accept": "application/json"}
            )
            with opener.open(req, timeout=25) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            code = payload.get("code")
            if code not in (0, "0", None):
                raise RuntimeError(
                    "接口返回 code=%s message=%s" % (code, payload.get("message"))
                )
            data = payload.get("data") or {}
            if not isinstance(data, dict):
                raise RuntimeError("响应 data 不是对象")
            return data
        except Exception as exc:  # noqa: BLE001 — 重试后如实抛出
            last = RuntimeError("%s: %s" % (type(exc).__name__, str(exc)[:160]))
            if attempt < retries:
                time.sleep(1.0 + attempt)
    raise last  # type: ignore[misc]


# ---------------------------------------------------------------- 拉取 / 落盘

def fetch_dragon(opener, key: str, date_iso: str | None) -> tuple[dict | None, str]:
    """按某个请求日期拉三榜；返回 (快照对象, 说明)。当日未发布返回 (None, 原因)。"""
    boards: dict[str, dict] = {}
    for bt in BOARDS:
        params = {"board_type": bt}
        if date_iso:
            params["date"] = date_iso
        boards[bt] = api_get(opener, key, DRAGON_PATH, params)

    real_dates = {bt: str(d.get("trade_date") or "") for bt, d in boards.items()}
    if not real_dates["all"] or len(set(real_dates.values())) != 1:
        return None, "三榜日期不一致 " + json.dumps(real_dates, ensure_ascii=False)
    real = real_dates["all"]

    total = sum(
        len(d.get("stock_items") or []) + len(d.get("hot_money_items") or [])
        for d in boards.values()
    )
    if total == 0:
        return None, real + " 榜单尚未发布(0 行)，按规矩不落盘"
    return {
        "_meta": {
            "synced_at": datetime.now().isoformat(timespec="seconds"),
            "requested_date": date_iso or "(接口默认最新)",
            "kind": "dragon_tiger",
        },
        "trade_date": real,
        "rows": total,
        "boards": boards,
    }, "ok " + real + " 三榜共 " + str(total) + " 行"


def fetch_benchmark(opener, key: str, date_iso: str | None) -> tuple[dict | None, str]:
    params = {"date": date_iso} if date_iso else None
    data = api_get(opener, key, BENCH_PATH, params)
    real = str(data.get("date") or "")
    items = data.get("item") or []
    if not real or not items:
        return None, "竞价名单为空或没有日期字段"
    return {
        "_meta": {
            "synced_at": datetime.now().isoformat(timespec="seconds"),
            "requested_date": date_iso or "(接口默认最新)",
            "kind": "auction_benchmark",
        },
        "date": real,
        "rows": len(items),
        "data": data,
    }, "ok " + real + " " + str(len(items)) + " 只"


def atomic_write_json(path: Path, obj: dict) -> None:
    """先写 .part 再原子替换，避免容器读到半个文件；失败保留旧快照。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".part")
    tmp.write_text(
        json.dumps(obj, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    tmp.replace(path)


def local_trading_days(n: int) -> list[str]:
    """本地已有日K分区 = 已知交易日集合；取最近 n 个。"""
    days: list[str] = []
    try:
        for p in KDAILY.iterdir():
            m = DATE_DIR_RE.match(p.name)
            if p.is_dir() and m:
                days.append(m.group(1))
    except OSError:
        pass
    return sorted(days)[-n:]


def write_latest(notes: list[str]) -> dict:
    """生成 latest.json：容器内 provider 靠它判断「快照是否就绪 / 最新是哪天」。"""
    def scan(sub: str, kind: str) -> dict:
        folder = OUT / sub
        rows: dict[str, int] = {}
        if folder.is_dir():
            for p in folder.glob("date=*.json"):
                m = DATE_FILE_RE.match(p.name)
                if not m:
                    continue
                try:
                    obj = json.loads(p.read_text(encoding="utf-8"))
                    rows[m.group(1)] = int(obj.get("rows") or 0)
                except (OSError, ValueError):
                    continue
        dates = sorted(d for d, n in rows.items() if n > 0)
        return {
            "latest_date": dates[-1] if dates else None,
            "dates": dates,
            "rows_by_date": rows,
        }

    latest = {
        "synced_at": datetime.now().isoformat(timespec="seconds"),
        "description": "fuyao 同花顺特色数据本地快照（宿主持 Key 拉取，容器只读，不含 Key）",
        "dragon_tiger": scan("dragon_tiger", "dragon"),
        "auction_benchmark": scan("auction_benchmark", "benchmark"),
        "notes": notes[-20:],
    }
    atomic_write_json(OUT / "latest.json", latest)
    return latest


# ---------------------------------------------------------------- 主流程

def sync_once(args, key: str, opener) -> dict:
    if args.date:
        dates = sorted(set(args.date))
    else:
        dates = local_trading_days(args.days)
    if not dates and not args.date:
        raise RuntimeError("本地 kline_daily 没找到任何交易日分区，请用 --date 指定")

    print("计划补齐的交易日: " + ", ".join(dates))
    print("另会再拉一次「不传日期」的最新已发布数据（覆盖本地分区滞后）")
    if args.dry_run:
        print("[dry-run] 到此为止，不联网、不写盘")
        return {"dry_run": True, "dates": dates}

    notes: list[str] = []
    # (请求日期, 是否检查已有快照) —— None 代表「不传 date」的最新兜底
    jobs: list[tuple[str | None, bool]] = [(d, True) for d in dates]
    jobs.append((None, False))

    for date_iso, check_exists in jobs:
        label = date_iso or "接口默认最新"
        dragon_path = OUT / "dragon_tiger" / ("date=%s.json" % date_iso) if date_iso else None
        bench_path = OUT / "auction_benchmark" / ("date=%s.json" % date_iso) if date_iso else None
        if (check_exists and not args.force and dragon_path and bench_path
                and dragon_path.is_file() and bench_path.is_file()):
            print("  跳过 %s（两类快照都已存在）" % label)
            continue

        for name, fetcher, sub in (
            ("龙虎榜", fetch_dragon, "dragon_tiger"),
            ("竞价风向标", fetch_benchmark, "auction_benchmark"),
        ):
            try:
                snap, msg = fetcher(opener, key, date_iso)
            except Exception as exc:  # noqa: BLE001 — 单项失败不影响其它日期/其它数据集
                msg = "失败: " + str(exc)[:160]
                print("  %s %-6s %s" % (label, name, msg))
                notes.append("%s %s %s" % (label, name, msg))
                continue
            print("  %s %-6s %s" % (label, name, msg))
            notes.append("%s %s %s" % (label, name, msg))
            if snap is None:
                continue  # 当日未发布 / 空榜：不落盘，保留旧快照
            real = snap.get("trade_date") or snap.get("date")
            atomic_write_json(OUT / sub / ("date=%s.json" % real), snap)

    latest = write_latest(notes)
    d = latest["dragon_tiger"]
    b = latest["auction_benchmark"]
    print("")
    print("快照就绪：龙虎榜 %d 天（最新 %s，%s 行）" % (
        len(d["dates"]), d["latest_date"], d["rows_by_date"].get(d["latest_date"], 0)))
    print("          竞价风向标 %d 天（最新 %s，%s 只）" % (
        len(b["dates"]), b["latest_date"], b["rows_by_date"].get(b["latest_date"], 0)))
    print("存放位置：" + str(OUT))
    return latest


def need_refresh(hours: float = 4.0) -> bool:
    """--loop 模式用：距上次成功同步超过 N 小时才再拉一次，省请求。"""
    p = OUT / "latest.json"
    if not p.is_file():
        return True
    try:
        stamp = json.loads(p.read_text(encoding="utf-8")).get("synced_at") or ""
        last = datetime.fromisoformat(stamp)
    except (OSError, ValueError):
        return True
    return (datetime.now() - last).total_seconds() >= hours * 3600


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="宿主侧同步 fuyao 龙虎榜 / 竞价风向标")
    ap.add_argument("--days", type=int, default=5, help="补最近 N 个本地交易日（默认 5）")
    ap.add_argument("--date", action="append", help="只拉指定日期，可重复")
    ap.add_argument("--force", action="store_true", help="已有快照也重新拉")
    ap.add_argument("--dry-run", action="store_true", help="只打印计划，不联网不写盘")
    ap.add_argument("--loop", action="store_true", help="常驻，每 5 分钟检查一次新鲜度（默认不开）")
    ap.add_argument("--key", help="显式传 Key（不推荐，会留在 shell 历史里）")
    args = ap.parse_args(argv)

    try:
        key, source = load_api_key(args.key)
    except RuntimeError as exc:
        print("Key 读取失败: " + str(exc), file=sys.stderr)
        return 2
    print("Key 来源: " + source + "（Key 本身不显示、不落盘、不进 Git）")

    opener = make_opener()
    if not args.loop:
        try:
            sync_once(args, key, opener)
        except Exception as exc:  # noqa: BLE001
            print("同步失败: " + str(exc)[:200], file=sys.stderr)
            return 1
        return 0

    print("进入自动刷新模式：每 5 分钟检查一次，距上次超过 4 小时才联网（Ctrl-C 退出）")
    try:
        while True:
            if need_refresh():
                try:
                    sync_once(args, key, opener)
                except Exception as exc:  # noqa: BLE001 — 常驻模式不因单次失败退出
                    print("本轮同步失败（保留旧快照）: " + str(exc)[:160])
            time.sleep(300)
    except KeyboardInterrupt:
        print("已退出自动刷新")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
