"""回填历史日K到 data-local/kline_daily（仅新增分区，不覆盖现有 2025-11-04+ 数据）。

链路（已端到端实测）:
  TSP 容器 -> local_quant 插件(HTTP) -> 宿主 bridge:7818 -> LocalStore.daily()
  -> free_stockdb(TDX本地/TDX二进制) 返回历史日K。

执行环境: 必须在 TSP 容器内、用应用运行时 python 执行（宿主 venv 未装上游 app 栈）。
  docker exec tsp-local python /app/.../scripts/backfill_kline_daily_history.py \
      --start 2024-01-01 --end 2025-11-03

幂等: 若某月分区已存在则跳过，可断点续跑。
"""
from __future__ import annotations
import sys, os, argparse, shutil, hashlib, json, datetime as dt
from pathlib import Path

# 容器内用 /app/.venv/bin/python 执行时，app 栈已由 PYTHONPATH 提供，
# 切勿把 /app/app 插入 sys.path，否则会遮蔽外部 PyPI `tickflow` 库。

from app.config import settings
from app.tickflow.repository import DataStore, KlineRepository
from app.services.kline_sync import sync_and_persist_daily_batch, sync_adj_factor
from app.indicators.pipeline import run_pipeline
from app.services.preferences import get_daily_data_provider


def month_bounds(start: dt.datetime, end: dt.datetime):
    cur = dt.datetime(start.year, start.month, 1)
    while cur <= end:
        nxt = dt.datetime(cur.year + 1, 1, 1) if cur.month == 12 else dt.datetime(cur.year, cur.month + 1, 1)
        m_end = nxt - dt.timedelta(days=1)
        yield cur, min(m_end, end)
        cur = nxt


def backup_kline_daily(data_dir: Path, tag: str) -> Path:
    """回填前全量备份 kline_daily（四行情表之一），返回备份根目录。"""
    src = data_dir / 'kline_daily'
    dst = data_dir / 'backups' / f'kline_daily_{tag}'
    if dst.exists():
        shutil.rmtree(dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(src, dst)
    return dst


def month_filled(data_dir: Path, ms: dt.datetime) -> bool:
    """该月任意交易日分区已存在即视为整月已填（幂等跳过，避免重复追加）。

    注意：交易日分区为 date=YYYY-MM-DD（实际交易日，非每月 1 号），
    故按月前缀匹配，不能只查 date=YYYY-MM-01。
    """
    kd = data_dir / 'kline_daily'
    if not kd.exists():
        return False
    prefix = f"date={ms.year:04d}-{ms.month:02d}-"
    return any(p.name.startswith(prefix) for p in kd.iterdir())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--start', default='2024-01-01', help='回填起点 YYYY-MM-DD')
    ap.add_argument('--end', default='2025-10-31', help='回填终点(对齐月末，全部整月；现有数据 2025-11-04 起)')
    ap.add_argument('--dry-run', action='store_true', help='只打印计划，不写数据')
    ap.add_argument('--no-backup', action='store_true', help='跳过备份（不建议）')
    ap.add_argument('--skip-finalize', action='store_true',
                    help='跳过收尾(adj_factor + run_pipeline)，供全量回填后单独收尾；'
                         '回填阶段用它，收尾时再跑一次不带本参数的同区间命令(全月已填→全 skip→执行收尾)')
    ap.add_argument('--force', action='store_true',
                    help='强制处理、忽略整月幂等跳过；仅用于补边界缺口'
                         '（如 2025-11-01~03，该月已有 11-04+ 原始分区会被误判为已填）。'
                         '使用前须确认目标交易日分区确实不存在，否则会重复 append 导致行数翻倍')
    args = ap.parse_args()

    assert get_daily_data_provider() == 'local_quant', \
        f'当前 daily_data_provider={get_daily_data_provider()}，必须 local_quant 才能吃到 free-stockdb/TDX 历史'

    start = dt.datetime.fromisoformat(args.start)
    end = dt.datetime.fromisoformat(args.end)
    data_dir = settings.data_dir
    repo = KlineRepository(DataStore())
    symbols = repo.get_instruments()['symbol'].to_list()
    print(f'[info] provider=local_quant 标的数={len(symbols)} 区间={start.date()} ~ {end.date()}')

    # 1) 备份
    if not args.no_backup and not args.dry_run:
        tag = dt.datetime.now().strftime('%Y%m%dT%H%M%S')
        bk = backup_kline_daily(data_dir, tag)
        print(f'[backup] kline_daily 已备份到 {bk}')

    # 2) 逐月回填（按月分批，避免单次响应过大；幂等可续跑）
    #    逆序：最新月份在前，先补齐用户最关心的 2024~2025 区间供回测验证，
    #    旧历史(2000~2023)在后台依次补齐，不影响早期验证。
    total = 0
    months = list(month_bounds(start, end)) if args.force else list(month_bounds(start, end))[::-1]
    print(f'[plan] 共 {len(months)} 个月份待处理'
          f'（{"force 正序" if args.force else "逆序：最新在前"}）')
    for i, (ms, me) in enumerate(months, 1):
        # --end 对齐月末后全部为整月：该月任意交易日分区已存在即视为整月已填，
        # 跳过（幂等可续跑）；不存在则整月回填，绝不重复写，避免行数翻倍。
        # --force 用于补边界缺口，跳过此判断（调用方须确认目标分区不存在）。
        if not args.force and month_filled(data_dir, ms):
            print(f'[skip] {ms.date().isoformat()[:7]} 已存在，跳过 ({i}/{len(months)})')
            continue
        if args.dry_run:
            print(f'[dry] {ms.date()} ~ {me.date()} ({i}/{len(months)})')
            continue
        t0 = dt.datetime.now()
        w = sync_and_persist_daily_batch(symbols, repo, CapabilitySet(), start_date=ms, end_date=me)
        secs = (dt.datetime.now() - t0).total_seconds()
        total += w
        print(f'[ok] {ms.date()} ~ {me.date()}: +{w} 行 (累计 {total}) 耗时{secs:.0f}s ({i}/{len(months)})')

    if args.dry_run:
        print('[dry-run] 结束，未写入任何数据。')
        return

    # 3)+4) 收尾：复权因子 + 重建 enriched/DuckDB 视图
    #   全量回填阶段用 --skip-finalize 跳过（全量 enriched 重算耗时/耗内存，单独跑便于观测）；
    #   回填完成后重跑一次同区间命令（全部月份已填→全 skip）即只执行此收尾。
    if args.skip_finalize:
        print('[done] 逐月回填写入完成（已跳过收尾）。'
              '下一步：补 2025-11-03 单日 → 重跑本脚本不带 --skip-finalize 执行收尾 → 重启容器核对四表。')
        return

    added, affected = sync_adj_factor(symbols, repo, CapabilitySet(), start_time=start, end_time=end)
    print(f'[adj] added={added} affected={affected}')

    enriched = run_pipeline()
    print(f'[pipeline] enriched rows={enriched}')

    print('[done] 回填+收尾完成。下一步：重启容器重建 DuckDB 视图，再核对四表行数。')


# 容器内 CapabilitySet 为空即可（local_quant 分支不校验 KLINE_DAILY_BATCH 能力）
try:
    from app.data_providers.capabilities import CapabilitySet
except Exception:
    class CapabilitySet:
        def has(self, *a, **k):
            return True


if __name__ == '__main__':
    main()
