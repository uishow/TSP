"""涨跌停板池时间轴 — 数据源: 东方财富涨停 / 炸板 / 跌停池。

业务口径沿用前端原型《梯队时间轴》:

1. 只保留**有事件的时间点**, 时间列倒序 (最左 = 最新), 无事件的列不显示;
2. 涨停按「连板高度」分行堆叠, 炸板 / 跌停共用同一条时间轴的下方分区;
3. 题材(行业板块 hybk)内按高度与封板时间打标:
   ``秒顶一`` / ``顶板`` / ``龙头`` / ``卡位`` / ``加强`` / ``后排``。

⚠️ 上游 ``push2ex.eastmoney.com`` 是公开无鉴权接口, 高频访问会被限流, 所以这里
做进程内短缓存: 交易时段 2.5s, 非交易时段 30s。前端仍按 3s 轮询本接口, 由服务端
决定是否真的回源。

⚠️ **绝不返回模拟数据** —— 上游没数据就返回空列表, 由前端提示"当前无数据"。原型页面
在取数失败时会退化成随机示例数据, 那在看板里是误导。
"""
from __future__ import annotations

import asyncio
import time
from datetime import date, datetime
from typing import Any

import httpx

from app.market_time import cn_now, cn_today
from app.services.trading_calendar import is_trading_day

_EM_BASE = "https://push2ex.eastmoney.com"
# 东财公开页面的固定 ut, 非用户凭证
_EM_UT = "7eea3edcaed734bea9cbfc24409ed989"
_PAGE_SIZE = 500

# 集合竞价结束 → 收盘
_BOARD_T0 = 9 * 60 + 25
_T1 = 15 * 60
# 盘中判断窗口 (含集合竞价与收盘后一小段, 覆盖尾盘回刷)
_SESSION_START = 9 * 60 + 15
_SESSION_END = 15 * 60 + 5

CACHE_TTL_SESSION = 2.5
CACHE_TTL_IDLE = 30.0
_HTTP_TIMEOUT = 8.0

_TIER_NAMES = {1: "首板", 2: "二板", 3: "三板", 4: "四板", 5: "五板", 6: "六板", 7: "七板", 8: "八板"}

# 时间段划分 (与原型的 9 段一致)
PERIODS: tuple[tuple[str, int, int], ...] = (
    ("09:25-09:30", 9 * 60 + 25, 9 * 60 + 30),
    ("09:30-10:00", 9 * 60 + 30, 10 * 60),
    ("10:00-10:30", 10 * 60, 10 * 60 + 30),
    ("10:30-11:00", 10 * 60 + 30, 11 * 60),
    ("11:00-11:30", 11 * 60, 11 * 60 + 30),
    ("13:00-13:30", 13 * 60, 13 * 60 + 30),
    ("13:30-14:00", 13 * 60 + 30, 14 * 60),
    ("14:00-14:30", 14 * 60, 14 * 60 + 30),
    ("14:30-15:00", 14 * 60 + 30, 15 * 60),
)


# ===== 纯逻辑 (可单测, 不碰网络) =====


def tier_label(boards: int) -> str:
    """连板数 → 梯队名称。原型把 >=9 板压成「五板」, 这里如实显示 N 板。"""
    if boards <= 1:
        return "首板"
    return _TIER_NAMES.get(boards, f"{boards}板")


def tier_level(boards: int) -> int:
    """梯队比较用的层级权重 —— 与原型 ``_TIER_LEVEL`` 完全等价 (首板 2 ... 五板及以上 6)。"""
    return min(max(boards, 1) + 1, 6)


def symbol_of(code: str, market: int | None = None) -> str:
    """6 位代码 → 带交易所后缀的 symbol。北交所优先按代码段判定。"""
    code = (code or "").strip()
    if not code:
        return ""
    if code.startswith(("92", "4", "8")):
        return f"{code}.BJ"
    if code.startswith("6"):
        return f"{code}.SH"
    if code.startswith(("0", "3")):
        return f"{code}.SZ"
    return f"{code}.SH" if market == 1 else f"{code}.SZ"


