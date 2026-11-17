#!/usr/bin/env python3
"""新看板 / 涨跌停时间轴 浏览器端到端验证（CDP，只读）。

前置：
  1) 本地主站 http://127.0.0.1:3018 可访问
  2) 宿主 3023 时间轴服务已启动（scripts/limit_timeline_manage.py status）
  3) 无头浏览器已开调试端口：
     "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
       --headless=new --disable-gpu --no-sandbox --no-first-run \
       --remote-debugging-port=9339 --user-data-dir=/tmp/chrome_newdash_cdp about:blank

用法：
  .venv/bin/python scripts/verify_new_dashboard_cdp.py --port 9339 \
      --out tasks/new_dashboard_cdp_verify.json

只读取页面状态、切换页面主题后立刻恢复，不做任何写操作。
"""
from __future__ import annotations

import argparse
import json
import time
import urllib.request

import websocket  # websocket-client

MAIN = "http://127.0.0.1:3018"
TIMELINE = "http://127.0.0.1:3023/api/limit-pool/timeline"


def http_json(url: str, timeout: float = 10.0) -> dict:
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


class CDP:
    def __init__(self, ws_url: str):
        self.ws = websocket.create_connection(ws_url, timeout=20, suppress_origin=True)
        self.seq = 0
        self.events: list[dict] = []

    def send(self, method: str, params: dict | None = None) -> dict:
        self.seq += 1
        mid = self.seq
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result", {})
            self.events.append(msg)

    def drain(self, seconds: float) -> None:
        end = time.time() + seconds
        self.ws.settimeout(max(0.2, min(2.0, end - time.time())))
        while time.time() < end:
            try:
                self.events.append(json.loads(self.ws.recv()))
            except Exception:
                return
        self.ws.settimeout(20)

    def evaluate(self, expr: str) -> object:
        r = self.send("Runtime.evaluate", {
            "expression": expr,
            "returnByValue": True,
            "awaitPromise": True,
        })
        if "exceptionDetails" in r:
            return {"__exception__": str(r["exceptionDetails"].get("text"))}
        return r.get("result", {}).get("value")

    def close(self) -> None:
        try:
            self.ws.close()
        except Exception:
            pass


JS_SHADOW = r"""(() => {
  const host = [...document.querySelectorAll('*')]
    .find(e => e.shadowRoot && e.shadowRoot.querySelector('.as-root'));
  if (!host) return { mounted: false };
  const s = host.shadowRoot;
  const w = s.querySelector('.as-root');
  const text = [...s.querySelectorAll('*')]
    .filter(e => e.children.length === 0 && !['STYLE','SCRIPT'].includes(e.tagName))
    .map(e => (e.textContent || '').trim()).filter(Boolean)
    .join(' ').replace(/\s+/g, ' ');
  return {
    mounted: true,
    textLen: text.length,
    textHead: text.slice(0, 1200),
    hasTitle: text.includes('新看板'),
    hasKpi: ['上涨率','封板率','最高连板','成交额'].every(k => text.includes(k)),
    hasTimeline: text.includes('涨跌停时间轴'),
    timelineHeadline: (text.match(/涨跌停时间轴\s*涨停\s*\d+\s*·\s*炸板\s*\d+\s*·\s*跌停\s*\d+/) || [''])[0],
    timelineFooter: (text.match(/\d+ 个时间点 \/ \d+ 条/) || [''])[0],
    hasMainBlocks: ['涨跌分布','情绪雷达','趋势强度','涨停梯队','监控中心'].every(k => text.includes(k)),
    trs: s.querySelectorAll('tr').length,
    wrapperDark: w.classList.contains('dark'),
    bg: getComputedStyle(w).backgroundColor,
    color: getComputedStyle(w).color,
  };
})()"""

JS_THEME_TOGGLE = r"""(() => {
  const before = !document.documentElement.classList.contains('dark');
  document.documentElement.classList.toggle('dark', before);
  localStorage.setItem('tf-theme', before ? 'dark' : 'light');
  window.dispatchEvent(new Event('tf-theme-change'));
  const host = [...document.querySelectorAll('*')]
    .find(e => e.shadowRoot && e.shadowRoot.querySelector('.as-root'));
  const w = host && host.shadowRoot.querySelector('.as-root');
  return { htmlDark: document.documentElement.classList.contains('dark'),
           wrapperDark: !!(w && w.classList.contains('dark')),
           bg: w ? getComputedStyle(w).backgroundColor : null };
})()"""

