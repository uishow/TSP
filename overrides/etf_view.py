"""独立 ETF 监控页（#105 新页方案）。

设计原则（二开铁律）：
- 原系统 100% 不动：本模块只在二开层（overrides/）新增一个路由，不修改镜像、
  不修改 upstream/、不写容器内随镜像分发的文件、不注入任何原页面。
- 数据全部来自既有 bridge 接口：日 K=tdx_local_day、实时=eltdx、分钟=tdx_local_lc1。
  原系统 minute_refresh 只刷股票（硬编码 kline_minute），ETF 分钟从未被纳入那个
  刷新轮；但 bridge 本地 TDX 1 分钟线本身就有数据，本页直接查询即可，无需新增
  任何采集任务，因此也不改变原系统的数据写入路径。
- 一键开关：TSP_ETF_VIEW=0 / .disabled 时不注册本页路由（绝对不影响启动）。

展示七星175 策略池 52 只 ETF 的「实时报价 + 日K + 当日分钟线」统一视图（即 #105
所说的 merge），与原有自选股页并列存在、互不干扰。
"""
import os
import json
from datetime import date, datetime, timedelta
from fastapi import HTTPException
from fastapi.responses import HTMLResponse
import httpx

BASE = 'http://host.docker.internal:7818'
TOKEN = os.environ.get('TSP_BRIDGE_TOKEN', '')

# ── 七星175 策略池（与 data-local/strategies/custom/custom_qx175_etf_rotation.py
#    ::ALL_POOL 保持一致；此处硬编码以便本页独立运行，不依赖策略模块导入）。
OVERSEAS = [
    "513100.SH", "159509.SZ", "513290.SH", "513500.SH", "159529.SZ",
    "513400.SH", "513520.SH", "513030.SH", "513080.SH", "513310.SH",
    "513730.SH", "159792.SZ", "513130.SH", "513050.SH", "159920.SZ",
    "513690.SH", "511380.SH", "511010.SH", "511220.SH",
]
COMMODITY = [
    "518880.SH", "159980.SZ", "159985.SZ", "501018.SH",
    "161226.SZ", "159981.SZ", "512400.SH",
]
DOMESTIC = [
    "510300.SH", "510500.SH", "510050.SH", "510210.SH", "159915.SZ",
    "588080.SH", "512100.SH", "563360.SH", "563300.SH", "512890.SH",
    "159967.SZ", "588020.SH", "512040.SH", "159201.SZ", "515790.SH",
    "563230.SH", "515880.SH", "512660.SH", "561380.SH", "159667.SZ",
    "159559.SZ", "159819.SZ", "159381.SZ", "159732.SZ", "159995.SZ",
    "512220.SH",
]
POOL = (
    [("海外", s) for s in OVERSEAS]
    + [("商品", s) for s in COMMODITY]
    + [("A股", s) for s in DOMESTIC]
)
SYMBOLS = [s for _, s in POOL]
GROUP_OF = {s: g for g, s in POOL}

YEAR_START = date(date.today().year, 1, 1).isoformat()


def _bridge(method, path, **kwargs):
    try:
        with httpx.Client(
            base_url=BASE,
            headers={'Authorization': 'Bearer ' + TOKEN},
            trust_env=False, timeout=180,
        ) as c:
            r = c.request(method, path, **kwargs)
            r.raise_for_status()
            return r.json()
    except httpx.HTTPStatusError as exc:
        try:
            detail = exc.response.json().get('detail')
        except Exception:
            detail = '本地源请求失败'
        raise HTTPException(exc.response.status_code, detail) from exc
    except Exception as exc:
        raise HTTPException(503, '本地数据桥接不可用：' + str(exc)) from exc


def _latest_per_symbol(rows, date_key):
    out = {}
    for r in rows:
        s = r.get('symbol')
        if not s:
            continue
        ev = r.get(date_key) or r.get('date') or r.get('datetime')
        prev = out.get(s)
        if prev is None or (ev and str(ev) > str(prev.get('_ev'))):
            rec = dict(r)
            rec['_ev'] = str(ev)
            out[s] = rec
    return out