def _hhmmss_to_minutes(raw: Any) -> int:
    """东财 ``fbt`` / ``lbt`` (HHMMSS 整数, 可能缺前导 0) → 当日分钟数。"""
    if raw is None or isinstance(raw, bool):
        return _BOARD_T0
    if isinstance(raw, str):
        text = raw.strip()
        if not text:
            return _BOARD_T0
    else:
        text = str(int(raw))
    text = text.zfill(6)
    try:
        hour = int(text[0:2])
        minute = int(text[2:4])
    except (TypeError, ValueError):
        return _BOARD_T0
    if hour > 23 or minute > 59:
        return _BOARD_T0
    return hour * 60 + minute


def _parse_zt(pool: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for item in pool:
        code = str(item.get("c") or "")
        if not code:
            continue
        boards = int(item.get("lbc") or 1)
        t = _hhmmss_to_minutes(item.get("fbt"))
        out.append({
            "name": str(item.get("n") or ""),
            "code": code,
            "symbol": symbol_of(code, item.get("m")),
            "reason": str(item.get("hybk") or "其他"),
            "price": round(float(item.get("p") or 0) / 1000.0, 2),
            "change_pct": round(float(item.get("zdp") or 0.0), 2),
            "amount": float(item.get("amount") or 0.0),
            "turnover_rate": round(float(item.get("hs") or 0.0), 2),
            "time": t,
            "type": "zt",
            "boards": boards,
            "tier": tier_label(boards),
            "is_sec": t <= _BOARD_T0 + 1,
            "tag": "",
            "_lv": tier_level(boards),
        })
    return out


def _parse_zb(pool: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for item in pool:
        code = str(item.get("c") or "")
        if not code:
            continue
        out.append({
            "name": str(item.get("n") or ""),
            "code": code,
            "symbol": symbol_of(code, item.get("m")),
            "reason": str(item.get("hybk") or "其他"),
            "price": round(float(item.get("p") or 0) / 1000.0, 2),
            "change_pct": round(float(item.get("zdp") or 0.0), 2),
            "amount": float(item.get("amount") or 0.0),
            "turnover_rate": round(float(item.get("hs") or 0.0), 2),
            "time": _hhmmss_to_minutes(item.get("fbt")),
            "type": "zb",
            "boards": 0,
            "tier": "",
            "is_sec": False,
            "tag": "炸",
            "_lv": 0,
        })
    return out


def _parse_dt(pool: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for item in pool:
        code = str(item.get("c") or "")
        if not code:
            continue
        out.append({
            "name": str(item.get("n") or ""),
            "code": code,
            "symbol": symbol_of(code, item.get("m")),
            "reason": str(item.get("hybk") or "其他"),
            "price": round(float(item.get("p") or 0) / 1000.0, 2),
            "change_pct": round(float(item.get("zdp") or 0.0), 2),
            "amount": float(item.get("amount") or 0.0),
            "turnover_rate": round(float(item.get("hs") or 0.0), 2),
            "time": _hhmmss_to_minutes(item.get("lbt")),
            "type": "dt",
            "boards": int(item.get("days") or 0),
            "tier": "",
            "is_sec": False,
            "tag": "跌停",
            "_lv": 0,
        })
    return out


def assign_status(events: list[dict[str, Any]]) -> None:
    """按题材内相对高度与封板时间给涨停股打标 (就地修改 ``tag``)。

    逐条对应原型 ``lower_assignStatus`` 的分支, 层级权重用 :func:`tier_level`,
    所以判定顺序与原型完全一致。
    """
    zt = [e for e in events if e["type"] == "zt"]
    if not zt:
        return
    # 高度优先, 同高度封板越早越强
    zt.sort(key=lambda e: (-e["_lv"], e["time"]))

    sector_best: dict[str, dict[str, Any]] = {}
    for e in zt:
        reason = e["reason"]
        cur = sector_best.get(reason)
        if (
            cur is None
            or e["_lv"] > cur["_lv"]
            or (e["_lv"] == cur["_lv"] and e["time"] < cur["time"])
        ):
            sector_best[reason] = {"_lv": e["_lv"], "time": e["time"], "ev": e}

    global_best: dict[str, Any] | None = None
    for e in zt:
        if (
            global_best is None
            or e["_lv"] > global_best["_lv"]
            or (e["_lv"] == global_best["_lv"] and e["time"] < global_best["time"])
        ):
            global_best = e

    for e in zt:
        reason = e["reason"]
        lv = e["_lv"]
        best = sector_best.get(reason)
        is_best = best is not None and best["ev"] is e
        best_lv = best["_lv"] if best else 2
        if e["is_sec"] and global_best is e and lv >= 4:
            e["tag"] = "秒顶一"
        elif e["is_sec"] and lv < 4:
            e["tag"] = "顶板"
        elif is_best and lv >= 3:
            e["tag"] = "龙头"
        elif not is_best and lv >= 3 and best is not None:
            if lv == best_lv and e["time"] <= best["time"] + 3:
                e["tag"] = "卡位"
            elif lv == best_lv or lv >= best_lv - 1:
                e["tag"] = "加强"
            else:
                e["tag"] = ""
        elif is_best:
            # 本题材最高但只有首板 → 无标签
            e["tag"] = ""
        elif not is_best and lv >= 2 and best is not None:
            e["tag"] = "" if lv >= best_lv - 1 else "后排"
        elif not is_best and lv <= 2:
            has_higher_earlier = any(
                x["reason"] == reason and x is not e and x["time"] < e["time"] and x["_lv"] > lv
                for x in zt
            )
            e["tag"] = "后排" if (has_higher_earlier or e["time"] >= 11 * 60 + 30) else ""
        else:
            e["tag"] = "后排"


def pack_rows(events: list[dict[str, Any]]) -> tuple[int, int]:
    """同一时间点内的多只股票按行号堆叠, 返回 (涨停行数, 炸板+跌停行数)。"""
    zt = [e for e in events if e["type"] == "zt"]
    bt = [e for e in events if e["type"] != "zt"]

    def _pack(group: list[dict[str, Any]], sort_key) -> int:
        slots: dict[int, list[dict[str, Any]]] = {}
        for e in group:
            slots.setdefault(e["time"], []).append(e)
        rows = max((len(v) for v in slots.values()), default=1) or 1
        for lst in slots.values():
            lst.sort(key=sort_key)
            for i, e in enumerate(lst):
                e["row"] = min(i, rows - 1)
        return rows

    rows_zt = _pack(zt, lambda e: (-e["_lv"], e["time"], e["code"]))
    rows_bt = _pack(bt, lambda e: (e["type"], e["time"], e["code"]))
    return rows_zt, rows_bt


def summarize_sectors(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """题材汇总, 按事件总数降序 (同数涨停多的在前)。"""
    table: dict[str, dict[str, Any]] = {}
    for e in events:
        name = e["reason"]
        row = table.setdefault(name, {"name": name, "zt": 0, "zb": 0, "dt": 0, "total": 0})
        row[e["type"]] = row.get(e["type"], 0) + 1
        row["total"] += 1
    return sorted(table.values(), key=lambda r: (-r["total"], -r["zt"], r["name"]))


def build_periods(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for label, t0, t1 in PERIODS:
        count = sum(1 for e in events if t0 <= e["time"] < t1)
        out.append({"id": label, "label": label, "t0": t0, "t1": t1, "count": count})
    return out


def build_payload(
    day: date,
    zt_pool: list[dict[str, Any]],
    zb_pool: list[dict[str, Any]],
    dt_pool: list[dict[str, Any]],
    *,
    errors: list[str] | None = None,
    stale: bool = False,
) -> dict[str, Any]:
    events = _parse_zt(zt_pool) + _parse_zb(zb_pool) + _parse_dt(dt_pool)
    events.sort(key=lambda e: e["time"])
    assign_status(events)
    rows_zt, rows_bt = pack_rows(events)
    counts = {
        "zt": sum(1 for e in events if e["type"] == "zt"),
        "zb": sum(1 for e in events if e["type"] == "zb"),
        "dt": sum(1 for e in events if e["type"] == "dt"),
    }
    counts["total"] = counts["zt"] + counts["zb"] + counts["dt"]
    for e in events:
        e.pop("_lv", None)
    now = cn_now()
    return {
        "date": day.isoformat(),
        "trade_date": day.strftime("%Y%m%d"),
        "is_today": day == cn_today(),
        "in_session": _in_session(day, now),
        "server_time": now.strftime("%H:%M:%S"),
        "fetched_at": int(time.time() * 1000),
        "stale": stale,
        "source": "eastmoney",
        "errors": errors or [],
        "counts": counts,
        "rows": {"zt": rows_zt, "bt": rows_bt},
        "events": events,
        "sectors": summarize_sectors(events),
        "periods": build_periods(events),
        "session": {"t0": _BOARD_T0, "t1": _T1},
    }


# ===== 会话 / 缓存 =====


def _in_session(day: date, now: datetime | None = None) -> bool:
    """是否处于「盘中」——决定上游回源频率。非交易日 / 非交易时段一律 False。"""
    now = now or cn_now()
    if day != now.date():
        return False
    try:
        trading = is_trading_day(day)
    except Exception:
        trading = None
    if trading is False:
        return False
    minutes = now.hour * 60 + now.minute
    return _SESSION_START <= minutes <= _SESSION_END


_cache: dict[str, dict[str, Any]] = {}
_lock: asyncio.Lock | None = None


def _get_lock() -> asyncio.Lock:
    global _lock
    if _lock is None:
        _lock = asyncio.Lock()
    return _lock


def invalidate_cache() -> None:
    _cache.clear()


async def _fetch_pool(
    client: httpx.AsyncClient, pool_key: str, trade_date: str
) -> list[dict[str, Any]]:
    sort = "fund:asc" if pool_key == "dt" else "fbt:asc"
    resp = await client.get(
        f"{_EM_BASE}/getTopic{pool_key.upper()}Pool",
        params={
            "ut": _EM_UT,
            "dpt": "wz.ztzt",
            "Pageindex": 0,
            "Pagesize": _PAGE_SIZE,
            "sort": sort,
            "date": trade_date,
            "_": int(time.time() * 1000),
        },
    )
    resp.raise_for_status()
    body = resp.json()
    data = body.get("data") or {}
    pool = data.get("pool") or []
    return pool if isinstance(pool, list) else []


async def fetch_timeline(day: date, *, force: bool = False) -> dict[str, Any]:
    """取某日的板池时间轴。失败时优先返回上一次成功结果并标记 stale。"""
    key = day.isoformat()
    in_session = _in_session(day)
    ttl = CACHE_TTL_SESSION if in_session else CACHE_TTL_IDLE
    cached = _cache.get(key)
    if cached and not force and (time.monotonic() - cached["ts"]) < ttl:
        return cached["payload"]

    async with _get_lock():
        # 等锁期间可能已被别的请求刷新过
        cached = _cache.get(key)
        if cached and not force and (time.monotonic() - cached["ts"]) < ttl:
            return cached["payload"]

        trade_date = day.strftime("%Y%m%d")
        errors: list[str] = []
        try:
            async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT, follow_redirects=True) as client:
                results = await asyncio.gather(
                    _fetch_pool(client, "zt", trade_date),
                    _fetch_pool(client, "zb", trade_date),
                    _fetch_pool(client, "dt", trade_date),
                    return_exceptions=True,
                )
        except Exception as exc:
            results = [exc, exc, exc]

        pools: list[list[dict[str, Any]]] = []
        for name, res in zip(("zt", "zb", "dt"), results, strict=True):
            if isinstance(res, BaseException) or not isinstance(res, list):
                pools.append([])
                errors.append(name)
            else:
                pools.append(res)

        # 三个池全军覆没 → 有旧结果就降级返回, 否则如实报错 (不编造数据)
        if len(errors) == 3 and cached:
            payload = dict(cached["payload"])
            payload["stale"] = True
            payload["fetched_at"] = int(time.time() * 1000)
            _cache[key] = {"ts": time.monotonic(), "payload": payload}
            return payload

        payload = build_payload(day, pools[0], pools[1], pools[2], errors=errors)
        _cache[key] = {"ts": time.monotonic(), "payload": payload}
        return payload
