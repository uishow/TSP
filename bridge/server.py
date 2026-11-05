"""Authenticated, bounded, read-only data bridge; no arbitrary SQL, paths or URLs."""
from __future__ import annotations
import hmac
import json
import logging
import os
import threading
from collections import deque
from datetime import datetime
from pathlib import Path
from time import monotonic
from typing import Literal
from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from bridge import evidence as _evidence
from bridge.router import Router, SourceUnavailable

log=logging.getLogger(__name__)
ROOT=Path(__file__).resolve().parents[1]

class Query(BaseModel):
    model_config=ConfigDict(extra='forbid')
    dataset:Literal['instruments','daily','minute','adj_factor','realtime','depth5','financial','boards','export_daily','fuyao']
    symbols:list[str]=Field(default_factory=list,max_length=200)
    start_time:str|None=None
    end_time:str|None=None
    asset_type:Literal['stock','index','etf']='stock'
    freq:Literal['1m','5m','15m','30m','60m']='1m'
    table:Literal['metrics','income','balance','balance_sheet','cashflow','cash_flow','shares','raw','observation','announce_candidates','concept','industry','status']='metrics'
    latest_only:bool=True
    require_latest:bool=False
    # A03: decision-time / purpose / scope context travels with the evidence
    # record only. They are stripped before the fixed router contract is called,
    # so no existing data path changes and no future data can be requested by
    # naming a window that ends after the declared decision time.
    as_of:str|None=None
    purpose:Literal['scan','backtest','realtime','after_hours','financial_sync','audit','probe','other']='other'

    @field_validator('symbols')
    @classmethod
    def symbols_valid(cls,value):
        import re
        if any(not re.fullmatch(r'\d{6}\.(SH|SZ|BJ)',s) for s in value):raise ValueError('Use exchange-qualified symbols')
        return value

    @field_validator('start_time','end_time')
    @classmethod
    def dates_valid(cls,value):
        if value is not None:
            d=datetime.strptime(value,'%Y%m%d%H%M%S') if len(value)==14 and value.isdigit() else datetime.fromisoformat(value)
            if d.tzinfo is not None:raise ValueError('Use Beijing wall-clock dates')
            if d.year<1990 or d.year>2100:raise ValueError('Date outside supported bounds')
            return d.date().isoformat() if len(value) in (8,10) else d.isoformat()
        return value

    @field_validator('as_of')
    @classmethod
    def as_of_valid(cls,value):
        if value is None:return None
        try:
            d=datetime.strptime(value,'%Y%m%d%H%M%S') if len(value)==14 and value.isdigit() else datetime.fromisoformat(value)
        except ValueError as exc:raise ValueError('Invalid as_of wall-clock timestamp') from exc
        if d.tzinfo is not None:raise ValueError('Use Beijing wall-clock dates')
        if d.year<1990 or d.year>2100:raise ValueError('Date outside supported bounds')
        return d.isoformat()

    @model_validator(mode='after')
    def window_valid(self):
        if self.start_time and self.end_time and self.start_time>self.end_time:raise ValueError('Reversed date window')
        if self.dataset in {'daily','minute','adj_factor','financial','depth5','export_daily'} and not self.symbols:
            raise ValueError('Explicit symbol list required')
        if self.dataset=='fuyao' and self.table!='status' and not self.symbols:
            raise ValueError('Explicit symbol list required for fuyao tables')
        if self.as_of and self.end_time:
            left=self.as_of+'T00:00:00' if len(self.as_of)==10 else self.as_of
            right=self.end_time+'T00:00:00' if len(self.end_time)==10 else self.end_time
            if left<right:raise ValueError('as_of precedes requested window end; future data would leak')
        return self


def _scope(req):
    """Explicit, bounded request scope recorded with every outcome."""
    return {'dataset':req.dataset,'symbol_count':len(req.symbols),'max_symbols':200,
            'window':{'start_time':req.start_time,'end_time':req.end_time},
            'as_of':req.as_of,'purpose':req.purpose,'asset_type':req.asset_type,
            'freq':req.freq,'table':req.table,'require_latest':req.require_latest,
            'fixed_datasets_only':True,'arbitrary_sql_path_url':False,
            'source_data_readonly':True}


