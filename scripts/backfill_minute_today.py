#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把当天缺掉的「真实分钟 K」补回本地分区，让板块走势图不再只剩一条线。

大白话：行情源断过一阵子的时候，当日分钟分区里每一分钟只记到了 1 只股票。
板块算法是「把板块成员的涨幅平均一下」，每格只有 1 只票，9 个板块就全等于
这一只，曲线完全叠在一起，看上去只有一条主线。这个脚本调用 TSP 自带的
/api/kline/minute-batch（上游会自己把真实 K 落盘，upsert 语义），一小批一小批
补回来；补完后每个时间点有全市场几千只票，曲线自然分开。

怎么用（在项目根目录执行）：
  .venv/bin/python scripts/backfill_minute_today.py --limit 200   # 先试补 200 只
  .venv/bin/python scripts/backfill_minute_today.py               # 补全部缺口
  .venv/bin/python scripts/backfill_minute_today.py --dry-run      # 只看会补谁，不动数据

结果在哪看：
  1) 脚本最后会打印「成功 / 跳过 / 分区每时间点行数」。
  2) 浏览器打开板块轮动页，或执行
     curl --noproxy '*' 'http://127.0.0.1:3018/api/sector-rotation?auto_rows=9&sort_by=score'
     看 sectors[].n_members_with_bars 是否从 1 涨到几十、几百，
     pct_now 是否不再全部相同。

出错怎么查：
  - 打印 eltdx request failed / ResponseTimeoutError = 行情源「分钟协议」不通。
    脚本会退避重试，仍失败就跳过；绝不补 0、绝不插值、绝不复用旧快照。
    等行情源恢复（必要时在自己的终端重启宿主桥接）后再跑一次即可。
  - 分区在 data-local/kline_minute/date=YYYY-MM-DD/part.parquet；
    每次运行前自动备份到 runtime/，可原样拷回回滚。

口径与升级边界：
  - 只写上游返回的真实分钟 K，不改价格口径、不改涨跌方向。
  - 不改镜像 / 不改 /app/app / 不改容器内前端 / 不改 digest；
    TSP 升级后本脚本照常可用，最多因接口变更而失效，不会阻断启动。
  - 落盘由上游 minute-batch 负责，本脚本不重复写 parquet。
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import shutil
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data-local"
RUNTIME = ROOT / "runtime"
BASE = os.environ.get("TSP_BASE", "http://127.0.0.1:3018")
CN = dt.timezone(dt.timedelta(hours=8))

