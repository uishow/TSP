import os
os.environ['TSP_BRIDGE_TOKEN']='test-token-only'
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.testclient import TestClient
import httpx,pytest
from overrides import source_panel

def app_client():
    app=FastAPI()
    @app.get('/{full_path:path}',response_class=HTMLResponse)
    def spa(full_path):return '<html><body>original TSP</body></html>'
    source_panel.attach(app)
    return TestClient(app)

def test_source_page_and_api_precede_spa_fallback(monkeypatch):
    monkeypatch.setattr(source_panel,'bridge',lambda *a,**k:{'status':'ok','policy':'local only'})
    client=app_client()
    assert client.get('/api/local-sources/status').json()['policy']=='local only'
    assert '通达信专业财务原始观察' in client.get('/local-sources').text
    assert 'href="/local-sources"' in client.get('/').text

def test_readonly_proxy_preserves_query(monkeypatch):
    calls=[]
    monkeypatch.setattr(source_panel,'bridge',lambda *a,**kw:calls.append(kw) or {'rows':[]})
    client=app_client()
    r=client.post('/api/local-sources/query',json={'dataset':'financial','symbols':['600031.SH'],'table':'raw'})
    assert r.status_code==200 and calls[0]['json']['table']=='raw'
    assert client.post('/api/local-sources/query',json={'dataset':'daily','symbols':['600031.SH']*201}).status_code==422

def test_bridge_unavailable_returns_explicit_503(monkeypatch):
    class Failed:
        def __init__(self,**kw):pass
        def __enter__(self):raise httpx.ConnectError('offline')
        def __exit__(self,*a):pass
    monkeypatch.setattr(source_panel.httpx,'Client',Failed)
    r=app_client().get('/api/local-sources/status')
    assert r.status_code==503 and '禁止其他网络源回退' in r.json()['detail']
