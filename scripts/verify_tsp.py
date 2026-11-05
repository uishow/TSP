"""Run inside the pinned TSP image. No strategy is published or executed live."""
from datetime import date
from dataclasses import asdict
import json,socket
import polars as pl
from app.config import settings
from app.tickflow.repository import DataStore,KlineRepository
from app.services.screener import ScreenerService
from app.strategy.engine import StrategyEngine,StrategyDef
from app.backtest.engine import BacktestEngine
from app.backtest.strategy import StrategyBacktestService,StrategyBacktestConfig
from app.data_providers import custom
from app.services import preferences

repo=KlineRepository(DataStore());engine=StrategyEngine()
s=StrategyDef(meta={'id':'local_source_smoke','name':'数据链路验收：收盘高于20日均线','version':'1','params':[]},basic_filter={},entry_signals=[],exit_signals=[],stop_loss=0.08,trailing_stop=None,trailing_take_profit_activate=None,trailing_take_profit_drawdown=None,max_hold_days=5,filter_fn=lambda frame,params:pl.col('close')>pl.col('ma20'),filter_history_fn=None,lookback_days=60,source='custom',required_features=frozenset({'close','ma20'}))
engine._strategies[s.meta['id']]=s
svc=ScreenerService(repo);asof=svc.latest_date()
context=svc.build_strategy_context(engine,asof,[s.meta['id']])
scan=engine.run(s.meta['id'],context)
result=StrategyBacktestService(BacktestEngine(repo),engine).run(StrategyBacktestConfig(strategy_id=s.meta['id'],symbols=['600031.SH','000001.SZ'],start=date(2026,7,1),end=date(2026,11,3),initial_capital=100000,max_positions=2,mode='position',fees_pct=0.0002,slippage_bps=5))
assert result.error is None,result.error
assert len(result.equity_curve)>0
blocked={}
for host in ['free-api.tickflow.org','fuyao.aicubes.cn','1.1.1.1']:
 try:socket.getaddrinfo(host,443);blocked[host]=False
 except PermissionError:blocked[host]=True
assert all(blocked.values())
assert preferences.get_daily_data_provider()=='local_quant'
p=custom.get_provider('local_quant')
minute=p.get_minute(['600031.SH'],start_time='2024-12-31',end_time='2025-01-02',freq='5m')
assert len(minute)==96
assert minute['datetime'].max().isoformat()=='2025-01-02T15:00:00'
report={'scan':{'as_of':str(asof),'selected':scan.total,'scope':'full locally registered stock universe'},'backtest':{'status':'PASS_DATA_CHAIN_ONLY','period':['2026-07-01','2026-11-03'],'symbols':['600031.SH','000001.SZ'],'equity_points':len(result.equity_curve),'trades':len(result.trades),'fees_pct':0.0002,'slippage_bps':5,'profit_validation':False},'cross_year_minute':{'rows':len(minute),'first':str(minute['datetime'].min()),'last':str(minute['datetime'].max()),'sources':minute['source'].unique().to_list()},'network_blocks':blocked,'execution_authorized':False,'actual_fills':'UNKNOWN'}
print(json.dumps(report,ensure_ascii=False,indent=2))
