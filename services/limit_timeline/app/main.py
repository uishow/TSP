"""涨跌停时间轴 · 宿主侧独立 API 服务（端口 3023）。

业务层 limit_pool.py / api/limit_pool.py / market_time.py 从 tdxTSP 逐字节复制，
只提供启动壳：CORS 给 3018 主站的扩展页供数；东财 push2ex 三池由宿主直连
（容器内 source_policy 零外联，必须走宿主旁路）。

启动：
    .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 3023 --no-access-log
"""
from __future__ import annotations

import os
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.limit_pool import router as limit_pool_router

SERVICE = "limit-timeline-adapter"
VERSION = "1.0.0"

app = FastAPI(title="limit timeline adapter", version=VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(limit_pool_router)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": SERVICE,
        "version": VERSION,
        "upstream": "eastmoney push2ex zt/zb/dt",
    }


@app.get("/")
async def root() -> dict[str, Any]:
    return await health()
