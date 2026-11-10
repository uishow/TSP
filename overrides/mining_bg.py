"""方案 C：自动挖掘「后台代提交 + 独立新页」(2026-11-10)。

大白话：原系统「自动挖掘」按钮一点，网页要干等 40 多秒的因子预筛，
前端自己设了 30 秒就断开，所以按钮看着像坏了。这里不改原按钮、不改镜像、
不改容器内随镜像分发的前端文件，只在二开层加一个「后台代办窗口」：

  点「开始后台挖掘」 → 立刻拿到一个任务编号（秒回）
  → 服务端后台线程替你把那个 40 秒的活干完并启动真正的挖掘
  → 关掉网页、刷新、甚至重启前回来，输入编号都能看到进度和结果

任务清单落在 data-local/mining_bg/jobs.json（挂载卷），关网页不丢。
所有进度/结果仍读 TSP 原生的 /api/backtest/mining/runs/*，不另造一套。

铁律：不改镜像 / digest / compose / upstream / 容器内 /app/app 与 /app/static；
路由只在 overrides 层新增并插到 SPA 通配路由之前；TSP_MINING_BG=0 一键关闭
（不注册任何路由）；任何异常只记日志、接口不 500、绝不影响 TSP 启动。
"""
from __future__ import annotations

import json
import logging
import os
import threading
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

import httpx
from fastapi import Request
from fastapi.responses import HTMLResponse, JSONResponse

logger = logging.getLogger(__name__)

BASE = os.environ.get('TSP_MINING_BG_BASE', 'http://127.0.0.1:3018')
DATA_DIR = Path(os.environ.get('TSP_DATA_DIR', '/app/data'))
JOBS_FILE = DATA_DIR / 'mining_bg' / 'jobs.json'
_JOBS_LOCK = threading.RLock()
_ACTIVE_LOCK = threading.Lock()
_POLL_SECONDS = 5
_MAX_POLL_SECONDS = 3 * 60 * 60
_TERMINAL = ('succeeded', 'success', 'failed', 'cancelled', 'canceled', 'error')


def _enabled() -> bool:
    return os.environ.get('TSP_MINING_BG', '1') != '0'


def _load_jobs() -> list[dict[str, Any]]:
    try:
        if JOBS_FILE.exists():
            data = json.loads(JOBS_FILE.read_text(encoding='utf-8'))
            return data if isinstance(data, list) else []
    except Exception as exc:  # noqa: BLE001
        logger.warning('MINING_BG_JOBS_READ_FAILED: %s', exc)
    return []


def _save_jobs(jobs: list[dict[str, Any]]) -> None:
    try:
        JOBS_FILE.parent.mkdir(parents=True, exist_ok=True)
        tmp = JOBS_FILE.with_suffix('.tmp')
        tmp.write_text(json.dumps(jobs[-100:], ensure_ascii=False, indent=2), encoding='utf-8')
        tmp.replace(JOBS_FILE)
    except Exception as exc:  # noqa: BLE001
        logger.warning('MINING_BG_JOBS_WRITE_FAILED: %s', exc)


def _update(job_id: str, **fields) -> dict[str, Any] | None:
    with _JOBS_LOCK:
        jobs = _load_jobs()
        for job in jobs:
            if job.get('job_id') == job_id:
                job.update(fields)
                job['updated_at'] = datetime.now().isoformat(timespec='seconds')
                _save_jobs(jobs)
                return dict(job)
    return None


def _get(job_id: str) -> dict[str, Any] | None:
    with _JOBS_LOCK:
        for job in _load_jobs():
            if job.get('job_id') == job_id:
                return dict(job)
    return None


