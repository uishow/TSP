#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
因子-自动挖掘：绕过前端 30 秒超时的脚本版调用示例。

为什么需要它：
  TSP 网页「自动挖掘」按钮走前端默认 30 秒超时；而服务端在同一请求里先做
  因子 IC/IR 预筛（实测 53.6 秒），浏览器在 30 秒处断开并报 timeout。
  本脚本直接调同一套后端 API，没有前端的 30 秒上限，因此不会 timeout。

两种用法（都返回 run_id 后在后台 worker 跑，可轮询）：
  --mode auto   调 /auto（自动 L1 筛选因子池 → 启动挖掘）。等价于网页按钮，但无超时。
  --mode runs   调 /runs（手动指定 factor_names → 立即返回 run_id，完全异步、零阻塞）。
                适合你已经知道想要哪些因子、想完全避开 53.6 秒预筛的场景。

依赖：仅标准库（urllib）。用法示例见文件底部 __main__。
"""

import json
import sys
import time
import urllib.request
from urllib.error import HTTPError, URLError

BASE = "http://127.0.0.1:3018"

# 一组示例因子（来自 /api/factors，共 77 个）。runs 模式可用 --factors 覆盖。
SAMPLE_FACTORS = [
    "momentum_20d", "momentum_60d", "ma20_bias", "ma60_bias",
    "rsi_14", "macd_hist", "volatility_20d", "turnover_rate",
]


def _post(path, payload, timeout=600):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        BASE + path, data=data,
        headers={"content-type": "application/json"}, method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        body = e.read().decode("utf-8", "ignore")
        print(f"[http {e.code}] {body[:600]}")
        raise


def _get(path, timeout=30):
    req = urllib.request.Request(BASE + path, method="GET")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def start_auto(asset_type="stock", start=None, end=None,
               budget_profile="exploratory", force=True, symbols=None):
    """模式 auto：等价于网页按钮，但无前端超时。返回 (run_id, projected)。"""
    body = {
        "asset_type": asset_type,
        "start": start,
        "end": end,
        "budget_profile": budget_profile,
        "force": force,
    }
    if symbols is not None:
        body["symbols"] = symbols
    print(f"[auto] POST /api/backtest/mining/auto  body={body}")
    proj = _post("/api/backtest/mining/auto", body)
    if proj.get("started") is False:
        # 无达标因子：直接返回筛选结果，不启动挖掘
        print("[auto] 未启动：无达标因子")
        print(json.dumps(proj.get("screening", {}), ensure_ascii=False, indent=2))
        return None, proj
    # run_id 嵌套在 response["run"]["run_id"]
    run_obj = proj.get("run") or {}
    run_id = run_obj.get("run_id")
    print(f"[auto] 已提交  run_id={run_id}")
    return run_id, proj


def start_runs(factor_names, asset_type="stock", start=None, end=None,
               budget_profile="exploratory", force=True, symbols=None):
    """模式 runs：手动指定因子，立即返回 run_id，完全异步。"""
    body = {
        "factor_names": factor_names,
        "asset_type": asset_type,
        "start": start,
        "end": end,
        "budget_profile": budget_profile,
        "force": force,
    }
    if symbols is not None:
        body["symbols"] = symbols
    print(f"[runs] POST /api/backtest/mining/runs  factors={len(factor_names)}个")
    proj = _post("/api/backtest/mining/runs", body, timeout=60)
    run_id = proj.get("run_id")
    print(f"[runs] 已提交  run_id={run_id}  reused={proj.get('reused')}")
    return run_id, proj


def poll(run_id, interval=5, max_wait=1800):
    """轮询 /runs/{run_id} 直到终态（success / failed / cancelled）。"""
    print(f"[poll] 轮询 run_id={run_id} ...")
    deadline = time.time() + max_wait
    while time.time() < deadline:
        try:
            run = _get(f"/api/backtest/mining/runs/{run_id}")
        except HTTPError as e:
            print(f"[poll] HTTP {e.code}: {e.read().decode('utf-8', 'ignore')[:200]}")
            time.sleep(interval)
            continue
        status = run.get("status")
        print(f"  t={int(time.time())%100000:05d}  status={status}")
        # 终态：failed/cancelled 显式失败；success* 系列（含
        # succeeded_with_budget_exhausted 等）均为成功终态。
        if status in ("failed", "cancelled") or str(status).startswith("success"):
            return run
        time.sleep(interval)
    print("[poll] 超过最大等待时间，仍未结束")
    return None


def report(run):
    if not run:
        return
    print("\n==== 结果 ====")
    # 终态 run 可能平铺；auto 提交时的 run 嵌套在 response["run"]
    run_obj = run.get("run") if isinstance(run.get("run"), dict) else run
    print("status     :", run_obj.get("status"))
    if run_obj.get("error"):
        print("error      :", run_obj.get("error"))
    # 预筛结果位置：run.request.auto_screening
    req = run_obj.get("request") or {}
    sc = req.get("auto_screening") or run_obj.get("auto_screening") or {}
    if sc:
        print("预筛耗时ms :", sc.get("elapsed_ms"))
        print("因子总数   :", sc.get("n_total"), " 达标:", sc.get("n_qualified"),
              " 截断:", sc.get("pool_truncated"))
        print("失败原因   :", sc.get("reason_counts"))
        fin_failed = [f for f in sc.get("failed", [])
                      if "计算失败" in (f.get("reason") or "")
                      or "本地没有财务" in (f.get("reason") or "")]
        print("财务因子仍失败数 :", len(fin_failed))
        for f in fin_failed:
            print("   -", f.get("factor_name"), f.get("reason"))
    cands = run_obj.get("candidates") or run_obj.get("candidate_count")
    print("候选数     :", cands)
    if run_obj.get("candidates"):
        for c in run_obj["candidates"][:5]:
            print("  -", c.get("signature"), "ic=", c.get("ic"), "ir=", c.get("ir"))


def main(argv):
    mode = "auto"
    asset_type = "stock"
    start = "2025-01-01"
    end = "2026-11-09"
    budget = "exploratory"
    factors = None
    force = True
    symbols = None

    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--mode":
            mode = argv[i + 1]; i += 2
        elif a == "--asset":
            asset_type = argv[i + 1]; i += 2
        elif a == "--start":
            start = argv[i + 1]; i += 2
        elif a == "--end":
            end = argv[i + 1]; i += 2
        elif a == "--budget":
            budget = argv[i + 1]; i += 2
        elif a == "--factors":
            factors = argv[i + 1].split(","); i += 2
        elif a == "--symbols":
            symbols = argv[i + 1].split(","); i += 2
        elif a == "--no-force":
            force = False; i += 1
        else:
            i += 1

    if mode == "runs":
        fns = factors or SAMPLE_FACTORS
        run_id, _ = start_runs(fns, asset_type, start, end, budget, force, symbols)
    else:
        run_id, proj = start_auto(asset_type, start, end, budget, force, symbols)
        if run_id is None:
            report(proj)
            return
    if run_id:
        run = poll(run_id)
        report(run)


if __name__ == "__main__":
    main(sys.argv[1:])