def _series_per_symbol(rows, date_key, field, limit=60):
    buckets = {}
    for r in rows:
        s = r.get('symbol')
        if not s:
            continue
        ev = r.get(date_key) or r.get('date') or r.get('datetime')
        v = r.get(field)
        if v is None:
            continue
        buckets.setdefault(s, []).append((str(ev), v))
    out = {}
    for s, pts in buckets.items():
        pts.sort(key=lambda x: x[0])
        if limit:
            pts = pts[-limit:]
        out[s] = [v for _, v in pts]
    return out


def attach(app):
    # 一键开关：关闭时连路由都不注册，绝不干扰原系统。
    if os.environ.get('TSP_ETF_VIEW', '') in ('0', 'false', 'False', '.disabled'):
        return

    before = len(app.router.routes)

    @app.get('/api/etf-view/overview')
    def overview():
        """实时 + 日K 全池概览（每个标的取最新一根日K + 近 60 日日K 序列 + 实时报价）。

        优雅降级（2026-11-09）：日K / 实时 / 名称 三条腿独立取数，任一失败只记入
        degraded 并返回空集，接口始终 200。收盘后 eltdx 实时源可能超时，若让异常
        冒泡会把整个页面打成 503 空白；降级后日K与分钟线照常可用。
        """
        degraded = []
        try:
            daily = _bridge('POST', '/query', json={
                'dataset': 'daily', 'symbols': SYMBOLS, 'asset_type': 'etf',
                'start_time': YEAR_START, 'latest_only': True,
            }).get('rows', [])
        except Exception:
            daily = []
            degraded.append('daily')
        try:
            realtime = _bridge('POST', '/query', json={
                'dataset': 'realtime', 'symbols': SYMBOLS, 'asset_type': 'etf',
            }).get('rows', [])
        except Exception:
            realtime = []
            degraded.append('realtime')
        names = {}
        try:
            inst = _bridge('POST', '/query', json={
                'dataset': 'instruments', 'asset_type': 'etf',
            }).get('rows', [])
            for it in inst:
                if it.get('symbol'):
                    names[it['symbol']] = it.get('name') or it.get('symbol')
        except Exception:
            degraded.append('instruments')

        latest = _latest_per_symbol(daily, 'date')
        series = _series_per_symbol(daily, 'date', 'close', 60)
        rt = {r['symbol']: r for r in realtime if r.get('symbol')}

        items = []
        for sym in SYMBOLS:
            d = latest.get(sym, {})
            r = rt.get(sym, {})
            # 日涨跌幅：优先取源字段；缺失时用已取到的日K序列（倒数第二根收盘）推算，
            # 因为 tdx_local_day 的最新行不携带 pre_close / change_pct。
            dcp = d.get('change_pct')
            if dcp is None:
                s = series.get(sym) or []
                if len(s) >= 2 and s[-2]:
                    try:
                        dcp = s[-1] / s[-2] - 1
                    except Exception:
                        dcp = None
            # 实时时间：兼容 event_time / timestamp，缺失时回退 observed_at（快照获取时间）。
            rt_time = r.get('event_time') or r.get('timestamp') or r.get('observed_at')
            if isinstance(rt_time, (int, float)):
                try:
                    rt_time = datetime.fromtimestamp(rt_time).isoformat(timespec='seconds')
                except Exception:
                    rt_time = str(rt_time)
            items.append({
                'symbol': sym,
                'group': GROUP_OF.get(sym, ''),
                'name': names.get(sym, sym),
                'daily_date': d.get('date'),
                'close': d.get('close'),
                'pre_close': d.get('pre_close'),
                'daily_change_pct': dcp,
                'spark': series.get(sym, []),
                'rt_last': r.get('last_price'),
                'rt_change_pct': r.get('change_pct'),
                'rt_time': rt_time,
            })
        return {
            'symbols': SYMBOLS,
            'groups': {'海外': OVERSEAS, '商品': COMMODITY, 'A股': DOMESTIC},
            'items': items,
            'daily_source': 'tdx_local_day',
            'realtime_source': 'eltdx',
            'minute_source': 'tdx_local_lc1',
            'degraded': degraded,
            'generated_at': datetime.now().isoformat(timespec='seconds'),
        }

    @app.get('/api/etf-view/minute')
    def minute(symbol: str, days: int = 5):
        """单标的近 N 日分钟线，返回最新一个有数据的交易日的分钟序列。"""
        end = (datetime.now() + timedelta(days=1)).isoformat(timespec='seconds')
        start = (datetime.now() - timedelta(days=max(1, days))).isoformat(timespec='seconds')
        try:
            rows = _bridge('POST', '/query', json={
                'dataset': 'minute', 'symbols': [symbol], 'asset_type': 'etf',
                'freq': '1m', 'start_time': start, 'end_time': end, 'latest_only': False,
            }).get('rows', [])
        except Exception:
            return {'symbol': symbol, 'day': None, 'points': [], 'degraded': True}
        # 按交易日分组，取最新一天
        by_day = {}
        for r in rows:
            dt = r.get('datetime')
            if not dt:
                continue
            day = str(dt)[:10]
            by_day.setdefault(day, []).append((str(dt), r.get('close'), r.get('volume')))
        if not by_day:
            return {'symbol': symbol, 'day': None, 'points': []}
        day = max(by_day)
        pts = sorted(by_day[day])
        return {
            'symbol': symbol,
            'day': day,
            'points': [{'t': t[11:16], 'close': t_close, 'volume': t_vol}
                       for t, t_close, t_vol in pts],
        }

    @app.get('/etf-view', response_class=HTMLResponse)
    def page():
        return PAGE.replace('/*POOLJSON*/', json.dumps({
            'symbols': SYMBOLS,
            'groups': {'海外': OVERSEAS, '商品': COMMODITY, 'A股': DOMESTIC},
        }, ensure_ascii=False))

    # 把新增路由插到 SPA 通配路由之前，否则会被原前端吞掉。
    added = app.router.routes[before:]
    original = app.router.routes[:before]
    index = next((i for i, r in enumerate(original)
                  if getattr(r, 'path', None) == '/{full_path:path}'), len(original))
    app.router.routes[:] = original[:index] + added + original[index:]


