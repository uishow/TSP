"""把 kline_daily 回填产生的 part-stream-*.parquet 逐分区合并成单个 part.parquet。

背景：历史日 K 回填走上游流式写入，每个交易日分区撒出数十个 part-stream-N.parquet，
6,481 个分区共 398,514 个小文件。DuckDB 启动注册
    read_parquet('kline_daily/**/*.parquet', union_by_name=true)
需展开全部文件的 schema，在 9.67GiB 内存下 OOM，导致容器重启循环、/health 000。
合并后文件数降到约 6.5 千，与原始数据（part.parquet 单文件）格式一致。

安全设计：
  - 先写 part.parquet.tmp → 校验行数 → os.replace 原子改名 → 才删旧文件；
  - .tmp 不匹配 *.parquet glob，不会被视图读到；
  - 分区已有 part.parquet 时（上次中断续跑）直接删旧 part-stream，幂等可重跑；
  - 只动含 part-stream 的分区，原始 22 个单文件分区不碰。

执行：用同镜像临时容器挂载 data-local、覆盖 entrypoint 跑本脚本，不启动 TSP 主进程。
  docker run --rm -v <data-local>:/app/data -v <本脚本>:/tmp/compact.py:ro \
    -e TSP_SOURCE_POLICY=0 --entrypoint /app/.venv/bin/python <image> -u /tmp/compact.py
"""
from __future__ import annotations
import argparse, os, time
from pathlib import Path
import pyarrow as pa
import pyarrow.parquet as pq

ROOT = Path("/app/data/kline_daily")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="只处理前 N 个分区（灰度用，0=全部）")
    args = ap.parse_args()

    dirs = sorted(d for d in ROOT.glob("date=*") if any(d.glob("part-stream-*.parquet")))
    if args.limit:
        dirs = dirs[:args.limit]
    print(f"[info] 待处理分区 {len(dirs)}", flush=True)

    t0 = time.time()
    removed = 0
    for i, d in enumerate(dirs, 1):
        parts = sorted(d.glob("part-stream-*.parquet"))
        if not parts:
            continue
        target = d / "part.parquet"
        if not target.exists():
            # 必须逐文件用 ParquetFile.read()，不能用 pq.read_table()：
            # 后者会沿 date=... 目录做 Hive 分区发现、把整个 kline_daily 纳入
            # dataset，别处 dictionary<string> 类型的 date 列会导致 schema 合并失败。
            tables = [pq.ParquetFile(str(p)).read() for p in parts]
            total = sum(t.num_rows for t in tables)
            merged = pa.concat_tables(tables, promote=True)
            tmp = d / "part.parquet.tmp"
            pq.write_table(merged, tmp)
            if pq.ParquetFile(tmp).metadata.num_rows != total:
                tmp.unlink(missing_ok=True)
                raise RuntimeError(f"{d.name}: 合并行数不符 {total}")
            os.replace(tmp, target)
        for p in parts:
            p.unlink()
        removed += len(parts)
        if i % 500 == 0 or i == len(dirs):
            print(f"[ok] {i}/{len(dirs)} 已删 {removed} 个小文件 用时{time.time()-t0:.0f}s", flush=True)

    print(f"[done] 完成 {len(dirs)} 分区 / 删除 {removed} 个小文件 / 用时 {time.time()-t0:.0f}s", flush=True)


if __name__ == "__main__":
    main()
