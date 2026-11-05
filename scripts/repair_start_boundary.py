"""Repair only the missing initial import date; keep the prior derived version."""
from pathlib import Path
from datetime import datetime
import hashlib,json,shutil
from app.config import settings
from app.tickflow.repository import DataStore,KlineRepository
from app.tickflow.capabilities import CapabilitySet
from app.services.kline_sync import sync_and_persist_daily_batch,sync_adj_factor
from app.indicators.pipeline import run_pipeline

root=settings.data_dir
partition=root/'kline_daily'/'date=2025-11-04'
assert not partition.exists(),'Refusing to overwrite an already populated partition'
archive=root/'local_source_evidence'/'initial-boundary-repair'/datetime.now().strftime('%Y%m%dT%H%M%S')
archive.mkdir(parents=True)
old=root/'kline_daily_enriched';files=list(old.rglob('*.parquet'))
assert shutil.disk_usage(root).free>sum(f.stat().st_size for f in files)*3
shutil.copytree(old,archive/'prior_enriched')
copy=list((archive/'prior_enriched').rglob('*.parquet'))
assert len(copy)==len(files) and all(f.stat().st_size>0 for f in copy)
factors=root/'adj_factor'/'all.parquet'
if factors.exists():shutil.copy2(factors,archive/'prior_adj_factor.parquet')
prior_raw={str(f.relative_to(root)):hashlib.sha256(f.read_bytes()).hexdigest() for f in (root/'kline_daily').rglob('*.parquet')}
repo=KlineRepository(DataStore());symbols=repo.get_instruments()['symbol'].to_list();zero=[];failed=[]
start=datetime(2025,11,4);end=datetime(2025,11,4,23,59,59)
written=sync_and_persist_daily_batch(symbols,repo,CapabilitySet(),start_date=start,end_date=end,zero_row_out=zero,failed_out=failed)
assert not failed,failed
added,affected=sync_adj_factor(symbols,repo,CapabilitySet(),start_time=start,end_time=end)
assert all(hashlib.sha256((root/f).read_bytes()).hexdigest()==digest for f,digest in prior_raw.items())
enriched=run_pipeline()
report={'repair_date':'2025-11-04','cause':'date-only row compared against datetime start excluded the first day','missing_partition_before':True,'imported_rows':written,'zero_rows_symbols':zero,'failed_symbols':failed,'adj_events_added':added,'adj_affected':affected,'enriched_rows_after':enriched,'enriched_days_after':len(list(old.glob('date=*'))),'prior_derived_archive':str(archive),'prior_raw_partitions_unchanged':True,'historical_import_not_live_capture':True}
(archive/'repair.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
