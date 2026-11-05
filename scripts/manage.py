#!/usr/bin/env python3
"""Local bridge lifecycle; never starts upstream data synchronization."""
import json,os,subprocess,sys,time,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
RUN=ROOT/'runtime'
if not RUN.is_dir():RUN.mkdir()
PID=RUN/'bridge.pid'

def environment():
    env=dict(os.environ)
    for line in (ROOT/'.env').read_text().splitlines():
        if not line.strip() or line.lstrip().startswith('#') or '=' not in line:continue
        k,v=line.split('=',1);env[k.strip()]=v.strip().strip("'\"")
    return env

def healthy():
    try:
        op=urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with op.open('http://127.0.0.1:7818/health',timeout=2) as r:return json.load(r).get('service')=='tsp-local-readonly-bridge'
    except Exception:return False

def start():
    if healthy():print('Bridge already running');return
    with (RUN/'bridge.log').open('ab') as log:
        p=subprocess.Popen([str(ROOT/'.venv/bin/python'),'-m','uvicorn','bridge.server:app','--host','127.0.0.1','--port','7818'],cwd=ROOT,env=environment(),stdin=subprocess.DEVNULL,stdout=log,stderr=log,start_new_session=True)
    PID.write_text(str(p.pid))
    for _ in range(30):
        if healthy():print('Bridge ready at 127.0.0.1:7818');return
        if p.poll() is not None:raise RuntimeError('Bridge failed; see runtime/bridge.log')
        time.sleep(.5)
    raise RuntimeError('Bridge startup timeout; see runtime/bridge.log')

def stop():
    if not PID.exists():return
    pid=int(PID.read_text())
    try:os.kill(pid,0)
    except OSError:
        print('Recorded PID is not running; no process stopped');return
    if not healthy():
        print('Bridge health check failed; refusing to signal an unverified PID');return
    os.kill(pid,15)
    for _ in range(50):
        if not healthy():break
        time.sleep(.1)
    else:raise RuntimeError('Bridge has not stopped; refusing conflicting restart')
    PID.unlink();print('Bridge stopped')

if __name__=='__main__':
    action=sys.argv[1] if len(sys.argv)>1 else 'status'
    if action=='start':start()
    elif action=='stop':stop()
    elif action=='status':print('healthy' if healthy() else 'stopped')
    else:raise SystemExit('Usage: manage.py start|stop|status')