def _run_status(client: httpx.Client, run_id: str) -> dict[str, Any]:
    """进度仍以 TSP 原生任务为准, 这里只做透传, 不另造状态。"""
    try:
        r = client.get(f'{BASE}/api/backtest/mining/runs/{run_id}', timeout=20)
        r.raise_for_status()
        data = r.json()
        run = data.get('run', data) if isinstance(data, dict) else {}
        return {
            'status': str(run.get('status') or ''),
            'progress': run.get('progress'),
            'message': run.get('message') or run.get('error') or '',
            'raw': data if isinstance(data, dict) else {},
        }
    except Exception as exc:  # noqa: BLE001
        return {'status': '', 'progress': None, 'message': str(exc)[:200], 'raw': {}}


def _worker(job_id: str, body: dict[str, Any]) -> None:
    """后台线程：替用户把那个 40 秒的请求发完，再盯着原生的挖掘任务。"""
    with _ACTIVE_LOCK:
        try:
            _update(job_id, state='screening', note='正在筛选因子（约 40 秒），网页可以关掉')
            with httpx.Client(trust_env=False, timeout=300) as client:
                resp = client.post(f'{BASE}/api/backtest/mining/auto', json=body)
                if resp.status_code >= 400:
                    _update(job_id, state='failed',
                            error=f'原系统返回 HTTP {resp.status_code}: {resp.text[:300]}')
                    return
                data = resp.json()
                screening = data.get('screening') or {}
                pool = screening.get('pool') or []
                if not data.get('started'):
                    _update(job_id, state='no_qualified_factors',
                            screening_count=len(pool),
                            note='本轮没有达标的因子，没有启动挖掘（这是正常业务结果）')
                    return
                run = data.get('run') or {}
                run_id = str(run.get('run_id') or run.get('id') or '')
                _update(job_id, state='running', run_id=run_id,
                        screening_count=len(pool), note='挖掘已在后台跑起来了')
                started = time.time()
                while time.time() - started < _MAX_POLL_SECONDS:
                    time.sleep(_POLL_SECONDS)
                    st = _run_status(client, run_id) if run_id else {'status': ''}
                    _update(job_id, note=st.get('message') or '',
                            progress=st.get('progress'), run_status=st.get('status'))
                    if str(st.get('status') or '').lower() in _TERMINAL:
                        final = 'succeeded' if str(st['status']).lower() in ('succeeded', 'success') else str(st['status']).lower()
                        _update(job_id, state=final, finished_at=datetime.now().isoformat(timespec='seconds'))
                        return
                _update(job_id, state='timeout', note='超过 3 小时仍未结束，请到原系统 /mining 查看')
        except Exception as exc:  # noqa: BLE001
            logger.warning('MINING_BG_WORKER_FAILED job=%s: %s', job_id, exc)
            _update(job_id, state='failed', error=str(exc)[:400])


