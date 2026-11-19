#!/usr/bin/env python3
"""O24 · depth_service 五档修正 eltdx 直连（用户 2026-11-19 拍板⑲，接口全景 §35 未闭环①）。

大白话（点哪 → 发生什么 → 结果在哪看 → 出错怎么查）：
  新看板 KPI 六宫格的「涨停/跌停/封板率」靠 depth_service 五档封板修正判真假板。
  原版拉五档走 TickFlow 插件（套餐限速 Pro 10~120s + 三层节流 + 批间 sleep），
  实测 KPI 与东财时间轴数字不同拍（体感"延迟/对不上"）。本补丁把拉取这一步
  换成容器现成的宿主桥接 7818（dataset=depth5 → eltdx 0x0547 真五档，实时）：

    DepthService._call_depth_batch(symbols)
      → POST {TSP_BRIDGE_URL}/query  {"dataset":"depth5","symbols":[...]}
        （Authorization: Bearer TSP_BRIDGE_TOKEN，两者都是容器 env 现成配置）
      → 返回 rows[{symbol:{ask_volumes,bid_volumes,timestamp,...}}]
        —— 与上游 _seal_locked 消费格式逐字段一致，零转换
      → 失败/空/超时 → 调原方法退回 TickFlow 本轮照常

    DepthService._compute_interval(n)
      → eltdx 近期健康（2 分钟内拉取成功过）→ 固定快间隔（默认 30s，
        TSP_DEPTH_ELTDX_INTERVAL 可调，clamp 10~300）
      → eltdx 不健康 → 原三层节流结果（TickFlow 配额保护原样保留）

结果在哪看：
  - KPI 六宫格涨停/跌停/封板率按新间隔刷新，与时间轴数字同拍。
  - 日志 grep DEPTH_ELTDX：PATCH_APPLIED（装载）/ OK n只（拉取成功）/
    FALLBACK（退回 TickFlow）/ INTERVAL（间隔决策）。

出错怎么查（全部安全退回，绝不白屏/阻断/伪造）：
  - TSP_BRIDGE_URL/TOKEN 未配置 → 不安装 + DEPTH_ELTDX_PATCH_SKIPPED
  - _call_depth_batch/_compute_interval 方法缺失（上游升级改名）→ 不安装 + SKIPPED
  - 桥接超时/HTTP 非 200/JSON 坏/rows 空 → 本轮退回原 TickFlow 路径 + FALLBACK 日志
  - TSP_DEPTH_ELTDX=0 或 overrides/depth5_eltdx.disabled → 不安装 + SKIPPED

升级兼容性：
  - 不碰镜像/tag/digest/compose/upstream/容器 /app/app /app/static。
  - setattr 级包装（functools.wraps 幂等标记）：上游方法名不变即持续生效，
    消失即 SKIPPED 退回原版（TickFlow 路径一行未动）。
  - 桥接侧质量闸（TDX handshake 日期校验/undated 剔除/stale 标记/fail-closed）
    全部沿用，本补丁不做任何数据改写——只换"从哪拉"。
  - 注意：轮询线程启动仍依赖上游 _has_capability()（TickFlow depth5 能力），
    key 失效时轮询整体停转（原版行为不变），本补丁随之不生效但无害。
"""
from __future__ import annotations

import functools
import json
import logging
import os
import time
import urllib.request

log = logging.getLogger("tsp.override.depth5_eltdx")

_ENV_OFF = "TSP_DEPTH_ELTDX"
_DISABLE_FLAG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "depth5_eltdx.disabled")

_TIMEOUT_SECONDS = 20.0          # 130 只 ≈ 2 批 ≈ 5s，留 4 倍余量
_HEALTH_WINDOW = 120.0           # 2 分钟内成功过 = 健康（间隔走快档）
_LOG_EVERY = 300.0               # 运行时日志节流
_INTERVAL_DEFAULT = 30.0         # eltdx 健康时的轮询间隔
_INTERVAL_MIN, _INTERVAL_MAX = 10.0, 300.0

_health = {"last_ok": 0.0}       # 模块级健康状态（仅做节流决策，竞争无害）
_last_log: dict[str, float] = {}


def _throttled_log(key: str, level, msg: str, *args) -> None:
    now = time.time()
    if now - _last_log.get(key, 0.0) < _LOG_EVERY:
        return
    _last_log[key] = now
    log.log(level, msg, *args)


def _eltdx_interval() -> float:
    raw = os.environ.get("TSP_DEPTH_ELTDX_INTERVAL", "")
    try:
        v = float(raw) if raw else _INTERVAL_DEFAULT
    except ValueError:
        v = _INTERVAL_DEFAULT
    return max(_INTERVAL_MIN, min(_INTERVAL_MAX, v))


