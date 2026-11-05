"""TSP Python provider. This module never opens external market-data endpoints."""
from __future__ import annotations
import os
import time
from datetime import datetime
from zoneinfo import ZoneInfo
from types import SimpleNamespace
import httpx
import polars as pl

DATASETS=('daily','adj_factor','minute','full_minute','realtime','depth5','financial')

FINANCIAL_TABLE_ALIASES={'balance':'balance_sheet','cashflow':'cash_flow'}
# 429 is bridge-busy / rate-limited. Keep at most ~7.7s of backoff across all
# retries so a burst of concurrent minute-chart polls cannot be pushed past
# the browser's 30s AbortController timeout. The bridge now queues bursts, so
# short backoff is sufficient. 503 remains fail-closed with no retry.
RETRY_DELAYS=(0.15,0.3,0.6,1.2,2.4,3.0)

def availability():
    if not os.getenv('TSP_BRIDGE_TOKEN'):return False,'本地桥接令牌未配置'
    try:
        with httpx.Client(trust_env=False,timeout=5) as client:
            r=client.get(os.getenv('TSP_BRIDGE_URL','http://host.docker.internal:7818')+'/health');r.raise_for_status()
        return True,'本地只读桥接已连接；具体来源和新鲜度按请求验证'
    except Exception:return False,'本地桥接未运行或无法连接；禁止回退其他网络源'


def _value(v):
    if isinstance(v,datetime) and v.tzinfo is not None:
        v=v.astimezone(ZoneInfo('Asia/Shanghai')).replace(tzinfo=None)
    return v.isoformat() if hasattr(v,'isoformat') else v