def _bounded_metadata(meta,root):
    """Keep persisted audit records bounded; bulky details go to a sidecar.

    A market-wide index refresh once produced a 5 MB ``conflicts`` list, which
    was copied into the HTTP response, source-audit.jsonl AND evidence.jsonl.
    HTTP responses still carry the original metadata (no upstream contract
    change); only the two persisted copies are bounded, with the complete list
    retained by content hash.
    """
    if not isinstance(meta,dict):return meta
    out=dict(meta)
    conflicts=out.get('conflicts')
    if isinstance(conflicts,list) and len(conflicts)>8:
        try:
            ref=_evidence.store_large_payload(root,'conflicts',conflicts)
            ref['sample']=conflicts[:2]
            ref['note']='full list in content-addressed sidecar; not repeated per request'
        except Exception as exc:
            ref={'count':len(conflicts),'sidecar_error':type(exc).__name__,'sample':conflicts[:2]}
        out['conflicts']=ref
    return out


def _record(ev,kind,payload,**fields):
    """Audit must never change a data response, but degradation is not silent."""
    result=ev.safe_append(kind,payload,**fields)
    if isinstance(result,dict) and 'error' in result:
        log.error('Evidence write failed (%s): %s',result.get('error'),result.get('message'))
    return result


def create_app(router=None,evidence=None):
    app=FastAPI(title='TSP 本地量化只读桥接',docs_url=None,redoc_url=None,openapi_url=None)
    state={'router':router};lock=threading.Lock();rates=deque()
    def get_evidence():return evidence if evidence is not None else _evidence.default_evidence()
    # A full 5-table financial sync issues ~275 chunked requests; the old 240/min
    # ceiling made the last table fail with 429. Keep a bounded ceiling, but make
    # it large enough for one full sync and configurable per deployment.
    try:rate_limit=max(60,min(2000,int(os.environ.get('TSP_BRIDGE_RATE_PER_MIN','600'))))
    except ValueError:rate_limit=600
    def auth(authorization:str|None=Header(default=None)):
        token=os.environ.get('TSP_BRIDGE_TOKEN','')
        if not token or not hmac.compare_digest(authorization or '', 'Bearer '+token):
            _record(get_evidence(),'FAILED',{'stage':'auth','status_code':401,'reason':'UNAUTHORIZED',
                'token_present':bool(authorization),'query':None},scope={'fixed_datasets_only':True},purpose='auth')
            raise HTTPException(401,'Bridge authentication required')
        now=monotonic()
        with lock:
            while rates and rates[0]<now-60:rates.popleft()
            if len(rates)>=rate_limit:
                _record(get_evidence(),'FAILED',{'stage':'auth','status_code':429,'reason':'RATE_LIMITED',
                    'query':None,'limit_per_min':rate_limit},scope={'fixed_datasets_only':True},purpose='auth')
                raise HTTPException(429,'Bridge rate limit; retry later')
            rates.append(now)
    def get_router():
        if state['router'] is None:state['router']=Router()
        return state['router']
    # Admission control. The old fixed 2 slots rejected every concurrent
    # /api/kline/minute poll with an immediate 429; the upstream provider then
    # backed off 1+2+4+8+16s, which is exactly what tripped the browser's 30s
    # AbortController timeout. Allow a larger, bounded burst and queue briefly
    # inside the bridge instead of pushing the backoff to the caller. eltdx
    # calls remain serialized by LiveSources._run, so this does not fan out
    # network load; local-only reads can now proceed in parallel.
    try:max_concurrency=max(2,min(16,int(os.environ.get('TSP_BRIDGE_MAX_CONCURRENCY','8'))))
    except ValueError:max_concurrency=8
    try:queue_wait=max(0.0,min(12.0,float(os.environ.get('TSP_BRIDGE_QUEUE_WAIT','8'))))
    except ValueError:queue_wait=8.0
    work=threading.BoundedSemaphore(max_concurrency)
    @app.get('/health')
    def health():return {'status':'ok','service':'tsp-local-readonly-bridge','execution_authorized':False}
    @app.get('/status',dependencies=[Depends(auth)])
    def status():
        r=get_router()
        local=getattr(r,'local',None);live=getattr(r,'live',None)
        detail=local.source_status() if local and hasattr(local,'source_status') else {'state':'NOT_PROBED'}
        try:fuyao=r.fuyao.status()
        except Exception as exc:fuyao={'state':'UNAVAILABLE','error':type(exc).__name__}
        try:
            from .fuyao_pit import fuyao_pit_summary
            fuyao_pit=fuyao_pit_summary()
        except Exception as exc:fuyao_pit={'available':False,'error':type(exc).__name__}
        fp_verified=fuyao_pit.get('verified_recent_count',0) if fuyao_pit.get('available') else 0
        financial_pit=('PARTIAL_RECENT_2026_VERIFIED' if fp_verified
                       else 'UNAVAILABLE_NO_VERIFIED_ANNOUNCE_DATE')
        return {'status':'ok','policy':{'local_first':True,'network_sources':['eltdx','axdata'],'forbidden_fallback':True,'source_data_readonly':True},
            'local':detail,'live':live.status() if live and hasattr(live,'status') else {'state':'NOT_PROBED'},
            'native_realtime':'ELTDX_FULL_MARKET_DATE_VERIFIED','quote_access':'FULL_MARKET_ENABLED',
            'depth5':'ELTDX_NATIVE_0x0547_ENABLED','financial':'ELTDX_FINANCE_BATCH+LOCAL_GPCW_OBSERVATION+FUYAO_OBSERVED',
            'financial_pit':financial_pit,'latest_verified':bool(fp_verified),
            'fuyao_offline':fuyao,
            'fuyao_pit':fuyao_pit,
            'note':'Realtime date comes from the TDX handshake with a per-symbol HHMM freshness gate; halted/undated rows are excluded. Depth5 uses native 0x0547 with handshake date + per-symbol HHMMSS; no quote-derived or zero-filled levels. Financial period_end comes from local gpcw report headers; eltdx finance_batch supplies named latest fields. fuyao supplies OBSERVED recent(2026) disclosure dates (PIT-verified, three-statement cross-checked) and 2024-2025 statement values as observed (NOT PIT-dated); 2025-earlier disclosure dates are back-filled/conflict and stay OUT of PIT.',
            'admission':{'max_concurrency':max_concurrency,'queue_wait_seconds':queue_wait,
                'rate_per_min':rate_limit,'policy':'bounded queue, no silent fallback'},
            'evidence':get_evidence().status()}
    @app.post('/query',dependencies=[Depends(auth)])
    def query(req:Query):
        ev=get_evidence();scope=_scope(req);query_doc=req.model_dump()
        if not work.acquire(timeout=queue_wait):
            _record(ev,'FAILED',{'stage':'admission','status_code':429,'reason':'BRIDGE_BUSY','query':query_doc,
                'waited_seconds':queue_wait,'max_concurrency':max_concurrency},scope=scope,purpose=req.purpose)
            raise HTTPException(429,'Bridge busy; retry later')
        recorded=False
        try:
            # as_of/purpose are evidence context, NOT part of the fixed router
            # contract. Keeping them out of model_dump() preserves the legacy
            # source-audit.jsonl byte layout for existing consumers.
            params=req.model_dump(exclude={'as_of','purpose'})
            result=get_router().query(**params)
            meta=result.get('metadata',{})
            bounded=_bounded_metadata(meta,ROOT)
            _record(ev,'SUCCESS',{'status_code':200,'query':query_doc,
                'outcome':{'row_count':meta.get('count'),'metadata':bounded}},scope=scope,purpose=req.purpose)
            recorded=True
            # Legacy append-only provenance log: same keys, bounded payload.
            audit=ROOT/'runtime'/'source-audit.jsonl'
            if not audit.parent.is_dir():audit.parent.mkdir()
            with audit.open('a') as f:f.write(json.dumps({'query':params,'metadata':bounded},ensure_ascii=False,default=str)+'\n')
            return result
        except (SourceUnavailable,RuntimeError) as exc:
            if not recorded:_record(ev,'FAILED',{'stage':'source','status_code':503,'reason':type(exc).__name__,
                'error':str(exc),'query':query_doc},scope=scope,purpose=req.purpose)
            log.warning('Source query failed: %s',exc)
            raise HTTPException(503,str(exc)) from exc
        except ValueError as exc:
            if not recorded:_record(ev,'FAILED',{'stage':'router','status_code':422,'reason':type(exc).__name__,
                'error':str(exc),'query':query_doc},scope=scope,purpose=req.purpose)
            raise HTTPException(422,str(exc)) from exc
        except Exception as exc:
            _record(ev,'FAILED',{'stage':'unexpected','status_code':500,'reason':type(exc).__name__,
                'error':str(exc),'query':query_doc},scope=scope,purpose=req.purpose)
            raise
        finally:work.release()
    @app.exception_handler(RequestValidationError)
    async def invalid_query(request,exc):
        # Validation failures never reach query(), so they are persisted here.
        if request.url.path=='/query':
            _record(get_evidence(),'FAILED',{'stage':'validation','status_code':422,
                'reason':'INVALID_QUERY','query':jsonable_encoder(getattr(exc,'body',None)),
                'errors':[str(e.get('msg')) for e in exc.errors()]},
                scope={'fixed_datasets_only':True,'arbitrary_sql_path_url':False},purpose='validation')
        return JSONResponse(status_code=422,content={'detail':jsonable_encoder(exc.errors())})
    return app

app=create_app()
