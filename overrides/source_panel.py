"""User-visible source evidence alongside the existing TSP application."""
import os
from datetime import date
from pathlib import Path
import httpx
from fastapi import HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

BASE='http://host.docker.internal:7818'


def _latest_partition_date(root):
    """Read the newest date= partition from directory names only.

    Upstream ``repo.latest_daily_date()`` issues ``SELECT max(date) FROM
    kline_daily`` against the DuckDB view, which scans every parquet partition
    and made /api/local-sources/status take ~4s. The data page already avoids
    this with a zero-scan directory walk (app/api/data.py::_safe_aggregate_daily),
    so use the same approach here.
    """
    latest = None
    try:
        for partition in Path(root).glob('date=*'):
            if not partition.is_dir():
                continue
            try:
                value = date.fromisoformat(partition.name.removeprefix('date='))
            except ValueError:
                continue
            if latest is None or value > latest:
                latest = value
    except OSError:
        return None
    return str(latest) if latest else None


def bridge(method,path,**kwargs):
    try:
        with httpx.Client(base_url=BASE,headers={'Authorization':'Bearer '+os.environ['TSP_BRIDGE_TOKEN']},trust_env=False,timeout=180) as c:
            r=c.request(method,path,**kwargs);r.raise_for_status();return r.json()
    except httpx.HTTPStatusError as exc:
        try:detail=exc.response.json().get('detail')
        except Exception:detail='本地源请求失败'
        raise HTTPException(exc.response.status_code,detail) from exc
    except Exception as exc:raise HTTPException(503,'本地数据桥接不可用，已禁止其他网络源回退') from exc

class Query(BaseModel):
    dataset:str
    symbols:list[str]=Field(default_factory=list,max_length=200)
    start_time:str|None=None
    end_time:str|None=None
    asset_type:str='stock'
    freq:str='1m'
    table:str='raw'
    require_latest:bool=False
    latest_only:bool=True