class LocalQuantProvider:
    name='local_quant'
    builtin=True
    def __init__(self):
        self.config=SimpleNamespace(name=self.name,display_name='本地量化数据 / 通达信 / eltdx',
            datasets={name:SimpleNamespace(pct_unit='ratio') for name in DATASETS})
        self._client=httpx.Client(base_url=os.getenv('TSP_BRIDGE_URL','http://host.docker.internal:7818'),
            headers={'Authorization':'Bearer '+os.environ.get('TSP_BRIDGE_TOKEN','')},trust_env=False,timeout=180)
    def close(self):self._client.close()
    @staticmethod
    def _error(dataset, exc):
        # The host test venv does not install the upstream app stack; fall back
        # to RuntimeError, which ProviderRequestError extends.
        try:
            from app.data_providers.base import ProviderRequestError
        except ImportError:
            ProviderRequestError = RuntimeError
        detail=''
        if isinstance(exc,httpx.HTTPStatusError):
            try:detail=str(exc.response.json().get('detail',''))[:400]
            except Exception:pass
        if not detail:
            detail=str(exc) or type(exc).__name__
        return ProviderRequestError(f'本地数据源 {dataset} 不可用: {detail[:400]}; 禁止网络回退')

    def _request(self, dataset, **kw):
        payload={'dataset':dataset,**{k:_value(v) for k,v in kw.items()}}
        # Only 429 (rate limit / busy) is transient. 503 is a deliberate
        # fail-closed source error and must surface immediately, never retried.
        delays=RETRY_DELAYS
        for attempt in range(len(delays)+1):
            try:
                r=self._client.post('/query',json=payload)
            except Exception as exc:
                raise self._error(dataset,exc) from exc
            if r.status_code==429:
                if attempt==len(delays):
                    raise self._error(dataset,RuntimeError('bridge 429 retries exhausted'))
                time.sleep(delays[attempt])
                continue
            try:
                r.raise_for_status()
            except Exception as exc:
                raise self._error(dataset,exc) from exc
            return r.json()
    @staticmethod
    def _frame(result, kind):
        rows=result.get('rows',[])
        schema={'symbol':pl.String,'source':pl.String}
        if kind=='daily':schema.update(date=pl.Date,open=pl.Float64,high=pl.Float64,low=pl.Float64,close=pl.Float64,volume=pl.Float64,amount=pl.Float64)
        if kind=='minute':schema.update(datetime=pl.Datetime('us'),open=pl.Float64,high=pl.Float64,low=pl.Float64,close=pl.Float64,volume=pl.Float64,amount=pl.Float64)
        if kind=='adj_factor':schema.update(trade_date=pl.Date,ex_factor=pl.Float64)
        if not rows:return pl.DataFrame(schema=schema)
        df=pl.from_dicts(rows,infer_schema_length=None)
        for col,dtype in schema.items():
            if col not in df.columns:df=df.with_columns(pl.lit(None,dtype=dtype).alias(col))
            elif df.schema[col]==pl.String and dtype==pl.Date:df=df.with_columns(pl.col(col).str.to_date(strict=True))
            elif df.schema[col]==pl.String and dtype==pl.Datetime('us'):df=df.with_columns(pl.col(col).str.to_datetime(time_unit='us',strict=True))
            else:df=df.with_columns(pl.col(col).cast(dtype,strict=True))
        return df
    def get_instruments(self,asset_type='stock'):
        return self._request('instruments',asset_type=asset_type)['rows']
    def iter_daily(self,symbols,start_time=None,end_time=None,asset_type='stock',on_chunk_done=None):
        total=len(symbols)
        for i in range(0,total,50):
            yield self._frame(self._request('daily',symbols=symbols[i:i+50],start_time=start_time,end_time=end_time,asset_type=asset_type,require_latest=bool(end_time is None or str(_value(end_time))[:10]>=datetime.now().date().isoformat())),'daily')
            if on_chunk_done:on_chunk_done(min(i+50,total),total)
    def get_daily(self,symbols,start_time=None,end_time=None,asset_type='stock',on_chunk_done=None):
        frames=list(self.iter_daily(symbols,start_time,end_time,asset_type,on_chunk_done))
        return pl.concat(frames,how='diagonal_relaxed') if frames else self._frame({'rows':[]},'daily')
    def get_adj_factors(self,symbols,start_time=None,end_time=None,asset_type='stock',on_chunk_done=None):
        frames=[]
        for i in range(0,len(symbols),100):
            frames.append(self._frame(self._request('adj_factor',symbols=symbols[i:i+100],start_time=start_time,end_time=end_time,asset_type=asset_type),'adj_factor'))
            if on_chunk_done:on_chunk_done(min(i+100,len(symbols)),len(symbols))
        return pl.concat(frames,how='diagonal_relaxed') if frames else self._frame({'rows':[]},'adj_factor')
    def get_minute(self,symbols,start_time=None,end_time=None,asset_type='stock',freq='1m',on_chunk_done=None):
        frames=[]
        for i,symbol in enumerate(symbols):
            frames.append(self._frame(self._request('minute',symbols=[symbol],start_time=start_time,end_time=end_time,asset_type=asset_type,freq=freq,require_latest=bool(end_time and str(_value(end_time))[:10]>=datetime.now().date().isoformat())),'minute'))
            if on_chunk_done:on_chunk_done(i+1,len(symbols))
        return pl.concat(frames,how='diagonal_relaxed') if frames else self._frame({'rows':[]},'minute')
    def get_realtime(self):
        return self._request('realtime')['rows']
    def get_realtime_indices(self,symbols):
        return self._request('realtime',symbols=symbols,asset_type='index')['rows']
    def get_depth_batch(self,symbols):
        """Native eltdx five-level book, one dict keyed by symbol.

        The bridge fails closed on missing/undated quotes, so an empty result
        is a real error rather than a silent downgrade to a derived snapshot.
        """
        result={}
        for i in range(0,len(symbols),100):
            rows=self._request('depth5',symbols=symbols[i:i+100])['rows']
            if not isinstance(rows,dict):
                # The host test venv does not install the upstream app stack;
                # fall back to RuntimeError, which ProviderRequestError extends.
                try:
                    from app.data_providers.base import ProviderRequestError
                except ImportError:
                    ProviderRequestError = RuntimeError
                raise ProviderRequestError('本地数据源 depth5 返回结构异常；禁止回退其他网络源')
            result.update(rows)
        return result
    def get_financials(self,table,symbols,latest_only=True):
        table=FINANCIAL_TABLE_ALIASES.get(table,table)
        frames=[]
        for i in range(0,len(symbols),100):
            frames.append(self._frame(self._request('financial',symbols=symbols[i:i+100],table=table,latest_only=latest_only),'financial'))
        return pl.concat(frames,how='diagonal_relaxed') if frames else pl.DataFrame()
    def get_intraday_batch(self,symbols,count=300,asset_type='stock'):
        end=datetime.now();start=end.replace(hour=0,minute=0,second=0,microsecond=0)
        frames=[]
        for i in range(0,len(symbols),20):
            result=self._request('minute',symbols=symbols[i:i+20],start_time=start,end_time=end,asset_type=asset_type,require_latest=True)
            frames.append(self._frame(result,'minute'))
        return pl.concat(frames,how='diagonal_relaxed') if frames else self._frame({'rows':[]},'minute')
    def test_dataset(self,dataset,test_symbols=None,start_time=None,end_time=None):
        result=self._request(dataset,symbols=test_symbols or ['600031.SH'],start_time=start_time,end_time=end_time)
        rows=result['rows'];return {'provider':self.name,'dataset':dataset,'rows':len(rows),'preview':rows[:5] if isinstance(rows,list) else rows,'metadata':result.get('metadata')}
