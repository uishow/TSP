"""Read-only local quant data adapter. No upstream sync and no network fallbacks."""
from pathlib import Path
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import sys
import threading
import time
from . import evidence as _evidence
from .schemas import boundary, canonical_bar, symbol_parts, infer_symbol, SourceUnavailable
from .tdx_local import TDXLocal

ROOT=Path('/Users/beryllewis/private/stock/数据汇总')
CONFLICT_TOLERANCE=1e-5
_OHLCV=('open','high','low','close','volume','amount')


def _classify_conflict(old,row,fields=_OHLCV):
    """Separate float32 binary rounding from a real source disagreement.

    TDX .day/.lc5 stores prices as 32-bit floats, so 15.729999542236328 and
    15.73 are the same observation. Treating that as a data conflict would
    flood the evidence log on every minute-bar read. A material disagreement
    (unit mismatch, different bar, null vs value) is still recorded as such.
    """
    for key in fields:
        a,b=old.get(key),row.get(key)
        if a==b:continue
        numeric=isinstance(a,(int,float)) and not isinstance(a,bool) \
            and isinstance(b,(int,float)) and not isinstance(b,bool)
        if numeric:
            denom=max(abs(float(a)),abs(float(b)),1.0)
            if abs(float(a)-float(b))/denom<=CONFLICT_TOLERANCE:continue
        return 'MATERIAL_VALUE_DISAGREEMENT'
    return 'PRECISION_ROUNDING_ONLY'


def _precision(value):
    """Record numeric scale so unequal precision is visible, never reconciled silently."""
    if value is None:return {'type':'null','scale':None}
    if isinstance(value,bool):return {'type':'bool','scale':None}
    if isinstance(value,int):return {'type':'int','scale':0}
    if isinstance(value,float):
        text=repr(value)
        scale=len(text.split('.')[1]) if '.' in text and 'e' not in text.lower() else None
        return {'type':'float','scale':scale}
    return {'type':type(value).__name__,'scale':None}