def _fetch_via_bridge(symbols: list) -> dict:
    """经宿主桥接 7818 拉 eltdx 五档。成功返回非空 dict；失败抛异常（由调用方退回）。"""
    base = os.environ.get("TSP_BRIDGE_URL", "").rstrip("/")
    token = os.environ.get("TSP_BRIDGE_TOKEN", "")
    if not base or not token:
        raise RuntimeError("TSP_BRIDGE_URL/TSP_BRIDGE_TOKEN 未配置")
    payload = json.dumps({"dataset": "depth5", "symbols": symbols}).encode("utf-8")
    req = urllib.request.Request(
        base + "/query",
        data=payload,
        headers={"Content-Type": "application/json", "Authorization": "Bearer " + token},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=_TIMEOUT_SECONDS) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    rows = body.get("rows") if isinstance(body, dict) else None
    if not isinstance(rows, dict) or not rows:
        raise RuntimeError("rows 为空或非 dict")
    # 结构抽检：至少一条记录带 ask_volumes（防格式漂移静默污染 sealed 判定）
    sample = next(iter(rows.values()))
    if not isinstance(sample, dict) or "ask_volumes" not in sample:
        raise RuntimeError("rows 记录缺少 ask_volumes 字段（格式漂移？）")
    return rows


def install() -> None:
    if os.environ.get(_ENV_OFF) == "0" or os.path.exists(_DISABLE_FLAG):
        log.warning("DEPTH_ELTDX_PATCH_SKIPPED: %s=0 或存在 depth5_eltdx.disabled（人工关闭）", _ENV_OFF)
        return
    if not os.environ.get("TSP_BRIDGE_URL") or not os.environ.get("TSP_BRIDGE_TOKEN"):
        log.warning("DEPTH_ELTDX_PATCH_SKIPPED: TSP_BRIDGE_URL/TOKEN 未配置（非容器环境？）→ 不安装")
        return
    try:
        from app.services.depth_service import DepthService
    except Exception as e:  # noqa: BLE001
        log.warning("DEPTH_ELTDX_PATCH_SKIPPED: DepthService 不可用(%s) → 不安装", e)
        return

    # ---- 锚点 1：_call_depth_batch ----
    orig_fetch = getattr(DepthService, "_call_depth_batch", None)
    if orig_fetch is None:
        log.warning("DEPTH_ELTDX_PATCH_SKIPPED: _call_depth_batch 方法缺失（上游升级改名？）→ 不安装，TickFlow 原路径运行")
        return
    if not getattr(orig_fetch, "_tsp_depth5_eltdx", False):

        @functools.wraps(orig_fetch)
        def fetch_wrapper(self, symbols: list) -> dict:
            try:
                rows = _fetch_via_bridge(symbols)
                _health["last_ok"] = time.time()
                _throttled_log("ok", logging.INFO,
                               "DEPTH_ELTDX_OK: %d 只经桥接7818(eltdx) 拉取成功", len(rows))
                return rows
            except Exception as e:  # noqa: BLE001 — 失败本轮退回原路径
                _throttled_log("fb", logging.WARNING,
                               "DEPTH_ELTDX_FALLBACK: eltdx 路径失败(%s) → 本轮退回 TickFlow", e)
                return orig_fetch(self, symbols)

        fetch_wrapper._tsp_depth5_eltdx = True
        DepthService._call_depth_batch = fetch_wrapper

    # ---- 锚点 2：_compute_interval ----
    orig_interval = getattr(DepthService, "_compute_interval", None)
    if orig_interval is None:
        log.warning("DEPTH_ELTDX_PATCH_SKIPPED: _compute_interval 方法缺失 → 仅换拉取源，间隔保持原三层节流")
    elif not getattr(orig_interval, "_tsp_depth5_eltdx", False):

        @functools.wraps(orig_interval)
        def interval_wrapper(self, n_symbols: int) -> tuple:
            try:
                if time.time() - _health["last_ok"] < _HEALTH_WINDOW:
                    iv = _eltdx_interval()
                    _throttled_log("iv", logging.INFO,
                                   "DEPTH_ELTDX_INTERVAL: eltdx 健康 → 轮询间隔 %.0fs（涨跌停 %d 只）", iv, n_symbols)
                    return (iv, False, iv)
            except Exception:  # noqa: BLE001 — 决策失败走原逻辑
                pass
            return orig_interval(self, n_symbols)

        interval_wrapper._tsp_depth5_eltdx = True
        DepthService._compute_interval = interval_wrapper

    log.info(
        "DEPTH_ELTDX_PATCH_APPLIED: O24 五档修正 eltdx 直连已安装（桥接 %s；失败退回 TickFlow；间隔 %ss）",
        os.environ.get("TSP_BRIDGE_URL", "?"), _eltdx_interval(),
    )