# 只连本机，禁用沙盒注入的代理（代理端口会随会话漂移，长任务尤其容易 502）
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def post(path: str, payload: dict, timeout: int = 90) -> dict:
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with OPENER.open(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def trading_date() -> dt.date:
    return dt.datetime.now(CN).date()


def stock_pool() -> list[str]:
    import polars as pl

    path = DATA / "instruments" / "instruments.parquet"
    if not path.exists():
        print("找不到 instruments.parquet，先在主站做一次「数据 → 立即同步」", file=sys.stderr)
        return []
    inst = pl.read_parquet(path, columns=["symbol"])
    return sorted({str(s) for s in inst["symbol"].to_list() if str(s).endswith((".SH", ".SZ"))})


def already_complete(part: Path) -> set[str]:
    """已有 >=100 根当日分钟柱的股票视为补齐，跳过；09:31 只有 1 根的不算。"""
    import polars as pl

    if not part.exists():
        return set()
    df = pl.read_parquet(part, columns=["symbol", "datetime"])
    if df.is_empty():
        return set()
    g = df.group_by("symbol").len().rename({"len": "n"})
    return set(g.filter(pl.col("n") >= 100)["symbol"].to_list())


def snapshot(part: Path) -> None:
    import polars as pl

    if not part.exists():
        print("  分区尚不存在")
        return
    df = pl.read_parquet(part, columns=["symbol", "datetime"])
    g = df.group_by("datetime").len().rename({"len": "n"}).sort("datetime")
    if g.is_empty():
        print("  分区为空")
        return
    print(
        "  分区行数=%d 时间点=%d 每时间点行数: 最小=%d 中位=%d 最大=%d"
        % (df.height, g.height, g["n"].min(), int(g["n"].median()), g["n"].max())
    )


def main() -> int:
    ap = argparse.ArgumentParser(description="补回当天真实分钟K（板块曲线防重合）")
    ap.add_argument("--date", default=str(trading_date()), help="交易日 YYYY-MM-DD，缺省=北京今天")
    ap.add_argument("--batch", type=int, default=20, help="每批股票数，默认 20（实测 50 只会触发 eltdx 超时）")
    ap.add_argument("--pause", type=float, default=2.0, help="批次间等待秒数，默认 2")
    ap.add_argument("--retries", type=int, default=2, help="单批失败重试次数，默认 2")
    ap.add_argument("--limit", type=int, default=0, help="最多补多少只，0=全部；先小范围试跑")
    ap.add_argument("--dry-run", action="store_true", help="只列出待补标的，不发请求、不改数据")
    args = ap.parse_args()

    part = DATA / "kline_minute" / f"date={args.date}" / "part.parquet"
    pool = stock_pool()
    if not pool:
        return 1
    done = already_complete(part)
    pending = [s for s in pool if s not in done]
    if args.limit:
        pending = pending[: args.limit]

    print("日期=%s 全市场股票=%d 已补齐=%d 待补=%d" % (args.date, len(pool), len(done), len(pending)))
    print("补数前：")
    snapshot(part)
    if args.dry_run:
        print("--dry-run：前 20 只 =", pending[:20])
        return 0
    if not pending:
        print("没有需要补的股票，结束。")
        return 0

    RUNTIME.mkdir(parents=True, exist_ok=True)
    stamp = dt.datetime.now(CN).strftime("%H%M%S")
    if part.exists():
        bak = RUNTIME / f"kline_minute_{args.date.replace('-', '')}.bak.{stamp}.parquet"
        shutil.copy2(part, bak)
        print("已备份原分区 →", bak)

    ok_symbols = 0
    skipped = 0
    batches = [pending[i : i + args.batch] for i in range(0, len(pending), args.batch)]
    print("共 %d 批，每批 %d 只，间隔 %.1fs" % (len(batches), args.batch, args.pause))
    for idx, chunk in enumerate(batches, 1):
        got = 0
        for attempt in range(args.retries + 1):
            try:
                resp = post("/api/kline/minute-batch", {"symbols": chunk, "date": args.date, "live": True})
                data = resp.get("data") or {}
                got = sum(1 for v in data.values() if isinstance(v, list) and len(v) >= 100)
                if got:
                    break
                raise RuntimeError("无一只返回完整分钟K: " + json.dumps(resp, ensure_ascii=False)[:160])
            except (urllib.error.URLError, urllib.error.HTTPError, OSError, ValueError, RuntimeError) as exc:
                if attempt == args.retries:
                    print("  批 %d/%d 失败跳过: %s" % (idx, len(batches), str(exc)[:140]))
                else:
                    time.sleep(3 * (attempt + 1))
        ok_symbols += got
        skipped += len(chunk) - got
        if idx % 5 == 0 or idx == len(batches):
            print("  进度 %d/%d 批，已补 %d 只，跳过 %d 只" % (idx, len(batches), ok_symbols, skipped))
        time.sleep(args.pause)

    try:
        post("/api/kline/refresh_views", {}, timeout=60)
        print("已刷新 DuckDB 视图")
    except Exception as exc:
        print("刷新视图失败（可重启容器重建）:", str(exc)[:120])

    print("\n完成：补回 %d 只，跳过 %d 只" % (ok_symbols, skipped))
    print("补数后：")
    snapshot(part)
    print(
        "下一步：打开板块轮动页看曲线；若仍只有一条线，说明行情源分钟通道未恢复，"
        "请在自己的终端重跑宿主桥接后再执行本脚本。"
    )
    return 0 if ok_symbols else 2


if __name__ == "__main__":
    raise SystemExit(main())
