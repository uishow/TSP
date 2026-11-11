"""大单监控数据源（同花顺 realhead + 东方财富逐笔/资金流）。
对外契约（供 TSP 自定义数据源 / 页面直连使用）：
    GET /bigorder/flow?symbol=000530.SZ
        同花顺秒级大单快照：超大/大/中/小 的买入额、卖出额、净额。
        口径与同花顺客户端「主力=超大+大」一致；成交额可对账（四项买卖合计 = 当日成交额）。
    GET /bigorder/ticks?symbol=000530.SZ&pos=0&lmt=2000
        东方财富逐笔成交：时间/价格/手数/金额/买卖方向（1=买 2=卖 4=集合竞价）。
    GET /bigorder/screen?limit=300
        东方财富全市场资金流榜（按主力净额排序取前后各 limit 只），
        用于「全市场初筛」：一次只花 4~6 个请求，不必扫 5563 只。
    GET /bigorder/snapshot?symbols=000530.SZ,600519.SH
        批量 flow（上限 60 只，内部并发 8，结果带 2 秒缓存）。
数据源说明（2026-11-09 实测）：
    同花顺 App 的 vaservice.10jqka.com.cn/Level2 已经没有 DNS 记录了，
    但 d.10jqka.com.cn/v6/realhead 仍然提供同一套超/大/中/小买卖金额，单票一次请求。
"""
from __future__ import annotations
import asyncio
import json
import os
import re
import time
from typing import Any
import httpx
JQKA_URL = "http://d.10jqka.com.cn/v6/realhead/hs_{code}/defer/last.js"
EM_TICKS = "https://push2.eastmoney.com/api/qt/stock/details/get"
EM_CLIST = "https://push2.eastmoney.com/api/qt/clist/get"
EM_UT = "b2884a393a59ad64002292a3e90d46a5"
from pathlib import Path
# 数据目录默认落在包内 adapter/data/，换机器不用改路径
PKG_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("BIGORDER_DATA_DIR", str(PKG_ROOT / "data")))
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0 Safari/537.36",
    "Referer": "http://stockpage.10jqka.com.cn/",
}
_flow_cache: dict[str, tuple[float, dict[str, Any]]] = {}
_screen_cache: tuple[float, list[dict[str, Any]]] = (0.0, [])
FLOW_TTL = 2.0
SCREEN_TTL = 8.0

class BigOrderError(RuntimeError):
    pass

def split_symbol(symbol: str) -> tuple[str, str]:
    """'000530.SZ' -> ('000530', 'SZ')"""
    text = str(symbol).strip().upper()
    if "." in text:
        code, market = text.split(".", 1)
    else:
        code, market = text, ("SH" if text[:1] in "569" else "BJ" if text[:1] in "48" else "SZ")
    if not code.isdigit() or len(code) != 6:
        raise BigOrderError(f"非法代码: {symbol!r}")
    return code, market

def em_secid(symbol: str) -> str:
    code, market = split_symbol(symbol)
    return {"SH": "1", "SZ": "0", "BJ": "0"}[market] + "." + code

async def _get(client: httpx.AsyncClient, url: str, params: dict[str, Any] | None = None) -> httpx.Response:
    last: Exception | None = None
    for attempt in range(3):
        try:
            res = await client.get(url, params=params, headers=HEADERS, timeout=12.0)
            if res.status_code == 200:
                return res
            last = BigOrderError(f"HTTP {res.status_code} {url}")
        except Exception as exc:  # noqa: BLE001
            last = exc
        await asyncio.sleep(0.15 * (attempt + 1))
    raise BigOrderError(str(last))