PAGE='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>TSP · 本地数据源</title>
<style>body{background:#0c1322;color:#dce5f3;font:16px system-ui;max-width:1100px;margin:40px auto;padding:0 24px}a{color:#70cfb7}h1{font-size:30px}section{background:#151f32;border:1px solid #28354b;border-radius:12px;padding:22px;margin:18px 0}input,select,button{font:inherit;padding:9px;margin:4px;border-radius:5px;border:1px solid #456;background:#102238;color:white}button{background:#1a685c;cursor:pointer}pre{white-space:pre-wrap;word-break:break-all;font:13px monospace;max-height:520px;overflow:auto}.muted{color:#acb8cb}strong{color:#9ee3cc}</style>
<a href="/">← 返回量化工作台</a><h1>本地数据源</h1><p class="muted">本地量化数据优先 · 通达信文件补充 · 实时联网仅 eltdx / 显式 AxData</p>
<section><h2>运行与来源状态</h2><p>日 K / 分钟线使用原始价，成交量单位为手、成交额为元。时间与覆盖范围以每次实际响应为准。</p><p><strong>全市场实时行情已接入 eltdx：交易日期取自 TDX 握手，逐标的 HHMM 校验新鲜度，无成交或过期快照不入库；单标的秒级时刻未独立验证。五档盘口已接入 eltdx 原生 0x0547（握手日期 + 逐标的 HHMMSS，缺档/无时钟显式失败，不补零）。财务为观察层：报告期取自本地 gpcw 报告头，最新命名快照取自 eltdx finance_batch；公告日未核验、announce_date 保持空值，PIT 财务因子与完整三大报表历史仍关闭。历史前复权不等同历史时点可用性证明。</strong></p><button onclick="status()">刷新来源状态</button><pre id="state">读取中…</pre></section>
<section><h2>核对真实数据</h2><label>标的 <input id="symbol" value="600031.SH"></label><label>数据 <select id="dataset"><option value="daily">原始日 K</option><option value="minute">5 分钟线</option><option value="adj_factor">除权事件</option><option value="realtime">eltdx / AxData 快照</option><option value="depth5">eltdx 原生五档盘口</option><option value="financial">通达信专业财务原始观察</option><option value="export_daily">通达信导出前复权观察</option><option value="fuyao">fuyao 离线增强（官方财务/分类）</option><option value="boards">本地板块映射</option></select></label><label>财务表 <select id="table"><option value="raw">raw（编号列原始观察）</option><option value="observation">observation</option><option value="metrics">metrics（观察层）</option><option value="income">income（观察层）</option><option value="balance_sheet">balance_sheet（观察层）</option><option value="cash_flow">cash_flow（观察层）</option><option value="shares">shares（观察层）</option><option value="announce_candidates">fuyao 候选公告日（非 PIT）</option><option value="concept">fuyao 官方概念成分</option><option value="industry">fuyao 官方行业成分</option><option value="status">fuyao 离线导入状态</option></select></label><br><label>开始 <input id="start" type="date"></label><label>结束 <input id="end" type="date"></label><button onclick="query()">读取并核对</button><p class="muted">财务原始列 col1… 尚未完成字段含义与公告日期核验；观察层 announce_date 为空且 pit_verified=false，不能作为已验证的财务回测输入。导出前复权与原始价独立展示。</p><pre id="result">选择数据后读取。</pre></section>
<section><h2>同花顺官方离线增强（fuyao）</h2><p>Key 仅保存在宿主机 <code>runtime/fuyao.env</code>（0600，不挂载进容器）。宿主机侧离线拉取官方概念/行业分类与财务三表，产物写入 <code>data-local/fuyao/</code>，容器只读本地文件，网络白名单、能力矩阵、上游镜像均未改动。</p><p><strong>重要：实测 report_date_ms 不是可验证的 PIT 公告日。</strong>最近约 4 期表现为个股披露日，历史期被按季度回填为最新批次日（滞后 389–479 天），且三表在同一报告期偶有冲突。因此仅保存为「候选公告日 + 质量标签」，<code>announce_date</code> 保持空值，<code>pit_verified=false</code>，PIT 财务因子/回测仍关闭。官方分类为当前成分快照，无历史版本。</p><button onclick="publishFuyao()">发布官方分类为独立表</button><pre id="fuyao">未执行</pre></section>
<script>
async function status(){try{let r=await fetch('/api/local-sources/status');document.getElementById('state').textContent=JSON.stringify(await r.json(),null,2)}catch(e){document.getElementById('state').textContent=String(e)}}
async function query(){let d=document.getElementById('dataset').value;let body={dataset:d,symbols:[document.getElementById('symbol').value],start_time:document.getElementById('start').value||null,end_time:document.getElementById('end').value||null,freq:'5m',table:document.getElementById('table').value};document.getElementById('result').textContent='读取中…';try{let r=await fetch('/api/local-sources/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});let j=await r.json();document.getElementById('result').textContent=JSON.stringify(j,null,2)}catch(e){document.getElementById('result').textContent=String(e)}}
async function publishFuyao(){document.getElementById('fuyao').textContent='发布中…';try{let r=await fetch('/api/local-sources/fuyao/publish',{method:'POST'});document.getElementById('fuyao').textContent=JSON.stringify(await r.json(),null,2)}catch(e){document.getElementById('fuyao').textContent=String(e)}}
let today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'});document.getElementById('end').value=today;let old=new Date(Date.now()-14*86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'});document.getElementById('start').value=old;status();
</script></html>'''

# 入口卡片：仅在 TSP 原生「数据」页 (/data) 显示，不再作为全站右上角浮动链接。
# 通过一小段脚本监听前端路由变化 (pushState / replaceState / popstate)，
# 即使客户端在页面间切换，也能正确显隐，且不会覆盖其他页面。
BANNER='''<div id="local-source-entry" style="display:none;position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:9998;background:#0f3d36;color:#eafff8;border:1px solid #1c6a5d;border-radius:10px;font:14px system-ui;padding:11px 16px;box-shadow:0 6px 20px rgba(0,0,0,.4);display:flex;align-items:center;gap:14px;max-width:92vw"><span>本地数据源：查看本地数据来源、抽查真实样本、管理同花顺官方离线增强。</span><a href="/local-sources" style="background:#1a685c;color:#eafff8;padding:7px 13px;border-radius:7px;text-decoration:none;font-weight:600;white-space:nowrap">打开 →</a><button id="local-source-close" style="background:transparent;border:none;color:#9fd;cursor:pointer;font-size:18px;line-height:1;padding:0 2px">×</button></div>
<script>(function(){var b=document.getElementById('local-source-entry');function s(){b.style.display=(location.pathname==='/data')?'flex':'none';}s();var p=history.pushState;history.pushState=function(){p.apply(this,arguments);s();};var r=history.replaceState;history.replaceState=function(){r.apply(this,arguments);s();};window.addEventListener('popstate',s);document.getElementById('local-source-close').addEventListener('click',function(){b.style.display='none';});})();</script>'''

def attach(app):
    before=len(app.router.routes)
    @app.get('/api/local-sources/status')
    def status():
        result=bridge('GET','/status')
        repo=getattr(app.state,'repo',None)
        if repo is not None:
            store=getattr(repo,'store',None)
            data_dir=getattr(store,'data_dir',None) if store is not None else None
            if data_dir is None:
                # Best-effort fallback; keep the old slow path rather than drop the field.
                result['tsp_storage']={
                    'latest_daily_date':str(repo.latest_daily_date()),
                    'latest_enriched_date':str(repo.latest_enriched_date()),
                    'directory':'data-local',
                    'prior_tickflow_data':'preserved separately in data/',
                    'stat_mode':'duckdb-fallback',
                }
            else:
                result['tsp_storage']={
                    'latest_daily_date':_latest_partition_date(Path(data_dir)/'kline_daily'),
                    'latest_enriched_date':_latest_partition_date(Path(data_dir)/'kline_daily_enriched'),
                    'directory':'data-local',
                    'prior_tickflow_data':'preserved separately in data/',
                    'stat_mode':'partition-dir (no parquet scan)',
                }
        return result
    @app.post('/api/local-sources/query')
    def query(req:Query):return bridge('POST','/query',json=req.model_dump())
    @app.post('/api/local-sources/fuyao/publish')
    def fuyao_publish():
        """Publish host-side official classifications as independent ext tables."""
        try:
            from app.config import settings
            from app.services.ext_data import ExtConfigStore
            from overrides.local_extensions import publish_official_boards
            counts = publish_official_boards(ExtConfigStore(settings.data_dir),
                                            settings.data_dir)
            return {'ok': True, 'published': counts,
                    'builtin_tables_untouched': ['ext_gn_ths', 'ext_hy_ths'],
                    'container_egress': 'UNCHANGED_BLOCKED', 'pit_verified': False,
                    'note': '仅在 data-local/fuyao/manifest.json 标记导入完整时发布；'
                            '不完整或缺失时返回空结果，不写入半成品分类。'}
        except Exception as exc:
            raise HTTPException(503, f'官方分类发布失败: {exc}') from exc
    @app.get('/local-sources',response_class=HTMLResponse)
    def page():return PAGE
    @app.middleware('http')
    async def source_link(request,call_next):
        response=await call_next(request)
        if response.status_code==200 and response.headers.get('content-type','').startswith('text/html') and request.url.path!='/local-sources':
            content=b''.join([chunk async for chunk in response.body_iterator])
            content=content.replace(b'</body>',BANNER.encode()+b'</body>')
            headers=dict(response.headers);headers.pop('content-length',None)
            return HTMLResponse(content,status_code=response.status_code,headers=headers)
        return response

    # The upstream SPA catch-all was registered before deployment extensions.
    added=app.router.routes[before:]
    original=app.router.routes[:before]
    index=next((i for i,r in enumerate(original) if getattr(r,"path",None)=="/{full_path:path}"),len(original))
    app.router.routes[:]=original[:index]+added+original[index:]
