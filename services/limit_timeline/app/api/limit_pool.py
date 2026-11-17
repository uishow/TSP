"""涨跌停板池时间轴 API。"""
from __future__ import annotations

import re
from datetime import date

from fastapi import APIRouter, HTTPException, Query

from app.market_time import cn_today
from app.services import limit_pool

router = APIRouter(prefix="/api/limit-pool", tags=["limit-pool"])

_DATE_RE = re.compile(r"^(\d{4})-?(\d{2})-?(\d{2})$")


def _parse_day(raw: str | None) -> date:
    if not raw:
        return cn_today()
    match = _DATE_RE.match(raw.strip())
    if not match:
        raise HTTPException(status_code=400, detail="date 需为 YYYY-MM-DD 或 YYYYMMDD")
    try:
        return date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="date 不是合法日期") from exc


@router.get("/timeline")
async def timeline(
    date_str: str | None = Query(None, alias="date"),
    refresh: int = 0,
) -> dict:
    """某日的涨停 / 炸板 / 跌停时间轴。

    ``refresh=1`` 跳过服务端短缓存强制回源 (前端「重载」用)。
    """
    day = _parse_day(date_str)
    return await limit_pool.fetch_timeline(day, force=bool(refresh))