JS_THEME_RESTORE = r"""(() => {
  document.documentElement.classList.remove('dark');
  localStorage.setItem('tf-theme', 'light');
  window.dispatchEvent(new Event('tf-theme-change'));
  const host = [...document.querySelectorAll('*')]
    .find(e => e.shadowRoot && e.shadowRoot.querySelector('.as-root'));
  const w = host && host.shadowRoot.querySelector('.as-root');
  return { htmlDark: document.documentElement.classList.contains('dark'),
           wrapperDark: !!(w && w.classList.contains('dark')) };
})()"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=9339)
    ap.add_argument("--out", default="")
    args = ap.parse_args()

    base = f"http://127.0.0.1:{args.port}"
    ver = http_json(f"{base}/json/version")
    browser = CDP(ver["webSocketDebuggerUrl"])
    created = browser.send("Target.createTarget", {"url": "about:blank"})
    browser.close()

    targets = http_json(f"{base}/json/list")
    page = next((t for t in targets if t.get("id") == created["targetId"]), None)
    if page is None:
        raise SystemExit("created target not found")

    c = CDP(page["webSocketDebuggerUrl"])
    c.send("Runtime.enable")
    c.send("Log.enable")
    c.send("Network.enable")
    c.send("Page.enable")

    # 1) 主站侧栏
    c.send("Page.navigate", {"url": f"{MAIN}/"})
    c.drain(5.0)
    sidebar = c.evaluate("""(() => {
      const links = [...document.querySelectorAll('a,button')]
        .filter(e => (e.textContent||'').trim().includes('新看板'))
        .map(e => ({tag:e.tagName, text:(e.textContent||'').trim().slice(0,40),
                    href:e.getAttribute('href')||''}));
      return { found: links.length > 0, links };
    })()""")

    # 2) 新看板页面
    c.send("Page.navigate", {"url": f"{MAIN}/custom/new-dashboard"})
    c.drain(9.0)
    shadow = c.evaluate(JS_SHADOW)

    # 3) 主题切换（随后恢复）
    theme_dark = c.evaluate(JS_THEME_TOGGLE)
    theme_light = c.evaluate(JS_THEME_RESTORE)

    c.drain(2.0)
    errors: list[str] = []
    netfail: list[str] = []
    for e in c.events:
        m = e.get("method")
        if m == "Runtime.exceptionThrown":
            d = e.get("params", {}).get("exceptionDetails", {})
            errors.append(f"exception: {d.get('text')} {d.get('exception', {}).get('description', '')[:200]}")
        elif m == "Runtime.consoleAPICalled" and e.get("params", {}).get("type") == "error":
            args = e.get("params", {}).get("args", [])
            errors.append("console.error: " + " ".join(str(a.get("value") or a.get("description", ""))[:200] for a in args))
        elif m == "Log.entryAdded":
            en = e.get("params", {}).get("entry", {})
            if en.get("level") == "error":
                errors.append(f"log: {en.get('text','')[:200]}")
        elif m == "Network.loadingFailed":
            p = e.get("params", {})
            if p.get("errorText") not in ("net::ERR_ABORTED",):
                netfail.append(f"{p.get('errorText')} requestId={p.get('requestId')}")

    # 4) 与宿主 API 对照
    api = http_json(TIMELINE, timeout=20)
    counts = api.get("counts") or {}
    report = {
        "checked_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "sidebar": sidebar,
        "shadow": shadow,
        "theme": {"to_dark": theme_dark, "back_to_light": theme_light},
        "api_counts": counts,
        "api_events": len(api.get("events") or []),
        "api_stale": api.get("stale"),
        "api_errors": api.get("errors"),
        "console_errors": errors,
        "network_failures": netfail,
    }
    text = json.dumps(report, ensure_ascii=False, indent=2)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(text + "\n")
        print(f"written: {args.out}")
    else:
        print(text)
    c.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
