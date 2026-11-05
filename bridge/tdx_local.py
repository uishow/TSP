"""Read-only Tongdaxin local binary bars and explicitly adjusted text exports."""
from pathlib import Path
from datetime import datetime
import struct
from .schemas import boundary, canonical_bar, symbol_parts, SourceUnavailable

TDX_ROOT=Path('/Users/beryllewis/Library/Application Support/CrossOver/Bottles/通达信/drive_c/tdx-new')

class TDXLocal:
    def __init__(self,vipdoc=None,export=None):
        self.vipdoc=Path(vipdoc) if vipdoc else TDX_ROOT/'vipdoc'
        self.export=Path(export) if export else TDX_ROOT/'T0002/export'
    def _bars(self,symbol,start,end,minute=False,freq='1m',asset_type='stock'):
        code,exchange=symbol_parts(symbol);market=exchange.lower()
        folder,ext=('fzline','lc5') if freq=='5m' else ('minline','lc1')
        if not minute:folder,ext='lday','day'
        path=self.vipdoc/market/folder/f'{market}{code}.{ext}'
        if not path.exists():return []
        start,end=boundary(start),boundary(end,True);out=[]
        with path.open('rb') as f:
            while raw:=f.read(32):
                if len(raw)!=32:raise SourceUnavailable(f'truncated TDX bar file: {path.name}')
                if minute:
                    day,minutes,o,h,l,c,amount,volume,_=struct.unpack('<HHfffffII',raw)
                    dt=datetime(day//2048+2004,(day%2048)//100,(day%2048)%100,minutes//60,minutes%60)
                else:
                    day,o,h,l,c,amount,volume,_=struct.unpack('<IIIIIfII',raw)
                    dt=datetime.strptime(str(day),'%Y%m%d')
                    divisor=1000 if asset_type=='etf' else 100
                    o,h,l,c=[v/divisor for v in (o,h,l,c)]
                if start<=dt<=end:
                    row=canonical_bar({'datetime':dt,'open':o,'high':h,'low':l,'close':c,'volume':volume,'amount':amount},symbol,'tdx_local_'+ext,minute=minute,volume_in_lots=(asset_type=='etf' and not minute),asset_type=asset_type)
                    if minute:row['freq']=freq
                    if asset_type=='etf' and not minute:
                        # ETF .day volume encoding varies across records. Admit a
                        # unit only if its implied VWAP fits the raw OHLC range.
                        candidates=[scale for scale in (0.01,1.0) if volume>0 and amount>0 and l*.995<=amount/(volume*scale*100)<=h*1.005]
                        scale=candidates[0] if len(candidates)==1 else None
                        row['volume']=volume*scale if scale is not None else (0.0 if volume==0 and amount==0 else None)
                        row['raw_volume']=volume
                        row['volume_scale_to_hand']=scale
                        row['volume_quality']='AMOUNT_PRICE_BOUND_VERIFIED' if scale is not None else ('OBSERVED_ZERO' if volume==0 and amount==0 else 'UNIT_UNVERIFIED')
                    out.append(row)
        return out
    def daily(self,symbols,start_time,end_time,asset_type='stock'):
        return [r for s in symbols for r in self._bars(s,start_time,end_time,asset_type=asset_type)]
    def minute(self,symbols,start_time,end_time,asset_type='stock',freq='1m'):
        if freq not in ('1m','5m'):raise SourceUnavailable('TDX local minute supports 1m/5m only')
        return [r for s in symbols for r in self._bars(s,start_time,end_time,True,freq,asset_type)]
    def export_daily(self,symbol,start_time,end_time):
        """Qfq export is a separate observation endpoint, never raw daily fallback."""
        code,exchange=symbol_parts(symbol);path=self.export/f'{exchange}#{code}.txt'
        if not path.exists():return []
        lines=path.read_text(encoding='gb18030',errors='replace').splitlines()
        if not lines or '前复权' not in lines[0]:raise SourceUnavailable('export adjustment basis not declared')
        start,end=boundary(start_time),boundary(end_time,True);out=[]
        for line in lines[2:]:
            cols=line.split()
            if len(cols)<7:continue
            try:dt=datetime.strptime(cols[0],'%Y/%m/%d')
            except ValueError:continue
            if not start<=dt<=end:continue
            row=canonical_bar(dict(zip(['date','open','high','low','close','volume','amount'],[dt,*cols[1:7]])),symbol,'tdx_export_qfq')
            row.update(adjustment='qfq',pit_verified=False,source_file=path.name);out.append(row)
        return out
    def boards(self):
        """Read explicitly authorized exported membership files, retaining taxonomy."""
        import re
        grouped={}
        categories=[('地区','region'),('风格','style'),('指数','index_membership'),('行业','tdx_industry'),('概念','tdx_concept'),('自定义','custom_membership')]
        for category,kind in categories:
            path=self.export/(category+'板块.txt')
            if not path.exists():continue
            stat=path.stat()
            with path.open(encoding='gb18030') as f:
                for line in f:
                    parts=line.rstrip('\r\n').split('\t')
                    if len(parts)<4:continue
                    code,label,member,name=parts[:4]
                    if not re.fullmatch(r'\d{6}',member):continue
                    key=(kind,code)
                    row=grouped.setdefault(key,{'code':code,'name':label,'category':category,'type':kind,'group':'通达信导出'+category,'source':'tdx_export_membership','source_file':path.name,'source_mtime_ns':stat.st_mtime_ns,'symbols':[],'pit_verified':False})
                    if member not in row['symbols']:row['symbols'].append(member)
        return list(grouped.values())

    def financials(self,table,symbols,latest_only=True):
        """Raw gpcw observation, report date is NOT announcement date.

        Binary layout verified against pytdx HistoryFinancialCrawler:
        https://github.com/rainx/pytdx/blob/master/pytdx/crawler/history_financial_crawler.py
        Columns remain numbered until an authoritative field mapping is admitted.
        """
        import zipfile
        import math
        if table not in ('raw','observation'):
            raise SourceUnavailable('财务字段语义/公告日期尚未核验；仅可读取raw/observation，禁止用于PIT财务')
        wanted={symbol_parts(s)[0]:s for s in symbols};out=[];found=set()
        by_period={p.name[4:12]:p for p in (self.vipdoc/'cw').glob('gpcw????????.zip')}
        by_period.update({p.name[4:12]:p for p in (self.vipdoc/'cw').glob('gpcw????????.dat')})
        files=[by_period[k] for k in sorted(by_period,reverse=True)]
        for path in files:
            if latest_only and len(found)==len(wanted):break
            if path.suffix=='.zip':
                with zipfile.ZipFile(path) as z:
                    members=[i for i in z.infolist() if i.filename.endswith('.dat')]
                    if len(members)!=1 or members[0].file_size>128*1024*1024:
                        raise SourceUnavailable('invalid gpcw archive')
                    payload=z.read(members[0])
            else:payload=path.read_bytes()
            if len(payload)<20:raise SourceUnavailable('truncated gpcw header')
            _,report,count,_,size,_=struct.unpack_from('<hIHIII',payload)
            if count==0:continue  # Explicit empty future-report placeholders contain no observation.
            if size%4 or size>16384 or len(payload)<20+11*count:raise SourceUnavailable('invalid gpcw dimensions')
            for i in range(count):
                code,_,offset=struct.unpack_from('<6scI',payload,20+11*i);code=code.decode('ascii')
                if code not in wanted or (latest_only and code in found):continue
                if offset+size>len(payload):raise SourceUnavailable('truncated gpcw report')
                values=struct.unpack_from('<'+str(size//4)+'f',payload,offset)
                row={'symbol':wanted[code],'period_end':boundary(report).date().isoformat(),'ann_date':None,'source':'tdx_gpcw_observation','source_file':path.name,'pit_verified':False,'field_mapping_verified':False}
                row.update({f'col{j+1}':v if math.isfinite(v) and abs(v)<1e30 else None for j,v in enumerate(values)})
                out.append(row);found.add(code)
        return out
