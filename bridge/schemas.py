"""Local source canonical contract: raw prices, hands, yuan, Beijing wall clock."""
from datetime import date, datetime, time
from zoneinfo import ZoneInfo
import math
import re

class SourceUnavailable(RuntimeError):
    """The requested source/semantic coverage is unavailable; never treat as zero."""

def symbol_parts(symbol):
    m=re.fullmatch(r'(\d{6})\.(SH|SZ|BJ)',str(symbol).upper())
    if not m: raise ValueError('symbol must be six digits plus .SH/.SZ/.BJ')
    return m.group(1),m.group(2)

def infer_symbol(code):
    code=str(code)
    if '.' in code:
        symbol_parts(code);return code
    if len(code)!=6 or not code.isdigit(): raise ValueError('invalid security code')
    return code+'.'+('SH' if code[0] in '569' and not code.startswith('92') else 'BJ' if code[0] in '48' or code.startswith('92') else 'SZ')

def boundary(value,end=False):
    if value is None: return datetime.now(ZoneInfo('Asia/Shanghai')).replace(tzinfo=None) if end else datetime(2000,1,1)
    if isinstance(value,datetime):
        return value.astimezone(ZoneInfo('Asia/Shanghai')).replace(tzinfo=None) if value.tzinfo else value
    if isinstance(value,date): return datetime.combine(value,time(23,59,59) if end else time.min)
    v=str(value).strip()
    if re.fullmatch(r'\d{8}',v): return datetime.combine(datetime.strptime(v,'%Y%m%d').date(),time(23,59,59) if end else time.min)
    if re.fullmatch(r'\d{14}',v): return datetime.strptime(v,'%Y%m%d%H%M%S')
    if re.fullmatch(r'\d{4}-\d{2}-\d{2}',v): return datetime.combine(date.fromisoformat(v),time(23,59,59) if end else time.min)
    return boundary(datetime.fromisoformat(v))

def number(value):
    if value is None:return None
    n=float(value)
    if not math.isfinite(n):return None
    return n

def canonical_bar(row,symbol,source,minute=False,volume_in_lots=False,asset_type='stock'):
    dt=boundary(row.get('datetime',row.get('date')))
    values={k:number(row.get(k)) for k in ('open','high','low','close','volume','amount','pre_close')}
    if any(values[k] is None for k in ('open','high','low','close')):raise SourceUnavailable(f'{source}: missing OHLC for {symbol}')
    if values['volume'] is not None and not volume_in_lots:values['volume']/=100
    pct=number(row.get('pct_chg'))
    values['change_pct']=pct/100 if pct is not None else ((values['close']/values['pre_close']-1) if values['pre_close'] else None)
    return {'symbol':symbol,'asset_type':asset_type,'source':source,('datetime' if minute else 'date'):(dt.isoformat(timespec='seconds') if minute else dt.date().isoformat()),**values}