class LocalStore:
    def __init__(self,sdk=None,data_root=None,tdx=None,evidence=None):
        self._sdk=sdk;self.data_root=Path(data_root) if data_root else ROOT/'本地量化数据'
        self.tdx=tdx or TDXLocal();self._lock=threading.RLock();self._instruments={};self._samples={};self._instruments_day={}
        # eltdx 代码表（中文名）按日缓存；free_stockdb 日线 bar 不带 name,
        # 因此 instruments() 用此映射回填真实中文名, 避免 name 被写成代码。
        self._name_map=None;self._name_map_day=None
        # A02: full conflict/failure history lives in the append-only evidence
        # log; the in-process lists are no longer truncated to 20 entries.
        self._conflicts=[];self._conflict_count=0;self._material_conflict_count=0
        self._failures=[];self._read_failure_count=0
        self._evidence=evidence

    def evidence_log(self):
        return self._evidence if self._evidence is not None else _evidence.default_evidence()

    def read_health(self):
        """Exposed in router metadata so a degraded read is never an empty success."""
        return {'read_failure_count':self._read_failure_count,
                'recent_read_failures':[str(f.get('error')) for f in self._failures[-5:]],
                'conflict_count':self._conflict_count,
                'material_conflict_count':self._material_conflict_count,
                'precision_rounding_conflicts':self._conflict_count-self._material_conflict_count,
                'degraded':bool(self._read_failure_count),
                'note':'Partial local results after an upstream read failure are '
                       'flagged degraded; missing rows are never zero-filled.'}
    @property
    def sdk(self):
        if self._sdk is None:
            sys.path.insert(0,str(ROOT/'free-stockdb/pybao'))
            import stock_sdk
            stock_sdk.init(host='127.0.0.1',port=7899,socket_timeout=10,warm=False)
            self._sdk=stock_sdk.rd
        return self._sdk
    def _eltdx_name_map(self):
        """从 eltdx 代码表构建 symbol(代码.交易所)->中文名 映射(按日缓存)。

        free_stockdb 的日线 bar 不带 name 字段, 导致 instruments() 把 name
        错填成代码本身。这里用 eltdx 的权威代码表补回真实中文名。
        必须以完整 symbol(代码+交易所)为 key: 同一 6位代码在 SH/SZ 可能既是
        指数又是股票(如 000001=上证指数/平安银行), 仅用代码做 key 会串味。
        """
        if self._name_map is not None and self._name_map_day==datetime.now().date():
            return self._name_map
        name_map={}
        try:
            from eltdx import TdxClient
            with TdxClient(timeout=6) as client:
                for m in ('sh','sz','bj'):
                    for getter in ('a_shares','etfs','indices'):
                        try:
                            rows=getattr(client.codes,getter)(m)
                        except Exception:
                            continue
                        for r in rows:
                            code=getattr(r,'code',None);nm=getattr(r,'name',None)
                            ex=getattr(r,'exchange',m)
                            if code and nm:
                                key=f"{code}.{str(ex).upper()}"
                                if key not in name_map:
                                    name_map[key]=nm
        except Exception as e:  # noqa: BLE001
            self._record_failure(e,{'dataset':'instruments_name_map','stage':'eltdx'})
        # 2026-11-10 #13: 空映射绝不按日缓存。eltdx codes 握手超时会返回 {},
        # 旧实现把它缓存一整天, 导致当天所有 instruments 名称回填永久失效。
        if name_map:
            self._name_map=name_map;self._name_map_day=datetime.now().date()
        return name_map

    def _apply_real_names(self,result):
        """用 eltdx 代码表覆盖损坏的 name(空或等同于代码本身)。

        按完整 symbol 匹配, 避免 SH 指数与 SZ 同名股票串味。
        """
        nm=self._eltdx_name_map()
        if not nm:return result
        for item in result:
            sym=item.get('symbol') or ''
            real=nm.get(sym)
            if not real:continue
            old=item.get('name')
            code=sym.split('.')[0]
            if old is None or str(old).strip()=='' or str(old).strip()==code or (isinstance(old,str) and old.isdigit() and len(old)<=6):
                item['name']=real
        return result

    def instruments(self,asset_type='stock'):
        if asset_type in self._instruments and self._instruments_day.get(asset_type)==datetime.now().date():return self._instruments[asset_type]
        with self._lock:
            if asset_type=='stock':
                groups=self.sdk.get('股票代码');groups=groups.do() if hasattr(groups,'do') else groups
                codes=sorted({c for k,values in groups.items() if k in ('0','3','6','9') and isinstance(values,list) for c in values if isinstance(c,str) and len(c)==6})
                result=[{'symbol':infer_symbol(c),'name':c,'exchange':infer_symbol(c).split('.')[1],'asset_type':'stock','source':'free_stockdb','listing_date':None,'status':None} for c in codes]
                by_code={r['symbol'].split('.')[0]:r for r in result}
                now=datetime.now()
                for offset in range(0,len(codes),200):
                    batch=self.sdk.get_data(code=codes[offset:offset+200],start=(now-timedelta(days=40)).strftime('%Y%m%d'),end=now.strftime('%Y%m%d'),frequency='1d',fq=None,desc=True,limit=1)
                    if not isinstance(batch,dict):
                        # A02: a skipped batch is a partial read, not a silent
                        # success with an incomplete instrument list.
                        self._record_failure(TypeError('unexpected free_stockdb instrument batch shape'),
                            {'dataset':'instruments','batch_offset':offset,'batch_size':min(200,len(codes)-offset)})
                        continue
                    for code,observations in batch.items():
                        if not observations or code not in by_code:continue
                        latest=observations[0];item=by_code[code]
                        if latest.get('name'):item['name']=latest['name']
                        item['total_shares']=latest.get('total_share');item['float_shares']=latest.get('float_share')
                        item['metadata_date']=boundary(latest['date']).date().isoformat();item['event_time']=item['metadata_date']
                        item['tick_size']=0.01

            elif asset_type in ('index','etf'):
                result=[]
                for exchange in ('SH','SZ','BJ'):
                    prefix=exchange.lower();folder=self.tdx.vipdoc/prefix/'lday'
                    for path in sorted(folder.glob(prefix+'*.day')):
                        code=path.stem[2:]
                        is_index=(exchange=='SH' and code.startswith('000')) or (exchange=='SZ' and code.startswith('399')) or (exchange=='BJ' and code.startswith('899'))
                        is_etf=(exchange=='SH' and code.startswith(('51','52','56','58'))) or (exchange=='SZ' and code.startswith('15'))
                        if (asset_type=='index' and is_index) or (asset_type=='etf' and is_etf):
                            result.append({'symbol':code+'.'+exchange,'name':code,'exchange':exchange,'asset_type':asset_type,'source':'tdx_local','listing_date':None,'status':None})
            else:raise ValueError('unsupported asset type')
            result=self._apply_real_names(result)
            self._instruments[asset_type]=result;self._instruments_day[asset_type]=datetime.now().date()
            return result
    def _sdk_bars(self,symbol,start,end,freq,asset_type):
        code,_=symbol_parts(symbol)
        with self._lock:
            rows=self.sdk.get_data(code=code,start=start.strftime('%Y%m%d' if freq=='1d' else '%Y%m%d%H%M%S'),end=end.strftime('%Y%m%d' if freq=='1d' else '%Y%m%d%H%M%S'),frequency=freq,fq=None)
        if isinstance(rows,dict):rows=rows.get(code,[])
        out=[]
        for r in rows:
            stamp=boundary(r['date'])
            if not start<=stamp<=end:continue
            row=canonical_bar(r,symbol,'free_stockdb',minute=freq!='1d',asset_type=asset_type)
            if freq!='1d':row['freq']=freq
            out.append(row)
        if out:self._samples[freq]={'symbol':symbol,'latest':out[-1].get('date',out[-1].get('datetime')),'source':'free_stockdb'}
        return out
    def _merge(self,merged,rows,key):
        for row in rows:
            old=merged.get(row[key])
            if old and old['source']!=row['source'] and any(old.get(k)!=row.get(k) for k in ('open','high','low','close','volume','amount')):
                fields=_OHLCV
                conflict_class=_classify_conflict(old,row)
                conflict={'symbol':row['symbol'],'time':row[key],'key':key,
                    'previous':dict(old),'selected':dict(row),
                    'previous_source':old.get('source'),'selected_source':row.get('source'),
                    'previous_source_version':old.get('source_version') or old.get('version'),
                    'selected_source_version':row.get('source_version') or row.get('version'),
                    'precision':{k:{'previous':_precision(old.get(k)),'selected':_precision(row.get(k))} for k in fields},
                    'conflict_class':conflict_class,'comparison_tolerance':CONFLICT_TOLERANCE,
                    'requires_reconciliation':conflict_class=='MATERIAL_VALUE_DISAGREEMENT',
                    'unit_policy':'raw price / volume in hands / amount in CNY; no unit or scale normalization applied',
                    'selection':'merge order under configured local quant priority; later source overwrites the key',
                    'reason':('two sources disagree materially on OHLCV for the same (symbol,bar); both values retained'
                              if conflict_class=='MATERIAL_VALUE_DISAGREEMENT' else
                              'values differ only within float32/binary rounding tolerance; both retained, not a source disagreement'),
                    'reconciled':False}
                self._conflict_count+=1
                if conflict_class=='MATERIAL_VALUE_DISAGREEMENT':self._material_conflict_count+=1
                self._conflicts.append(conflict)  # in-process list no longer truncated
                self.evidence_log().safe_append('CONFLICT',conflict,
                    scope={'dataset':'local_bars','fixed_datasets_only':True},purpose='source_conflict')
            merged[row[key]]=row
    def _record_failure(self,error,context=None):
        item={'error':str(error),'error_type':type(error).__name__,'context':context or {},
              'observed_at':datetime.now(ZoneInfo('Asia/Shanghai')).isoformat(),
              'impact':'PARTIAL_RESULT: upstream read failed; local TDX bars only; response flagged degraded',
              'zero_fill':False}
        self._read_failure_count+=1
        self._failures.append(item)  # in-process list no longer truncated
        self.evidence_log().safe_append('FAILED',item,
            scope={'dataset':(context or {}).get('dataset'),'fixed_datasets_only':True},purpose='local_read')
    def daily(self,symbols,start_time,end_time,asset_type='stock'):
        start,end=boundary(start_time),boundary(end_time,True);out=[]
        for symbol in symbols:
            local=self.tdx.daily([symbol],start,end,asset_type)
            try:rows=self._sdk_bars(symbol,start,end,'1d',asset_type) if asset_type=='stock' else []
            except Exception as exc:
                self._record_failure(exc,{'dataset':'daily','symbol':symbol,'asset_type':asset_type,
                    'start':start.isoformat(),'end':end.isoformat()})
                if not local:raise SourceUnavailable('free_stockdb unavailable and no local TDX bars') from exc
                rows=[]
            merged={r['date']:r for r in local};self._merge(merged,rows,'date')
            out.extend(merged[k] for k in sorted(merged))
        return out
    def minute(self,symbols,start_time,end_time,asset_type='stock',freq='1m'):
        if freq not in ('1m','5m','15m','30m','60m'):raise ValueError('unsupported frequency')
        start,end=boundary(start_time),boundary(end_time,True);out=[]
        for symbol in symbols:
            code,_=symbol_parts(symbol);merged={}
            if freq in ('1m','5m'):
                merged.update({r['datetime']:r for r in self.tdx.minute([symbol],start,end,asset_type,freq)})
            if freq=='5m' and asset_type=='stock' and start.year<=2024:
                import pyarrow.parquet as pq
                for year in range(start.year,min(end.year,2024)+1):
                    path=self.data_root/'parquet_5min'/str(year)/(code+'.parquet')
                    if not path.exists():continue
                    for r in pq.read_table(path,columns=['datetime','open','high','low','close','volume_lots','amount']).to_pylist():
                        if start<=boundary(r['datetime'])<=end:
                            r['volume']=r.pop('volume_lots');row=canonical_bar(r,symbol,'local_parquet_5min_raw',True,True,asset_type);row['freq']=freq;self._merge(merged,[row],'datetime')
            if end>=datetime(2025,1,2) and asset_type=='stock':
                try:rows=self._sdk_bars(symbol,max(start,datetime(2025,1,2)),end,freq,asset_type)
                except Exception as exc:
                    self._record_failure(exc,{'dataset':'minute','symbol':symbol,'freq':freq,
                        'start':start.isoformat(),'end':end.isoformat()})
                    if not merged:raise SourceUnavailable('free_stockdb unavailable and no local minute bars') from exc
                    rows=[]
                self._merge(merged,rows,'datetime')
            out.extend(merged[k] for k in sorted(merged))
        return out
    def adj_factors(self,symbols,start_time,end_time,asset_type='stock'):
        if asset_type!='stock':raise SourceUnavailable('local ETF/index adjustment factors not verified')
        start,end=boundary(start_time),boundary(end_time,True);out=[]
        for symbol in symbols:
            code,_=symbol_parts(symbol)
            with self._lock:
                events=self.sdk.get('复权:'+code+'*')
                events=events.do() if hasattr(events,'do') else events
            if not isinstance(events,list):raise SourceUnavailable('stockdb adjustment event response invalid')
            for key,r in events:
                day=boundary(key.rsplit(':',1)[-1])
                if start<=day<=end:
                    mult=float(r['mult'])
                    if mult<=0:raise SourceUnavailable('invalid stockdb event multiplier')
                    out.append({'symbol':symbol,'asset_type':asset_type,'source':'free_stockdb','trade_date':day.date().isoformat(),'ex_factor':mult})
        return out
    def boards(self):
        with self._lock:
            sdk=self.sdk  # Initializes the SDK search path even when boards is the first request.
            from zhibiao import BoardIndex
            raw=sdk.get('板块*')
            if hasattr(raw,'do'):raw=raw.do()
            rows=BoardIndex(rows=raw).get()
        return [{**r,'source':'free_stockdb','pit_verified':False} for r in rows]+self.tdx.boards()
    def financials(self,table,symbols,latest_only=True):
        return self.tdx.financials(table,symbols,latest_only)
    def source_status(self):
        ev=self.evidence_log()
        recent_conflicts=[r.get('payload') for r in ev.recent('CONFLICT',20)]
        if not recent_conflicts:recent_conflicts=[dict(c) for c in self._conflicts[-20:]]
        return {'provider':'local_quant','data_root_exists':self.data_root.is_dir(),
            'tdx_vipdoc_exists':self.tdx.vipdoc.is_dir(),'tdx_export_exists':self.tdx.export.is_dir(),
            'observed_samples':dict(self._samples),'price_basis':'raw','volume_unit':'hand','amount_unit':'CNY',
            'conflict_count':self._conflict_count,
            'material_conflict_count':self._material_conflict_count,
            'precision_rounding_conflicts':self._conflict_count-self._material_conflict_count,
            'conflicts_recent':recent_conflicts,
            'conflicts_full_evidence':{'path':str(ev.path),'kind':'CONFLICT','truncated':False},
            'source_failures_recent':[str(f['error']) for f in self._failures[-20:]],
            'source_failures_detail':[dict(f) for f in self._failures[-20:]],
            'source_failures_full_evidence':{'path':str(ev.path),'kind':'FAILED',
                                             'total':self._read_failure_count,'truncated':False},
            'read_health':self.read_health(),
            'financial':'RAW_OBSERVATION_ONLY','read_only':True}