PAGE = r'''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TSP · ETF 策略池监控</title>
<style>
:root{--bg:#0c1322;--card:#152033;--line:#27374f;--txt:#dce5f3;--muted:#9fb0c8;--cyan:#37c5d6;--teal:#70cfb7;--red:#ef4d4d;--green:#22b07d}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--txt);font:15px/1.5 system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
header{position:sticky;top:0;z-index:10;background:linear-gradient(90deg,#0e1b30,#102a3a);padding:14px 20px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:16px;flex-wrap:wrap}
header h1{font-size:19px;margin:0;color:#eafff8}
header .sub{color:var(--muted);font-size:13px}
header .ctl{margin-left:auto;display:flex;align-items:center;gap:10px}
.btn{background:#1a685c;color:#eafff8;border:1px solid #2c8a7a;border-radius:8px;padding:7px 13px;cursor:pointer;font:inherit}
.btn.off{background:#33415a}
.home{color:#bfe9ff;text-decoration:none;font-size:14px;padding:6px 12px;border:1px solid #2c4a66;border-radius:8px;background:#0e2138;white-space:nowrap}
.home:hover{background:#16314a}
.toggle{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:13px}
.layout{display:flex;min-height:calc(100vh - 56px)}
aside{width:230px;flex:0 0 230px;background:#0f1a2c;border-right:1px solid var(--line);overflow:auto;max-height:calc(100vh - 56px);position:sticky;top:56px}
aside .gh{font-size:12px;color:var(--cyan);padding:10px 14px 4px;letter-spacing:1px}
aside .it{padding:8px 14px;cursor:pointer;border-left:3px solid transparent;font-size:14px;display:flex;justify-content:space-between;gap:8px}
aside .it:hover{background:#16243a}
aside .it.sel{background:#16314a;border-left-color:var(--teal)}
aside .it .pc{font-size:12px;font-variant-numeric:tabular-nums}
main{flex:1;padding:18px 22px;overflow:auto}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px}
.card h2{font-size:15px;margin:0 0 12px;color:var(--teal)}
.up{color:var(--red)}.down{color:var(--green)}.flat{color:var(--muted)}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{padding:6px 8px;text-align:right;border-bottom:1px solid #1e2d44}
th:first-child,td:first-child{text-align:left}
th{color:var(--muted);font-weight:600}
.num{font-variant-numeric:tabular-nums}
.big{font-size:30px;font-weight:700;font-variant-numeric:tabular-nums}
.meta{color:var(--muted);font-size:12px;margin-top:4px}
canvas{display:block;width:100%}
.row{display:flex;gap:16px;flex-wrap:wrap}
.box{flex:1;min-width:260px}
.tag{display:inline-block;font-size:11px;padding:1px 7px;border-radius:10px;background:#1c3350;color:#9fd;margin-left:6px}
.note{color:var(--muted);font-size:12px;margin-top:10px;line-height:1.6}
</style>
<header><a href="/" class="home">← 返回主系统</a><h1>ETF 策略池监控</h1><span class="sub">七星175 动量轮动 · 52 只 · 实时 + 日K + 分钟（独立新页，原自选股页未改动）</span>
<div class="ctl"><span class="toggle"><input type="checkbox" id="auto" checked> 自动刷新 6s</span><button class="btn" id="ref">立即刷新</button></div></header>
<div class="layout">
<aside id="side"></aside>
<main>
<div class="card" style="margin-bottom:16px"><h2>实时报价（全池）</h2>
<table id="rt"><thead><tr><th>标的</th><th>分组</th><th>最新价</th><th>涨跌幅</th><th>时间</th></tr></thead><tbody></tbody></table>
<div class="note">数据源 eltdx（实时快照）。非交易时段显示最近一个可用快照，时间列标明其时刻。</div></div>
<div class="row">
<div class="box card"><h2 id="dtitle">日K</h2><div class="big" id="dclose">—</div><div class="meta" id="dmeta">—</div><canvas id="spark" height="90"></canvas></div>
<div class="box card"><h2 id="mtitle">当日分钟线</h2><div class="meta" id="mmeta">—</div><canvas id="minc" height="200"></canvas></div>
</div>
<div class="note" id="src"></div>
</main></div>
<script>
const POOL=/*POOLJSON*/;
let selected=POOL.symbols[0], timer=null, last=null;
const $=id=>document.getElementById(id);
function pct(v){if(v==null)return['—','flat'];const p=v*100;const c=p>0?'up':(p<0?'down':'flat');return[(p>=0?'+':'')+p.toFixed(2)+'%',c];}
function renderSide(){
  const s=$('side');s.innerHTML='';
  for(const g of ['海外','商品','A股']){
    const h=document.createElement('div');h.className='gh';h.textContent=g+'（'+POOL.groups[g].length+'）';s.appendChild(h);
    for(const sym of POOL.groups[g]){
      const it=document.createElement('div');it.className='it'+(sym===selected?' sel':'');it.dataset.s=sym;
      const pc=(last&&last[sym])?pct(last[sym].rt_change_pct)[0]:'';
      it.innerHTML='<span>'+sym+'</span><span class="pc">'+pc+'</span>';
      it.onclick=()=>{selected=sym;renderSide();loadMinute();};
      s.appendChild(it);
    }
  }
}
function renderRT(){
  const tb=$('rt').querySelector('tbody');tb.innerHTML='';
  const arr=Object.entries(last||{}).sort((a,b)=>(b[1].rt_change_pct||0)-(a[1].rt_change_pct||0));
  for(const [sym,d] of arr){
    const [pt,pc]=pct(d.rt_change_pct);
    const tr=document.createElement('tr');
    tr.innerHTML='<td>'+sym+'</td><td>'+d.group+'</td><td class="num">'+fmt(d.rt_last)+'</td><td class="num '+pc+'">'+pt+'</td><td class="num">'+fmtTime(d.rt_time)+'</td>';
    if(sym===selected)tr.style.background='#16314a';
    tb.appendChild(tr);
  }
}
function fmt(v){return v==null?'—':(typeof v==='number'?v.toFixed(3):v);}
function fmtTime(t){if(!t)return '—';const s=String(t);return s.replace('T',' ').slice(0,16);}
function drawSpark(series){
  const cv=$('spark'),ctx=cv.getContext('2d');const W=cv.width=cv.clientWidth,H=90;ctx.clearRect(0,0,W,H);
  if(!series||series.length<2)return;const min=Math.min(...series),max=Math.max(...series),rng=(max-min)||1;
  ctx.strokeStyle='#37c5d6';ctx.lineWidth=2;ctx.beginPath();
  series.forEach((v,i)=>{const x=i/(series.length-1)*W,y=H-8-((v-min)/rng)*(H-16);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
}
function drawMin(points){
  const cv=$('minc'),ctx=cv.getContext('2d');const W=cv.width=cv.clientWidth,H=cv.height=200;ctx.clearRect(0,0,W,H);
  if(!points||points.length<2){ctx.fillStyle='#9fb0c8';ctx.font='14px system-ui';ctx.fillText('暂无分钟数据',12,30);return;}
  const cs=points.map(p=>p.close).filter(v=>v!=null);const min=Math.min(...cs),max=Math.max(...cs),rng=(max-min)||1;
  ctx.strokeStyle='#70cfb7';ctx.lineWidth=1.6;ctx.beginPath();
  points.forEach((p,i)=>{if(p.close==null)return;const x=i/(points.length-1)*W,y=H-10-((p.close-min)/rng)*(H-20);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
  // 成交量柱
  const vs=points.map(p=>p.volume||0);const vmax=Math.max(...vs)||1;
  ctx.fillStyle='rgba(55,197,214,.25)';
  points.forEach((p,i)=>{if(!p.volume)return;const x=i/(points.length-1)*W,h=(p.volume/vmax)*(H*0.28);ctx.fillRect(x-1,H-h,2,h);});
}
function renderDetail(){
  const d=last&&last[selected];if(!d)return;
  $('dtitle').textContent='日K · '+selected+(d.name?(' '+d.name):'');
  $('dclose').textContent=fmt(d.close);
  const [pt,pc]=pct(d.daily_change_pct);$('dclose').className='big '+pc;
  $('dmeta').textContent='日期 '+(d.daily_date||'—')+' ｜ 昨收 '+fmt(d.pre_close)+' ｜ 日涨跌幅 '+pt;
  drawSpark(d.spark);
}
async function loadOverview(){
  try{const r=await fetch('/api/etf-view/overview');const j=await r.json();
    last={};for(const it of j.items)last[it.symbol]={group:it.group,name:it.name,close:it.close,pre_close:it.pre_close,daily_date:it.daily_date,daily_change_pct:it.daily_change_pct,spark:it.spark,rt_last:it.rt_last,rt_change_pct:it.rt_change_pct,rt_time:it.rt_time};
    const dg=(j.degraded&&j.degraded.length)?('　⚠ 暂不可用：'+j.degraded.map(x=>({daily:'日K',realtime:'实时(eltdx)',instruments:'名称'})[x]||x).join('、')+'（其余照常显示，稍后会自动重试）'):'';
    $('src').textContent='数据源：日K='+j.daily_source+' ｜ 实时='+j.realtime_source+' ｜ 分钟='+j.minute_source+' ｜ 更新 '+fmtTime(j.generated_at)+dg;
    renderSide();renderRT();renderDetail();loadMinute();
  }catch(e){$('src').textContent='概览加载失败：'+e;}
}
async function loadMinute(){
  try{const r=await fetch('/api/etf-view/minute?symbol='+selected);const j=await r.json();
    $('mtitle').textContent='当日分钟线 · '+selected+(j.day?(' · '+j.day):'');
    $('mmeta').textContent=j.degraded?'分钟源暂不可用，稍后自动重试':(j.day?('该交易日 '+j.points.length+' 根 1 分钟K'):'近几日无分钟数据');
    drawMin(j.points);
  }catch(e){$('mtitle').textContent='当日分钟线 · '+selected;$('mmeta').textContent='分钟加载失败：'+e;}
}
function tick(){loadOverview();}
$('ref').onclick=tick;
$('auto').onchange=e=>{if(e.target.checked){timer=setInterval(tick,6000);}else{clearInterval(timer);timer=null;}};
tick();timer=setInterval(tick,6000);
</script></html>'''
