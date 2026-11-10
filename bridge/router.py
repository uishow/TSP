"""Purpose-aware routing. Historical reads never fetch a current remote revision."""
from __future__ import annotations
import hashlib
import json
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo
from .calendar import TradingCalendar, expected_boundary
from . import financial_schema as fs

class SourceUnavailable(RuntimeError):
    pass


def assess_freshness(rows, symbols, dataset, now, freq, calendar):
    """A05 observation layer: per-symbol coverage against a completed boundary.

    ADVISORY ONLY. This does not change the existing refresh decision, because
    switching admission to calendar authority requires a real trading-session
    validation (E01). A non-empty response is never declared "latest" without
    both a completed boundary and calendar evidence.
    """
    boundary = expected_boundary(now, 'daily' if dataset == 'daily' else freq, calendar) \
        if dataset in ('daily', 'minute') else None
    seen = {}
    for row in rows:
        event = row.get('datetime') or row.get('date')
        if event:
            symbol = row.get('symbol')
            seen[symbol] = max(str(event), seen.get(symbol, ''))
    target = boundary.get('boundary') if boundary else None
    per_symbol = []
    for symbol in symbols:
        latest = seen.get(symbol)
        covers = None if not target else (latest is not None and latest >= target)
        per_symbol.append({'symbol': symbol, 'latest_event': latest,
                           'covers_expected_boundary': covers,
                           'note': 'NO_OBSERVATION_SUSPENDED_OR_MISSING' if latest is None else None})
    all_covered = bool(per_symbol) and all(p['covers_expected_boundary'] is True for p in per_symbol)
    return {'gate': 'ADVISORY_NOT_ENFORCED', 'boundary': boundary,
            'calendar': calendar.status(), 'per_symbol': per_symbol,
            'all_symbols_cover_boundary': all_covered,
            'suspended_candidates': [p['symbol'] for p in per_symbol
                                     if p['latest_event'] is None],
            'latest_verified': bool(all_covered and boundary and boundary.get('calendar_verified')),
            'reason': 'latest_verified requires per-symbol coverage AND a proven '
                      'trading session; non-empty is not sufficient'}


def verify_remote_freshness(remote, boundary):
    """Second check after a live refresh: non-empty is not automatically latest."""
    target = boundary.get('boundary') if boundary else None
    if not target:
        return {'state': 'UNKNOWN_NO_AUTHORITY_BOUNDARY', 'latest_verified': False}
    events = [str(r.get('datetime') or r.get('date') or '') for r in remote]
    events = [e for e in events if e]
    if not events:
        return {'state': 'NO_DATED_OBSERVATIONS', 'latest_verified': False}
    reaches = max(events) >= target
    return {'state': 'REACHES_BOUNDARY' if reaches else 'BELOW_BOUNDARY',
            'remote_latest_event': max(events), 'expected_boundary': target,
            'latest_verified': bool(reaches and boundary.get('calendar_verified')),
            'reason': 'empty or lagging live rows are never treated as a completed session'}


def _local_health(local):
    """Best-effort read-health snapshot; injected test stores may not provide it."""
    fn=getattr(local,'read_health',None)
    if not callable(fn):return {}
    try:return fn() or {}
    except Exception:return {}


def prefer_newer(local, remote):
    """Merge an explicitly requested live refresh, retaining both conflict values."""
    rows={}; conflicts=[]
    for record in [*local, *remote]:
        row=dict(record); key=(row.get('symbol'), row.get('datetime') or row.get('date'))
        if key in rows and rows[key] != row:
            conflicts.append({'key':list(key),'previous':rows[key], 'selected':row})
        rows[key]=row
    return sorted(rows.values(),key=lambda r:(str(r.get('datetime') or r.get('date') or ''),str(r.get('symbol') or ''))), conflicts


def _in_window(row, start, end):
    value=row.get('datetime') or row.get('date') or row.get('trade_date')
    if not value:return True
    value=str(value).replace(' ','T')
    low=str(start or '').replace(' ','T')
    high=str(end or '9999-12-31').replace(' ','T')
    if len(value)==10:
        low=low[:10];high=high[:10]
    elif len(high)==10:high+='T23:59:59.999999'
    return (not low or value>=low) and value<=high


def needs_refresh(rows,symbols,dataset,now):
    """Conservative weekday/session check; response never claims holiday authority."""
    day=now.date()
    if day.weekday()>=5 or now.time() < (time(15,30) if dataset=='daily' else time(9,31)):
        day-=timedelta(days=1)
        while day.weekday()>=5:day-=timedelta(days=1)
        clock=time(15,0)
    else:
        clock=min(now.time().replace(second=0,microsecond=0),time(15,0))
        if time(11,30)<clock<time(13,1):clock=time(11,30)
    target=day.isoformat() if dataset=='daily' else datetime.combine(day,clock).isoformat()
    seen={}
    for r in rows:
        event=r.get('datetime') or r.get('date')
        if event:seen[r.get('symbol')]=max(str(event),seen.get(r.get('symbol'),''))
    return any(seen.get(s,'')<target for s in symbols)


