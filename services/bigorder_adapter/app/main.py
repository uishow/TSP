"""大单监控 · 独立数据服务（开箱即用，不依赖 ELTDX / TSP 任何组件）

启动：
    python -m uvicorn app.main:app --host 127.0.0.1 --port 3021

只依赖 fastapi / uvicorn / httpx，数据全部来自公开接口：
    · 东方财富 push2    —— 逐笔成交、全市场资金流榜、单票资金流
    · 同花顺 d.10jqka   —— 超大/大/中/小 四类买卖金额
"""

from __future__ import annotations

import asyncio
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import bigorder

app = FastAPI(title="big-order adapter", version="1.0.0")

# 页面跑在 TSP(3018) 域下，必须放行跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", "service": "big-order-adapter", "version": "1.0.0"}


@app.get("/bigorder/flow")
async def flow(symbol: str = Query(...), source: str = Query(default="ths")) -> dict[str, Any]:
    try:
        if source == "em":
            return {"ok": True, "data": await bigorder.em_flow(symbol)}
        return {"ok": True, "data": await bigorder.flow(symbol)}
    except bigorder.BigOrderError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.get("/bigorder/ticks")
async def ticks(
    symbol: str = Query(...),
    pos: int = Query(default=0),
    lmt: int = Query(default=2000),
) -> dict[str, Any]:
    try:
        return {"ok": True, "data": await bigorder.ticks(symbol, pos=pos, lmt=lmt)}
    except bigorder.BigOrderError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.get("/bigorder/screen")
async def screen(limit: int = Query(default=300)) -> dict[str, Any]:
    try:
        return {"ok": True, **await bigorder.screen(limit=limit)}
    except bigorder.BigOrderError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.get("/bigorder/snapshot")
async def snapshot(symbols: str = Query(...)) -> dict[str, Any]:
    picked = [s.strip() for s in symbols.split(",") if s.strip()]
    if not picked:
        raise HTTPException(status_code=400, detail="symbols 为空")
    return {"ok": True, **await bigorder.snapshot(picked)}


@app.get("/bigorder/flow/kline")
async def flow_kline(symbol: str = Query(...)) -> dict[str, Any]:
    try:
        return {"ok": True, "data": await bigorder.flow_kline(symbol)}
    except bigorder.BigOrderError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.get("/bigorder/seal")
async def seal(symbol: str = Query(...), date: str | None = Query(default=None)) -> dict[str, Any]:
    return {"ok": True, "data": bigorder.seal_quality(symbol, date)}


@app.get("/bigorder/seal/rank")
async def seal_rank(limit: int = Query(default=20), date: str | None = Query(default=None)) -> dict[str, Any]:
    return {"ok": True, **bigorder.seal_rank(limit, date)}


@app.get("/bigorder/auction")
async def auction(date: str | None = Query(default=None)) -> dict[str, Any]:
    return {"ok": True, "data": bigorder.auction_strength(date)}


class DepthReq(BaseModel):
    symbols: list[str] = []


@app.post("/depth5")
async def depth5(req: DepthReq) -> dict[str, Any]:
    """五档盘口（封单采样器依赖）：宿主侧 eltdx 取五档，返回 {data:[{symbol,bids,asks}]}。

    与 bigorder_adapter 同端口（3021），便于采样器复用 3021 这一个服务；
    不依赖任何第三方 L2，失败返回空 data 不报错。
    """
    try:
        data = await asyncio.to_thread(bigorder.eltdx_depth, req.symbols)
    except bigorder.BigOrderError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return {"data": data}