def _num(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None

# ---------------------------------------------------------------- 同花顺 快照
JQKA_FIELDS = {
    # (买入字段, 卖出字段)
    "super": ("223", "224"),   # 超大单
    "big": ("225", "226"),     # 大单
    "mid": ("237", "238"),     # 中单
    "small": ("259", "260"),   # 小单
}

async def flow(symbol: str) -> dict[str, Any]:
    code, market = split_symbol(symbol)
    key = f"{market}{code}"
    now = time.time()
    cached = _flow_cache.get(key)
    if cached and now - cached[0] < FLOW_TTL:
        return cached[1]
    url = JQKA_URL.format(code=code)
    async with httpx.AsyncClient() as client:
        res = await _get(client, url)
    text = res.text
    start = text.find("(")
    end = text.rfind(")")
    if start < 0 or end < 0:
        raise BigOrderError("同花顺返回格式异常")
    payload = json.loads(text[start + 1 : end])
    # 根节点通常就是 {"items": {...}}；老版本外面还会包一层 {"hs_000530": {...}}
    if isinstance(payload, dict) and isinstance(payload.get("items"), dict):
        body = payload
    else:
        body = next((v for v in payload.values() if isinstance(v, dict)), {}) if isinstance(payload, dict) else {}
    items = body.get("items") or {}
    if not items:
        raise BigOrderError("同花顺未返回 items")
    tiers: dict[str, dict[str, float | None]] = {}
    for name, (buy_key, sell_key) in JQKA_FIELDS.items():
        buy = _num(items.get(buy_key)) or 0.0
        sell = _num(items.get(sell_key)) or 0.0
        tiers[name] = {"buy": buy, "sell": sell, "net": buy - sell}
    main_buy = tiers["super"]["buy"] + tiers["big"]["buy"]
    main_sell = tiers["super"]["sell"] + tiers["big"]["sell"]
    result = {
        "symbol": f"{code}.{market}",
        "name": items.get("name") or body.get("name"),
        "price": _num(items.get("10")),
        "change_pct": _num(items.get("199112")),
        "amount": _num(items.get("19")),
        "volume": _num(items.get("13")),
        "pre_close": _num(items.get("6")),
        "time": items.get("updateTime") or items.get("time") or body.get("time"),
        "status": items.get("stockStatus") or body.get("stockStatus"),
        "tiers": tiers,
        "main": {"buy": main_buy, "sell": main_sell, "net": main_buy - main_sell},
        "source": "10jqka-realhead",
        "fetched_at": now,
    }
    _flow_cache[key] = (now, result)
    return result

async def snapshot(symbols: list[str]) -> dict[str, Any]:
    limit = 60
    picked = symbols[:limit]
    sem = asyncio.Semaphore(8)
    out: list[dict[str, Any]] = []
    errors: dict[str, str] = {}
    async def one(sym: str) -> None:
        async with sem:
            try:
                out.append(await flow(sym))
            except Exception as exc:  # noqa: BLE001
                errors[sym] = str(exc)
    await asyncio.gather(*(one(s) for s in picked))
    return {"data": out, "errors": errors, "truncated": len(symbols) > limit}

# ---------------------------------------------------------------- 东财 逐笔
async def ticks(symbol: str, pos: int = 0, lmt: int = 2000) -> dict[str, Any]:
    params = {
        "secid": em_secid(symbol),
        "fields1": "f1,f2,f3,f4,f5,f6",
        "fields2": "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61",
        "pos": str(pos),
        "lmt": str(min(max(lmt, 1), 2000)),
        "ut": EM_UT,
    }
    async with httpx.AsyncClient() as client:
        res = await _get(client, EM_TICKS, params)
    payload = res.json()
    data = payload.get("data") or {}
    rows = []
    for line in data.get("details") or []:
        parts = line.split(",")
        if len(parts) < 5:
            continue
        bs = parts[4]
        if bs not in ("1", "2", "4"):
            continue
        price = _num(parts[1]) or 0.0
        vol = _num(parts[2]) or 0.0          # 手
        rows.append(
            {
                "t": parts[0],
                "price": price,
                "vol": vol,
                "amt": round(vol * 100 * price, 2),
                # 2026-11-10 实测校准：这个接口里 1=卖盘、2=买盘（与大红球对照 002943 完全镜像，
                # 且 6 只样本的逐笔净额符号全部与东财主力净额相反）。之前按 1=买 是反的。
                "bs": "sell" if bs == "1" else "buy" if bs == "2" else "auction",
            }
        )
    return {
        "symbol": data.get("code") and str(symbol),
        "pre_close": _num(data.get("prePrice")),
        "decimal": data.get("decimal"),
        "count": len(rows),
        "data": rows,
        "source": "eastmoney-details",
    }

# ---------------------------------------------------------------- 东财 全市场初筛

async def screen(limit: int = 300) -> dict[str, Any]:
    """全市场资金流榜：按主力净额取前 N 名和倒数 N 名。"""
    global _screen_cache
    now = time.time()
    cached_at, cached_rows = _screen_cache
    if cached_rows and now - cached_at < SCREEN_TTL:
        return {"data": cached_rows, "cached": True, "as_of": cached_at}
    limit = max(50, min(int(limit), 500))
    pages = max(1, (limit + 99) // 100)
    fields = "f12,f14,f2,f3,f62,f66,f72,f78,f84,f184"
    universe = "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23"
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    async with httpx.AsyncClient() as client:
        async def fetch(po: int) -> None:
            for pn in range(1, pages + 1):
                params = {
                    "pn": pn, "pz": 100, "po": po, "np": 1, "fltt": 2, "invt": 2,
                    "fid": "f62", "fs": universe, "fields": fields, "ut": EM_UT,
                }
                try:
                    res = await _get(client, EM_CLIST, params)
                    diff = ((res.json().get("data") or {}).get("diff")) or []
                except Exception:  # noqa: BLE001
                    continue
                for item in diff:
                    code = str(item.get("f12") or "")
                    market = "SH" if code[:1] in "569" else "SZ"
                    symbol = f"{code}.{market}"
                    if symbol in seen:
                        continue
                    seen.add(symbol)
                    rows.append(
                        {
                            "symbol": symbol,
                            "code": code,
                            "name": item.get("f14"),
                            "price": _num(item.get("f2")),
                            "change_pct": _num(item.get("f3")),
                            "main_net": _num(item.get("f62")),
                            "super_net": _num(item.get("f66")),
                            "big_net": _num(item.get("f72")),
                            "mid_net": _num(item.get("f78")),
                            "small_net": _num(item.get("f84")),
                            "main_pct": _num(item.get("f184")),
                        }
                    )
        await asyncio.gather(fetch(1), fetch(0))
    _screen_cache = (now, rows)
    return {"data": rows, "cached": False, "as_of": now, "source": "eastmoney-clist", "pages": pages}
# ---------------------------------------------------------------- 竞价强度
# 竞价强度快照由同仓 watcher/bigorder-watch.mjs 在 09:26 采集并写到 watcher/大单提醒/，
# 默认指过去免去每次带 BIGORDER_AUCTION_DIR；仍可用环境变量覆盖。
AUCTION_DIR = os.environ.get("BIGORDER_AUCTION_DIR", str(PKG_ROOT / "watcher" / "大单提醒"))

def auction_strength(date_text: str | None = None) -> dict[str, Any]:
    """读巡检器在 09:26 采到的「竞价成交额 ≥5000 万」榜单快照。
    竞价额只存在于 09:25–09:30 这个窗口：那时还没有连续竞价成交，
    全市场快照里的 amount 就是集合竞价成交额。窗口外无法回补，只能读缓存。
    """
    from datetime import date, datetime
    from pathlib import Path
    day = date_text or datetime.now().strftime("%Y-%m-%d")
    path = Path(AUCTION_DIR) / f"竞价强度-{day}.json"
    if not path.exists():
        return {"state": "not_captured", "date": day, "hint": "09:25–09:30 之间由巡检器采集，窗口外无法回补"}
    try:
        import json as _json
        data = _json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        return {"state": "error", "date": day, "message": str(exc)}
    data["state"] = "ok"
    return data
EM_FLOW = "https://push2.eastmoney.com/api/qt/ulist.np/get"

async def em_flow(symbol: str) -> dict[str, Any]:
    """东方财富单票资金流（超大/大/中/小 净额），与同花顺四类汇总做对照。
    注意：两家的分档阈值不同，绝对值不可直接比较，只能比方向和量级。
    """
    code, market = split_symbol(symbol)
    secid = em_secid(symbol)
    params = {
        "secids": secid,
        "fields": "f12,f14,f2,f3,f62,f66,f72,f78,f84,f184",
        "fltt": 2, "invt": 2, "ut": EM_UT,
    }
    async with httpx.AsyncClient() as client:
        res = await _get(client, EM_FLOW, params)
    payload = res.json()
    diff = ((payload.get("data") or {}).get("diff")) or []
    if not diff:
        raise BigOrderError("东财未返回资金流")
    row = diff[0]
    tiers = {
        "super": {"net": _num(row.get("f66")) or 0.0},
        "big": {"net": _num(row.get("f72")) or 0.0},
        "mid": {"net": _num(row.get("f78")) or 0.0},
        "small": {"net": _num(row.get("f84")) or 0.0},
    }
    main = _num(row.get("f62")) or 0.0
    return {
        "symbol": f"{code}.{market}",
        "name": row.get("f14"),
        "price": _num(row.get("f2")),
        "change_pct": _num(row.get("f3")),
        "tiers": tiers,
        "main": {"net": main},
        "main_pct": _num(row.get("f184")),
        "source": "eastmoney-ulist",
    }
# ---------------------------------------------------------------- 分时资金流
EM_FFLOW = "https://push2.eastmoney.com/api/qt/stock/fflow/kline/get"

async def flow_kline(symbol: str) -> dict[str, Any]:
    """东财分时资金流：每分钟的 主力/小/中/大/超大 净流入（元）。
    行格式（f51..f56）：时间, 主力净流入, 小单, 中单, 大单, 超大单
    校验：主力 = 大单 + 超大单，四档合计 = 0。
    """
    code, market = split_symbol(symbol)
    params = {
        "lmt": "0", "klt": "1", "secid": em_secid(symbol),
        "fields1": "f1,f2,f3,f7",
        "fields2": "f51,f52,f53,f54,f55,f56",
        "ut": EM_UT,
    }
    async with httpx.AsyncClient() as client:
        res = await _get(client, EM_FFLOW, params)
    data = res.json().get("data") or {}
    rows = []
    for line in data.get("klines") or []:
        p = line.split(",")
        if len(p) < 6:
            continue
        try:
            rows.append(
                {
                    "t": p[0][-5:],
                    "main": float(p[1]),
                    "small": float(p[2]),
                    "mid": float(p[3]),
                    "big": float(p[4]),
                    "super": float(p[5]),
                }
            )
        except ValueError:
            continue
    return {"symbol": f"{code}.{market}", "name": data.get("name"), "data": rows, "source": "eastmoney-fflow"}
# ---------------------------------------------------------------- 封单质量
# 默认读同仓 sampler/封单/（封单采样器 seal-sampler.mjs 的输出目录），
# 与「开箱即用」默认 data/封单 相比，省去每次启动都要带 BIGORDER_SEAL_DIR 的麻烦；
# 仍可用 BIGORDER_SEAL_DIR 覆盖（例如把采样器输出指到别处）。
SEAL_DIR = os.environ.get("BIGORDER_SEAL_DIR", str(PKG_ROOT / "sampler" / "封单"))
_seal = {"path": None, "offset": 0, "data": {}}

def _seal_file(day: str | None = None) -> str:
    """当天没有采样文件时（盘前/周末），退回到目录里最近的一份，并在返回里标注真实日期。"""
    from datetime import datetime
    from pathlib import Path
    base = Path(SEAL_DIR)
    if day:
        return str(base / f"{day}.ndjson")
    today = datetime.now().strftime("%Y-%m-%d")
    direct = base / f"{today}.ndjson"
    if direct.exists():
        return str(direct)
    files = sorted(base.glob("*.ndjson"))
    return str(files[-1]) if files else str(direct)

def _load_seal(day: str | None = None) -> dict:
    """增量读今天的封单采样文件（只读新增字节，43MB 也能秒回）。"""
    import json as _json
    path = _seal_file(day)
    if _seal["path"] != path:
        _seal.update({"path": path, "offset": 0, "data": {}})
    try:
        with open(path, "rb") as fh:
            fh.seek(_seal["offset"])
            while True:
                line = fh.readline()
                if not line or not line.endswith(b"\n"):
                    break
                _seal["offset"] += len(line)
                try:
                    obj = _json.loads(line.decode("utf-8", "ignore"))
                except Exception:  # noqa: BLE001
                    continue
                t = obj.get("t") or ""
                for row in obj.get("rows") or []:
                    sym = row.get("s")
                    if not sym:
                        continue
                    rec = _seal["data"].setdefault(
                        sym, {"name": row.get("n"), "samples": [], "amt": 0.0, "up": 0, "price": 0.0}
                    )
                    seal = float(row.get("seal") or 0)
                    price = float(row.get("p") or 0)
                    rec["samples"].append([t, seal, price, int(row.get("up") or 0)])
                    if len(rec["samples"]) > 900:
                        rec["samples"] = rec["samples"][-900:]
                    rec["amt"] = max(rec["amt"], float(row.get("amt") or 0))
                    rec["up"] = max(rec["up"], int(row.get("up") or 0))
                    rec["price"] = price or rec["price"]
    except FileNotFoundError:
        pass
    return _seal["data"]

def seal_quality(symbol: str, day: str | None = None) -> dict[str, Any]:
    data = _load_seal(day)
    code, market = split_symbol(symbol)
    key = f"{code}.{market}"
    rec = data.get(key)
    if not rec or len(rec["samples"]) < 2:
        return {"state": "not_sampled", "symbol": key, "hint": "该票不在今天的封单采样池里（采样覆盖 150 只候选）"}
    samples = rec["samples"]
    seals = [s[1] for s in samples if s[1] > 0]
    peak = max(seals) if seals else 0.0
    mid = sorted(seals)[len(seals) // 2] if seals else 0.0
    last = samples[-1][1]
    amount = rec["amt"] or 0.0
    drops = 0
    worst = 0.0
    for i in range(1, len(samples)):
        a, b = samples[i - 1][1], samples[i][1]
        if a > 5e6 and b < a * 0.7:
            drops += 1
            worst = max(worst, 1 - b / a)
    ratio = (last / amount) if amount else 0.0
    flags = []
    if peak < 1e7:
        flags.append("封单薄")
    if amount and ratio < 0.03:
        flags.append("虚板")
    elif amount and ratio < 0.10:
        flags.append("封单偏弱")
    if peak and mid < peak * 0.3:
        flags.append("挂撤反复")
    if drops >= 2:
        flags.append("撤单嫌疑")
    verdict = "虚板" if "虚板" in flags else ("偏弱" if flags else "正常")
    return {
        "state": "ok",
        "symbol": key,
        "name": rec["name"],
        "price": rec["price"],
        "up": bool(rec["up"]),
        "amount": amount,
        "seal": last,
        "seal_peak": peak,
        "seal_median": mid,
        "seal_ratio": ratio,
        "drops": drops,
        "worst_drop": worst,
        "flags": flags,
        "verdict": verdict,
        "date": os.path.basename(_seal["path"]).replace(".ndjson", ""),
        "first_at": samples[0][0],
        "last_at": samples[-1][0],
        "samples": [[s[0], s[1], s[2]] for s in samples[-240:]],
    }

def seal_rank(limit: int = 20, day: str | None = None) -> dict[str, Any]:
    data = _load_seal(day)
    rows = []
    for sym, rec in data.items():
        if not rec["up"] or len(rec["samples"]) < 2:
            continue
        seals = [s[1] for s in rec["samples"] if s[1] > 0]
        if not seals:
            continue
        peak = max(seals)
        mid = sorted(seals)[len(seals) // 2]
        last = rec["samples"][-1][1]
        amount = rec["amt"] or 0
        rows.append(
            {
                "symbol": sym,
                "name": rec["name"],
                "seal": last,
                "seal_peak": peak,
                "seal_median": mid,
                "amount": amount,
                "seal_ratio": (last / amount) if amount else 0,
                "verdict": "虚板" if (amount and last / amount < 0.03) else ("偏弱" if (amount and last / amount < 0.10) else "正常"),
            }
        )
    rows.sort(key=lambda r: r["seal"], reverse=True)
    return {"data": rows[: max(1, min(limit, 100))], "total": len(rows)}


# ---------------------------------------------------------------- 五档（封单采样器依赖）
# 本服务运行在宿主侧（非 TSP 容器），直接用宿主 .venv 的 eltdx 取五档，
# 作为采样器 README 明示的「把 fetchDepth 换成任何返回 {bids,asks} 的接口」逃生舱实现。
# 升级 TSP 镜像不影响本宿主进程；若上游自带 ELTDX /depth5，关闭本路由即可（TSP_* 风格开关待加）。
import threading

_ELTDX_CLIENT = None
_DEPTH_LOCK = threading.Lock()


def _get_eltdx_client():
    global _ELTDX_CLIENT
    if _ELTDX_CLIENT is None:
        from eltdx import TdxClient  # 延迟导入：eltdx 缺失也不影响其他接口
        _ELTDX_CLIENT = TdxClient()
    return _ELTDX_CLIENT


def _strip_suffix(sym: str) -> str:
    """'600519.SH' -> '600519'（eltdx 只认裸 6 位代码）。"""
    s = str(sym).strip().upper()
    return s.split(".", 1)[0] if "." in s else s


def eltdx_depth(symbols: list[str]) -> list[dict[str, Any]]:
    """批量取五档，返回 [{symbol(原 TSP 格式), bids:[[price,volume]×5], asks:[[price,volume]×5]}]。

    失败（eltdx 未装 / TDX 不可达 / 代码非法）一律返回空列表，让采样器安全跳过，不抛 500。
    """
    if not symbols:
        return []
    req_map = {_strip_suffix(s): s for s in symbols if s}  # 裸码 -> 原始 TSP 格式
    bare = list(req_map.keys())
    try:
        with _DEPTH_LOCK:
            page = _get_eltdx_client().quotes.get_depth(bare)
    except Exception:
        return []
    out: list[dict[str, Any]] = []
    for rec in getattr(page, "records", []) or []:
        code = getattr(rec, "code", None) or _strip_suffix(getattr(rec, "full_code", "") or "")
        orig = req_map.get(code)
        if not orig:
            continue
        bids = [[float(lv.price), float(lv.volume)] for lv in (rec.buy_levels or [])]
        asks = [[float(lv.price), float(lv.volume)] for lv in (rec.sell_levels or [])]
        out.append({"symbol": orig, "bids": bids, "asks": asks})
    return out