def after_hours_local_daily(rows,now):
    """True when local daily bars already cover today's session after the close.

    After 15:30 the local free_stockdb daily bars are authoritative. A requested
    symbol with no session observation is normally a suspended issue, not stale
    data: asking the live source then (empty after hours) would discard valid
    local bars and abort the after-hours pipeline. Never zero-fill, never fall
    back to a vendor source.
    """
    if now.weekday()>=5 or now.time()<time(15,30):
        return False
    today=now.date().isoformat()
    return any(str(r.get('date') or r.get('datetime') or '')[:10]==today for r in rows)


class Router:
    def __init__(self, local=None, live=None, now=None, calendar=None):
        if local is None:
            from .local_store import LocalStore
            local=LocalStore()
        self.local=local; self._live=live; self._finance=None; self._fuyao=None
        self._pit=None
        self._calendar=calendar
        self._now=now or (lambda:datetime.now(ZoneInfo('Asia/Shanghai')).replace(tzinfo=None))

    @property
    def live(self):
        if self._live is None:
            from .live_sources import LiveSources
            self._live=LiveSources()
        return self._live

    @property
    def finance(self):
        if self._finance is None:
            from .finance import FinancialSources
            self._finance=FinancialSources(self.local.tdx,self.live)
        return self._finance

    @property
    def fuyao(self):
        """Read-only view of host-side offline import; never opens a socket."""
        if self._fuyao is None:
            from .fuyao_offline import FuyaoStore
            self._fuyao=FuyaoStore()
        return self._fuyao

    @property
    def pit(self):
        """Lazily build the fuyao-fed PIT (ledger, store) pair.

        Only verified recent (2026) disclosure dates are loaded; historical
        back-filled/conflict rows stay out. Cached after first build.
        """
        if self._pit is None:
            from .fuyao_pit import load_fuyao_pit
            self._pit = load_fuyao_pit()
        return self._pit

    def query_financial_pit(self, symbol, decision_at, table='income'):
        """PIT-correct financial version for one symbol at a decision date.

        Returns the latest financial version published on/before ``decision_at``,
        sourced from fuyao's verified recent disclosure dates, plus the actual
        statement values for that period (observed, not PIT-dated). For decision
        points before any verified disclosure, returns ``(None, block_detail)`` —
        never an anachronistic or current value. This is the real PIT entry point
        the C07 policy gates; historical (2025-earlier) stays blocked.
        """
        ledger, store = self.pit
        av, payload = store.available_at_decision('financial', symbol, decision_at)
        if av is None:
            return None, {
                'verdict': 'BLOCK_NO_PIT_EVIDENCE', 'symbol': str(symbol),
                'decision_at': str(decision_at),
                'reason': 'no fuyao-verified disclosure before decision; '
                          'historical disclosure dates are back-filled/conflict',
            }
        period_end = payload.get('period_end')
        rows = self.fuyao.statements(table, [symbol])
        row = next((r for r in rows if r.get('period_end') == period_end), None)
        return row, {
            'verdict': 'ALLOW', 'served_available_at': av,
            'period_end': period_end, 'symbol': str(symbol),
            'value_source': 'fuyao:observed_not_pit_dated',
            'value_present': row is not None,
        }

    def _enrich_instrument_names(self, rows):
        """2026-11-10 #13: 用全市场实时快照自带的中文名覆盖「代码型 name」。

        本地 free-stockdb 日线 bar 不带 name; ``LocalStore._eltdx_name_map``
        依赖 eltdx codes 握手, 交易时段常超时并缓存空映射, 于是「数据-
        立即同步」把 instruments 的 name 写成 000001 这种代码, 连板梯队/
        搜索/快照全部显示代码。这里复用已在生产跑的全市场快照 (一次请求
        5600+ 行, 每行带 name), 只替换「空 / 纯数字 / 等于代码」的 name。

        快照不可用 (盘后 / 握手失败 / 无 name) 时原样返回, 绝不阻断同步,
        也绝不把真实名称改回代码。
        """
        try:
            snap = self.live.market_snapshot()
        except Exception:  # noqa: BLE001 -- 名称是增强项, 失败必须静默降级
            return rows
        names = {str(r.get('symbol')): r.get('name') for r in snap
                 if r.get('symbol') and r.get('name')}
        if not names:
            return rows
        for item in rows:
            sym = str(item.get('symbol') or '')
            code = sym.split('.')[0]
            old = item.get('name')
            bad = (old is None or str(old).strip() == '' or str(old).strip() == code
                   or (isinstance(old, str) and old.isdigit() and len(old) <= 6))
            if bad and names.get(sym):
                item['name'] = names[sym]
        return rows

    def query(self, dataset, symbols=None, start_time=None, end_time=None, asset_type='stock',
              freq='1m', table='metrics', latest_only=True, require_latest=False, **extra):
        if extra:raise ValueError('Unsupported query fields')
        if dataset not in {'instruments','daily','minute','adj_factor','realtime','depth5','financial','boards','export_daily','fuyao'}:
            raise ValueError('Unsupported dataset')
        health_before=_local_health(self.local)
        kwargs=dict(symbols=symbols or [],start_time=start_time,end_time=end_time,asset_type=asset_type)
        conflicts=[];refresh_note=None;assessment=None;remote_check=None
        calendar=self._calendar
        if require_latest and dataset in ('daily','minute') and calendar is None:
            calendar=TradingCalendar();self._calendar=calendar
        try:
            if dataset=='instruments':
                rows=self.local.instruments(asset_type=asset_type)
                rows=self._enrich_instrument_names(rows)
            elif dataset=='boards':rows=self.local.boards()
            elif dataset=='export_daily':rows=[r for symbol in (symbols or []) for r in self.local.tdx.export_daily(symbol,start_time,end_time)]
            elif dataset=='realtime':
                selected=symbols or []
                rows=(self.live.realtime(symbols=selected,asset_type=asset_type) if selected
                      else self.live.market_snapshot())
            elif dataset=='depth5':
                depth=self.live.depth(symbols or [],asset_type=asset_type)
                return {'rows':depth,'metadata':{'dataset':'depth5','count':len(depth),
                    'source':'eltdx:quotes.get_depth','no_fallback':True,'zero_fill':False,
                    'clock_evidence':'TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMMSS',
                    'stale_count':sum(1 for d in depth.values() if d.get('stale')),
                    'coverage':'OBSERVED_LEVELS_ONLY'}}
            elif dataset=='financial':
                # C05: align native table names. raw/observation stays the
                # untouched numbered gpcw observation; the three statements are
                # served by the host-side offline parquet (PIT-disabled);
                # metrics/shares use the named eltdx finance_batch fields. Every
                # path keeps pit_verified=False and never synthesises an
                # announcement date.
                table_norm=fs.normalize_table(table)
                if table_norm in fs.OBSERVATION_TABLES:
                    rows=self.local.financials(table=table_norm,symbols=symbols or [],latest_only=latest_only)
                elif table_norm in fs.OFFLINE_STATEMENT_TABLES:
                    rows=self.fuyao.statements(table_norm,symbols or None)
                elif table_norm in ('metrics','shares'):
                    rows=self.finance.rows(table_norm,symbols or [],latest_only)
                else:
                    raise ValueError('Unsupported financial table')
            elif dataset=='fuyao':
                # Host-side offline products only. No socket, no provider, no
                # fallback, and announce_date is never synthesised here.
                if table=='status':
                    rows=[self.fuyao.status()]
                elif table in ('income','balance_sheet','cash_flow'):
                    rows=self.fuyao.statements(table,symbols or None)
                elif table=='announce_candidates':
                    rows=[r for r in self.fuyao.candidates()
                          if not symbols or r.get('symbol') in symbols]
                elif table in ('concept','industry'):
                    rows=[r for r in self.fuyao.membership(table)
                          if not symbols or r.get('symbol') in symbols]
                else:
                    raise ValueError('Unsupported fuyao table')
            else:
                method={'adj_factor':'adj_factors'}.get(dataset,dataset)
                if dataset=='minute':kwargs['freq']=freq
                rows=getattr(self.local,method)(**kwargs)
                # Remote refresh is an explicit request for a current window only.
                now=self._now();today=now.date().isoformat()
                refresh_needed=(require_latest and dataset in {'daily','minute'}
                                and (not end_time or str(end_time)[:10]>=today)
                                and needs_refresh(rows,symbols or [],dataset,now))
                covers_session=dataset=='daily' and after_hours_local_daily(rows,now)
                if refresh_needed and covers_session:
                    # Local daily bars already include this session. Some symbols
                    # legitimately have no bar (suspended); an empty after-hours
                    # live refresh must not discard the observed local rows.
                    refresh_note='SKIPPED_AFTER_HOURS_LOCAL_DAILY_COVERS_SESSION'
                elif refresh_needed:
                    remote=getattr(self.live,dataset)(**kwargs)
                    if not remote:raise SourceUnavailable('Latest request returned no observations')
                    if calendar is not None:
                        try:
                            boundary=expected_boundary(now,'daily' if dataset=='daily' else freq,calendar)
                            remote_check=verify_remote_freshness(remote,boundary)
                        except Exception as exc:
                            remote_check={'state':'ASSESSMENT_UNAVAILABLE','error':type(exc).__name__,
                                          'latest_verified':False}
                    rows,conflicts=prefer_newer(rows,remote)
            if dataset in {'daily','minute','adj_factor'}:
                rows=[r for r in rows if _in_window(r,start_time,end_time)]
        except (ValueError,SourceUnavailable):raise
        except Exception as exc:
            raise SourceUnavailable(f'{dataset}: {type(exc).__name__}: {exc}') from exc
        # Assessment is an audit side path: it must never turn a healthy data
        # response into an error. Failure is recorded, not hidden.
        if require_latest and dataset in ('daily','minute') and calendar is not None:
            try:assessment=assess_freshness(rows,symbols or [],dataset,self._now(),freq,calendar)
            except Exception as exc:assessment={'gate':'ADVISORY_NOT_ENFORCED',
                'error':type(exc).__name__,'latest_verified':False}
        payload=json.dumps(rows,sort_keys=True,ensure_ascii=False,default=str)
        times=[str(r.get('datetime') or r.get('date') or r.get('trade_date')) for r in rows if r.get('datetime') or r.get('date') or r.get('trade_date')]
        meta={'dataset':dataset,'count':len(rows),'latest_event':max(times) if times else None,
            'oldest_event':min(times) if times else None,'sources':sorted({str(r.get('source','UNKNOWN')) for r in rows}),
            'source_versions':{'response_sha256':hashlib.sha256(payload.encode()).hexdigest(),'simultaneous_snapshot_proven':False},
            'retrieved_at':datetime.now(ZoneInfo('Asia/Shanghai')).isoformat(),'adjustment':'raw' if dataset in {'daily','minute'} else None,
            'clock_evidence':next((str(r.get('clock_evidence')) for r in rows if r.get('clock_evidence')),None),
            'freshness_calendar':'weekday/session heuristic; holiday authority not proven','latest_requested':require_latest,'latest_refresh':refresh_note,'conflicts':conflicts,'coverage':'OBSERVED_ROWS_ONLY','missing_values':'null; never zero-filled'}
        # A05: calendar / per-symbol boundary evidence (advisory, not admission).
        if assessment is not None:
            meta['freshness_assessment']=assessment
            meta['freshness_gate']='ADVISORY_NOT_ENFORCED'
        if remote_check is not None:meta['remote_freshness']=remote_check
        if dataset=='fuyao':
            meta.update({'coverage':'HOST_OFFLINE_IMPORT_READ_ONLY','no_network_access':True,
                'key_in_container':False,'pit_verified':False,'announce_date_verified':False,
                'field_mapping_verified':False,
                'note':'宿主机离线导入产物；report_date 仅为候选公告日，历史期存在回填与三表冲突，不可用于 PIT 回测。'})
        if dataset=='financial':
            table_norm=fs.normalize_table(table)
            vstat=fs.verification_status(table_norm)
            # B1/B2: recent (2026) disclosure dates are now PIT-verified via
            # fuyao; historical values are served as observed (not PIT-dated).
            pit_total=self.pit[0].coverage().get('ann_date_verified', 0)
            meta.update({'table':table_norm,'coverage':'OBSERVED_ROWS_ONLY','zero_fill':False,
                'pit_verified':False,'announce_date_verified':False,
                'field_mapping_verified':vstat['field_mapping_verified'],
                'period_semantics':vstat['period_semantics'],
                'pit_recent_evidence_total':pit_total,
                'pit_coverage':'RECENT_2026_ONLY_HISTORICAL_OBSERVED_NOT_DATED',
                'note':vstat['note'] + '；fuyao 近期(2026)披露日已三表交叉验证并接入 PIT，'
                       '历史(2025及更早)财务数值作为观察值开放、不作定日回测。'})
        # A02: a request that fell back to partial local bars must say so.
        health_after=_local_health(self.local)
        before=int(health_before.get('read_failure_count') or 0)
        after=int(health_after.get('read_failure_count') or 0)
        delta=max(0,after-before)
        meta['degraded_local_read']=bool(delta)
        meta['local_read_failures_delta']=delta
        meta['local_read_failure_count_total']=after
        if delta:
            meta['degraded_reasons']=[str(x) for x in (health_after.get('recent_read_failures') or [])[-3:]]
            meta['coverage']='PARTIAL_OBSERVED_ROWS_ONLY'
            meta['partial_result']=True
            meta['zero_fill']=False
        return {'rows':rows,'metadata':meta}
