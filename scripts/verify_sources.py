"""Bounded actual-source checks. Outputs evidence only inside this workspace."""
import json,sys,time,urllib.request,urllib.error
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from manage import environment
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
BASE='http://127.0.0.1:3018/api/local-sources'

def query(dataset,**kw):
    payload={'dataset':dataset,'symbols':['600031.SH'],**kw}
    req=urllib.request.Request(BASE+'/query',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=180) as r:return json.load(r)

report={}
for dataset,kw in [('daily',{'start_time':'2026-11-02','end_time':'2026-11-03'}),('minute',{'start_time':'2024-12-31','end_time':'2025-01-02','freq':'5m'}),('adj_factor',{'start_time':'2025-01-01','end_time':'2026-11-03'}),('financial',{'table':'raw'}),('export_daily',{'start_time':'2026-11-02','end_time':'2026-11-03'}),('boards',{})]:
    try:
        d=query(dataset,**kw);rows=d['rows'];item={'status':'PASS','rows':len(rows),'metadata':d.get('metadata')}
        if dataset=='daily':
            assert rows[-1]['close']==18.84 and rows[-1]['volume']==1099096
            item['sample']=rows[-1]
        if dataset=='minute':assert len(rows)==96
        if dataset=='financial':
            assert rows and rows[0]['ann_date'] is None and rows[0]['pit_verified'] is False
            item['period_end']=rows[0]['period_end'];item['numbered_columns']=len([k for k in rows[0] if k.startswith('col')]);item['classification']='RAW_OBSERVATION_ONLY'
        report[dataset]=item
    except Exception as e:
        report[dataset]={'status':'FAILED','error':str(e)}
    print(dataset,report[dataset]['status'],flush=True)
from bridge.live_sources import LiveSources
for backend in ['eltdx','axdata']:
    try:
        live=LiveSources(backend=backend,retries=1)
        quote=live.realtime(['600031.SH'])
        report[backend]={'status':'PASS','quote':quote,'clock':'UNKNOWN; timestamp null; stale true'}
        assert quote[0]['timestamp'] is None and quote[0]['stale']
        if backend=='eltdx':
            bars=live.minute(['600031.SH'],'2026-11-03','2026-11-03',freq='5m')
            assert len(bars)==48 and bars[0]['datetime'].endswith('09:35:00') and bars[-1]['datetime'].endswith('15:00:00')
            report[backend]['minute']={'rows':len(bars),'first':bars[0]['datetime'],'last':bars[-1]['datetime']}
    except Exception as e:report[backend]={'status':'FAILED','error':str(e)}
    print(backend,report[backend]['status'],flush=True)
(ROOT/'tasks'/'actual-source-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
if any(v['status']=='FAILED' for v in report.values()):raise SystemExit(1)
