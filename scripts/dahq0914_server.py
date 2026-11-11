#!/usr/bin/env python3
"""大红球 0914 分享版 —— 本地静态服务（TSP 扩展页后端）。

设计原则（TSP 二开铁律）：
- 不碰镜像、不碰 upstream/、不写容器内随镜像分发的文件；本脚本是宿主侧独立
  进程，只把 data-local/ext_pages/dahq0914/ 这个纯静态站点对外提供 HTTP 访问。
- 为什么用「独立端口」而不是 TSP 进程内路由：扩展页 iframe 的同源策略会拒绝
  嵌入与 TSP 同端口(3018)的页面（前端 R() 校验 s.origin===window.location.origin
  返回 null）。用不同端口(8909)天然构成「不同源」，彻底规避之前 wayz 踩过的
  https + 同站拒绝坑；也和项目里已有的大红球系统(8989)/划线(8865)/擒龙(8088)/
  异动(18765) 外部工具接法一致。
- 数据来源：该页面由用户浏览器直连东财/腾讯/新浪/同花顺公开接口取数，不经过
  TSP 容器（容器零外联），本服务只负责把页面与本地资源(css/js/res/DatePicker)
  正确吐给浏览器。
- 升级安全：本服务与主程序完全解耦，升级 TSP 镜像不影响它；菜单登记在
  data-local/analysis_menus/dahq0914.json（被 gitignore，不入库）。

运行：python3 scripts/dahq0914_server.py   （前台常驻，由 launchd KeepAlive 守护）
"""
import os
import sys
import mimetypes
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = Path(__file__).resolve().parent.parent / "data-local" / "ext_pages" / "dahq0914"
HOST = "127.0.0.1"
PORT = 8909
ENTRY = "zhangge_redboll0914.html"

# 确保 .js / .mjs 被浏览器当作脚本执行（macOS 某些 mimetypes 表会落 text/plain）。
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/javascript", ".mjs")
mimetypes.add_type("image/jpeg", ".jpg")
mimetypes.add_type("audio/mpeg", ".mp3")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        # 根路径与无扩展名目录默认指向主页面，避免列目录。
        if self.path in ("/", "/index.html", "/index.htm"):
            self.path = "/" + ENTRY
        super().do_GET()

    def end_headers(self):
        # 允许页面里的 JS 直连第三方行情接口（浏览器侧 CORS 由对方接口决定，
        # 这里只放开对本站资源的同源读取即可；iframe 内的 fetch 仍走正常跨域）。
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        # 写到 stdout，由 launchd 重定向到 runtime 日志；避免刷满系统日志。
        sys.stdout.write("[dahq0914] %s - %s\n" % (self.address_string(), fmt % args))


def main():
    if not ROOT.is_dir():
        sys.stderr.write("静态根目录不存在: %s\n" % ROOT)
        sys.exit(1)
    os.chdir(str(ROOT))
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    sys.stdout.write("大红球0914 静态服务已启动: http://%s:%d/  (根目录 %s)\n" % (HOST, PORT, ROOT))
    sys.stdout.flush()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
