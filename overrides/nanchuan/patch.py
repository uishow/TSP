"""南川三代 0801D 分时主图 · 运行时注入补丁（不碰镜像 / upstream / 容器内文件）。

铁律（与 TSP 二开总约束一致）：
  - 只在挂载卷 overrides/ 内新增本模块，由 bootstrap.py 注册；镜像、tag、digest、
    compose、upstream/、容器 /app/app 与 /app/static 一行不改。
  - 用 ASGI middleware 在同源 HTML 的 </body> 前注入一段自包含脚本：core.js（指标内核）
    + client.js（复刻画布 + 开关 + 降级）。前端资源按「文件内容」注入，不硬编码带 hash 的 chunk 名。
  - 自动识别个股详情 · 分时视图目标容器（dialog + 分时走势 + .tv-lightweight-charts），
    找不到容器 / 取数失败 / 计算异常一律退回原图并记 SKIPPED，绝不白屏、绝不阻断启动。
  - 一键开关：TSP_NANCHUAN=0 完全不注入（恢复原版）；页面浮动按钮可实时切换并记住状态。
  - 只注入 HTML（text/html 且非 JSON），SSE / 接口 / bundle 一律原样放行。

配置项：
  TSP_NANCHUAN=0        总开关，默认开启（=1）。设 0 则连脚本都不下发。
  页面 localStorage tsp-nanchuan=0/1   用户级实时开关（默认 1），按钮在右下角。

说明：本补丁只做「视觉叠加」——分时价格线、a9 黄色均价虚线、四条锚定水平线、
六个信号文字，全部由用户提供的通达信公式逐条翻译而来，口径零改；不产生买卖建议、
不下单、不改主站任何数据与数据源。
"""
from __future__ import annotations

import logging
import os
from pathlib import Path

from fastapi.responses import HTMLResponse

log = logging.getLogger("tsp.nanchuan")

_HERE = Path(__file__).resolve().parent
_ENV = "TSP_NANCHUAN"
_DISABLE_FLAG = _HERE / "nanchuan.disabled"
_ATTACH_FLAG = "_tsp_nanchuan_attached"

# 注入脚本缓存（attach 时读一次；避免每请求读盘）
_PAYLOAD: bytes | None = None
_ANNOUNCED = False


def enabled() -> bool:
    if os.environ.get(_ENV, "1") == "0":
        return False
    if _DISABLE_FLAG.exists():
        return False
    return True


def _load_payload() -> bytes:
    global _PAYLOAD
    if _PAYLOAD is not None:
        return _PAYLOAD
    core = (_HERE / "core.js").read_text(encoding="utf-8")
    client = (_HERE / "client.js").read_text(encoding="utf-8")
    # 两块脚本用 IIFE 各自闭合，直接拼接不会互相污染；core 先执行以便 client 拿到 NanchuanCore。
    script = (
        "\n<!-- TSP_NANCHUAN injected: 南川三代0801D 分时主图（运行时叠加，可开关） -->\n"
        "<script>\n" + core + "\n</script>\n"
        "<script>\n" + client + "\n</script>\n"
    )
    _PAYLOAD = script.encode("utf-8")
    return _PAYLOAD


def attach(app) -> None:
    """由 overrides/bootstrap.py 调用；幂等。"""
    if getattr(app.state, _ATTACH_FLAG, False):
        return
    setattr(app.state, _ATTACH_FLAG, True)

    if not enabled():
        log.warning("NANCHUAN_PATCH_SKIPPED: %s=0 或存在 nanchuan.disabled（人工关闭）", _ENV)
        return

    try:
        payload = _load_payload()
        core = (_HERE / "core.js").read_text(encoding="utf-8")
        client = (_HERE / "client.js").read_text(encoding="utf-8")
        assert "NanchuanCore" in core and "nanchuan-switch" in client, "注入脚本内容校验失败"
    except Exception as exc:  # 脚本缺失 / 读失败 -> 原样启动，绝不影响主站
        log.warning("NANCHUAN_PATCH_SKIPPED: 注入脚本不可用 %s", exc)
        return

    @app.middleware("http")
    async def nanchuan_inject(request, call_next):
        response = await call_next(request)
        ctype = response.headers.get("content-type", "")
        if (
            response.status_code == 200
            and ctype.startswith("text/html")
            and not request.url.path.startswith("/api/")
        ):
            try:
                content = b"".join([chunk async for chunk in response.body_iterator])
            except Exception as exc:  # 读流失败：不注入，原样透传（不返回空页，绝不白屏）
                log.warning("NANCHUAN_PATCH_SKIPPED: 读取响应流失败，原样透传 %s", exc)
                return response
            # 读流成功后，注入失败也只影响脚本，HTML 主体原样保留。
            out = content
            try:
                if b"</body>" in content.lower():
                    out = _insert_before_body(content, payload)
            except Exception as exc:
                log.warning("NANCHUAN_PATCH_SKIPPED: 脚本拼接失败，返回原 HTML %s", exc)
                out = content
            headers = dict(response.headers)
            headers.pop("content-length", None)
            return HTMLResponse(out, status_code=response.status_code, headers=headers)
        return response

    global _ANNOUNCED
    if not _ANNOUNCED:
        _ANNOUNCED = True
        log.info(
            "NANCHUAN_PATCH_ACTIVE: injected=%dB core=%dB client=%dB switch=TSP_NANCHUAN(default=1)/localStorage(tsp-nanchuan)",
            len(payload), len(core.encode("utf-8")), len(client.encode("utf-8")),
        )


def _insert_before_body(content: bytes, payload: bytes) -> bytes:
    lower = content.lower()
    idx = lower.rfind(b"</body>")
    if idx < 0:
        return content
    return content[:idx] + payload + content[idx:]