PAGE = r'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>后台挖掘 · TSP</title><style>
:root{--ink:#12283a;--sub:#5b7186;--blue:#1f6feb;--cyan:#0aa2b5;--green:#18a06a;--line:#dbe7ee;--bg:#f4f9fc;--card:#fff}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.7 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif}
header{position:sticky;top:0;z-index:9;background:linear-gradient(100deg,#123b5e,#0aa2b5);color:#fff;padding:14px 26px;display:flex;align-items:center;gap:18px;box-shadow:0 2px 12px #123b5e22}
header a{color:#fff;text-decoration:none;font-size:14px;border:1px solid #ffffff66;padding:5px 12px;border-radius:7px}
header b{font-size:18px}header small{opacity:.85;margin-left:auto;font-size:13px}
main{max-width:1080px;margin:22px auto;padding:0 18px;display:grid;grid-template-columns:1fr 340px;gap:20px}
@media(max-width:860px){main{grid-template-columns:1fr}}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px;margin-bottom:18px;box-shadow:0 1px 4px #123b5e0d}
h2{margin:0 0 12px;font-size:17px;color:#124b6e;border-left:4px solid var(--cyan);padding-left:10px}
label{display:block;font-size:13px;color:var(--sub);margin:10px 0 4px}
input,select{width:100%;padding:9px 11px;border:1px solid var(--line);border-radius:7px;font-size:14px;background:#fff;color:var(--ink)}
button{cursor:pointer;border:0;border-radius:8px;padding:10px 18px;font-size:14px;font-weight:600;background:var(--blue);color:#fff}
button.sec{background:#eaf3f8;color:#155078;border:1px solid var(--line)}
button:disabled{opacity:.5;cursor:not-allowed}
.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.hint{background:#eef7fb;border-left:3px solid var(--cyan);padding:11px 14px;border-radius:0 7px 7px 0;font-size:13px;color:#28536c;margin:12px 0}
.state{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;background:#e8f1f7;color:#155078}
.state.ok{background:#e3f7ee;color:#0d7a50}.state.bad{background:#fdeaea;color:#b03030}
.kv{display:grid;grid-template-columns:110px 1fr;gap:6px 10px;font-size:13px;margin-top:10px}
.kv b{color:var(--sub);font-weight:500}
code{background:#eef4f8;padding:2px 6px;border-radius:4px;font-size:12px;word-break:break-all}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:8px 6px;border-bottom:1px solid var(--line)}
th{color:var(--sub);font-weight:500}tr:hover td{background:#f6fbfd}
.muted{color:var(--sub);font-size:12px}
.err{background:#fdeaea;color:#a52a2a;padding:10px 12px;border-radius:7px;font-size:13px;display:none;margin-top:10px}
</style></head><body>
<header><a href="/">← 返回主系统</a><b>后台挖掘</b><small>不用干等 · 关掉网页也在挖</small></header>
<main>
<section>
  <div class="card"><h2>一句话说明</h2>
    <p style="margin:0">原系统的「自动挖掘」按钮要等 40 多秒筛因子，网页 30 秒就自己断开了。这里改成：<b>你点一下，立刻给你一个任务编号</b>，剩下的活由服务器在后台干完。关掉网页、过一会儿回来，输入编号就能接着看进度和结果。</p>
    <div class="hint">点哪里 → 填好日期按「开始后台挖掘」 → 立刻出现编号 → 结果在哪看 → 下面「当前任务」和历史列表；出错怎么查 → 卡片里会直接写原因，或看 <code>runtime/</code> 下 TSP 日志。</div>
  </div>
  <div class="card"><h2>开始一次挖掘</h2>
    <div class="row">
      <div><label>资产类型</label><select id="asset"><option value="stock">股票</option><option value="etf">ETF</option></select></div>
      <div><label>预算档</label><select id="profile"><option value="balanced">balanced（均衡，推荐）</option><option value="strict">strict（严格）</option></select></div>
      <div><label>开始日期</label><input id="start" value="2020-01-01"></div>
      <div><label>结束日期</label><input id="end" value="/*TODAY*/"></div>
    </div>
    <label style="margin-top:14px"><input type="checkbox" id="force" style="width:auto"> 忽略已有结果，强制重跑</label>
    <div style="margin-top:16px;display:flex;gap:10px;align-items:center">
      <button id="go">开始后台挖掘</button><span class="muted" id="goHint">点了就秒回编号，不用等</span>
    </div>
    <div class="err" id="err"></div>
    <div class="hint">默认从 2020 年开始：全市场这一段是本机实测跑得通的（约 31GiB / 40GiB 上限）。<b>不建议填 2000 年</b> —— 6504 个交易日会超出内存，这是机器能力边界，不是按钮坏了。</div>
  </div>
  <div class="card"><h2>当前任务</h2>
    <div id="cur" class="muted">还没有任务。点上面的按钮开始。</div>
  </div>
  <div class="card"><h2>历史任务（关掉网页也不会丢）</h2>
    <label>按编号 / 状态筛选</label><input id="q" placeholder="输入任务编号或状态关键字">
    <div id="jobs" style="margin-top:10px"></div>
  </div>
</section>
<aside>
  <div class="card"><h2>状态是什么意思</h2>
    <div class="kv"><b>queued</b><span>刚接到，还没开始</span><b>screening</b><span>正在筛因子（约 40 秒）</span>
    <b>running</b><span>挖掘已在后台跑</span><b>succeeded</b><span>跑完了，去 <a href="/mining" target="_blank">原系统挖掘页</a> 看结果</span>
    <b>no_qualified_factors</b><span>本轮没有达标因子，正常业务结果</span><b>failed</b><span>出错，卡片里会写原因</span></div>
  </div>
  <div class="card"><h2>和原系统的关系</h2>
    <p class="muted" style="margin:0">原系统一行没改。这里只是替你把那个慢请求放到后台发，进度和结果仍然读 TSP 自带的 <code>/api/backtest/mining/runs/*</code>。关掉这个开关（<code>TSP_MINING_BG=0</code>）或 TSP 升级后，最坏是这个新页不出现，主功能照常。</p>
  </div>
</aside>
</main>
<script>
const $=id=>document.getElementById(id);
let curId=null,timer=null;
function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function badge(s){const k=String(s||'');const c=/succeeded|success|ok/.test(k)?'ok':/fail|error|cancel|timeout/.test(k)?'bad':'';return '<span class="state '+c+'">'+esc(k)+'</span>'}
async function api(url,opt){const r=await fetch(url,opt);if(!r.ok)throw new Error('HTTP '+r.status+' '+(await r.text()).slice(0,160));return r.json()}
function showErr(e){$('err').style.display='block';$('err').textContent='出错了：'+e.message}
async function refresh(){
  try{
    const jobs=await api('/api/mining-bg/jobs');
    const q=$('q').value.trim().toLowerCase();
    const rows=jobs.filter(j=>!q||[j.job_id,j.state,j.run_id].some(x=>String(x||'').toLowerCase().includes(q)));
    $('jobs').innerHTML=rows.length?('<table><tr><th>时间</th><th>编号</th><th>状态</th><th>操作</th></tr>'+rows.slice().reverse().map(j=>
      '<tr><td class="muted">'+esc((j.created_at||'').slice(5,16))+'</td><td><code>'+esc(j.job_id)+'</code></td><td>'+badge(j.state)+'</td><td><button class="sec" onclick="pick(\''+esc(j.job_id)+'\')">查看</button></td></tr>').join('')+'</table>'):'<div class="muted">没有匹配的任务</div>';
    if(curId){
      const j=await api('/api/mining-bg/status?job_id='+encodeURIComponent(curId));
      $('cur').innerHTML='<div class="kv"><b>任务编号</b><span><code>'+esc(j.job_id)+'</code></span>'+
        '<b>状态</b><span>'+badge(j.state)+'</span>'+
        '<b>挖掘任务号</b><span>'+esc(j.run_id||'（还没生成）')+'</span>'+
        '<b>筛出因子</b><span>'+esc(j.screening_count??'—')+' 个</span>'+
        '<b>说明</b><span>'+esc(j.note||j.error||'—')+'</span>'+
        '<b>最后更新</b><span>'+esc(j.updated_at||'—')+'</span></div>'+
        (j.run_id?'<div style="margin-top:12px"><a href="/mining" target="_blank">→ 去原系统看完整结果</a></div>':'')+
        (j.error?'<div class="err" style="display:block">'+esc(j.error)+'</div>':'');
      if(/succeeded|failed|cancel|timeout|no_qualified/.test(j.state)){clearInterval(timer);timer=null}
    }
  }catch(e){showErr(e)}
}
function pick(id){curId=id;clearInterval(timer);timer=setInterval(refresh,3000);refresh()}
$('go').onclick=async()=>{
  $('err').style.display='none';$('go').disabled=true;$('goHint').textContent='正在提交…';
  try{
    const body={asset_type:$('asset').value,budget_profile:$('profile').value,
      start:$('start').value||null,end:$('end').value||null,force:$('force').checked};
    const r=await api('/api/mining-bg/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    curId=r.job_id;clearInterval(timer);timer=setInterval(refresh,3000);
    $('goHint').textContent='已拿到编号，后台在跑';await refresh();
  }catch(e){showErr(e)}finally{$('go').disabled=false}
};
$('q').oninput=refresh;
refresh();
</script></body></html>'''


def attach(app) -> None:
    """注册 4 个 API + 1 个独立页；插到 SPA 通配路由之前，否则会被前端吞掉。"""
    if not _enabled():
        logger.info('MINING_BG_DISABLED (TSP_MINING_BG=0): no routes registered')
        return
    before = len(app.router.routes)

    @app.post('/api/mining-bg/start')
    async def start(request: Request):
        try:
            raw = await request.json()
        except Exception:
            raw = {}
        if not isinstance(raw, dict):
            return JSONResponse({'error': '请求内容必须是对象'}, status_code=400)
        allowed = ('asset_type', 'start', 'end', 'budget_profile', 'commission_pct',
                   'stamp_tax_pct', 'slippage_bps', 'correlation_threshold', 'force')
        body = {k: v for k, v in raw.items() if k in allowed and v is not None}
        body.setdefault('asset_type', 'stock')
        body.setdefault('budget_profile', 'balanced')
        body.setdefault('force', False)
        with _JOBS_LOCK:
            jobs = _load_jobs()
            active = [j for j in jobs if j.get('state') in
                      ('queued', 'screening', 'running')]
            if active:
                return JSONResponse({
                    'error': '已经有一个后台挖掘在跑，等它结束或先取消',
                    'active_job_id': active[-1]['job_id'],
                }, status_code=409)
            job_id = datetime.now().strftime('%Y%m%d-%H%M%S-') + uuid.uuid4().hex[:6]
            job = {
                'job_id': job_id, 'created_at': datetime.now().isoformat(timespec='seconds'),
                'updated_at': datetime.now().isoformat(timespec='seconds'),
                'state': 'queued', 'params': body, 'run_id': None,
                'screening_count': None, 'note': '已排队', 'error': None,
            }
            jobs.append(job)
            _save_jobs(jobs)
        threading.Thread(target=_worker, args=(job_id, body), daemon=True,
                         name=f'mining-bg-{job_id}').start()
        return {'job_id': job_id, 'state': 'queued',
                'message': '已经拿到编号，服务器在后台干活，网页可以关掉'}

    @app.get('/api/mining-bg/jobs')
    def jobs():
        return _load_jobs()

    @app.get('/api/mining-bg/status')
    def status(job_id: str = ''):
        job = _get(job_id)
        if job is None:
            return JSONResponse({'error': '找不到这个编号'}, status_code=404)
        return job

    @app.post('/api/mining-bg/cancel')
    def cancel(job_id: str = ''):
        job = _get(job_id)
        if job is None:
            return JSONResponse({'error': '找不到这个编号'}, status_code=404)
        run_id = job.get('run_id')
        if not run_id:
            _update(job_id, state='cancelled', note='还没生成挖掘任务，已直接取消')
            return {'ok': True, 'note': '已取消'}
        try:
            with httpx.Client(trust_env=False, timeout=15) as client:
                r = client.post(f'{BASE}/api/backtest/mining/runs/{run_id}/cancel')
                ok = r.status_code < 400
                detail = r.text[:200]
        except Exception as exc:  # noqa: BLE001
            ok, detail = False, str(exc)[:200]
        _update(job_id, state='cancelled' if ok else job.get('state'),
                note=('已通知原系统取消' if ok else f'取消失败: {detail}'))
        return {'ok': ok, 'detail': detail}

    @app.get('/mining-bg', response_class=HTMLResponse)
    def page():
        return PAGE.replace('/*TODAY*/', datetime.now().date().isoformat())

    added = app.router.routes[before:]
    original = app.router.routes[:before]
    index = next((i for i, r in enumerate(original)
                  if getattr(r, 'path', None) == '/{full_path:path}'), len(original))
    app.router.routes[:] = original[:index] + added + original[index:]
    logger.info('MINING_BG_READY: /mining-bg + 4 api routes registered (upgrade-safe)')
