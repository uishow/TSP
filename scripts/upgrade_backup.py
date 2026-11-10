#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""升级前 / 回滚用本地备份：当日四张行情分区 + fuyao 快照（显式排除 Key）。

大白话（点哪→发生什么→结果在哪看→出错怎么查）：
  升级 TSP 镜像前跑一次本脚本，它会把「今天」的行情分区（股票日K / ETF 日K /
  当日分钟 / 指数日K 这 4 张）和 fuyao 特色数据快照复制到一个带时间戳的目录，
  万一升级出问题，能立刻把升级前当天的行情与特色数据回滚回去。
  关键点：Key 文件（runtime/fuyao.env、任何 *.env）**绝不进备份**，避免密钥外泄。

用法（在项目根目录）：
  .venv/bin/python scripts/upgrade_backup.py                 # 默认备份到 data-local/backups/upgrade_<时间戳>/
  .venv/bin/python scripts/upgrade_backup.py --dry-run        # 只打印计划，不写盘
  .venv/bin/python scripts/upgrade_backup.py --out /tmp/xx    # 指定输出目录
  .venv/bin/python scripts/upgrade_backup.py --skip-minute    # 分钟分区很大，可跳过

边界（铁律）：
  - 不碰镜像 / tag / digest / compose / upstream / 容器内文件。
  - 只复制数据（parquet 分区 + fuyao 快照 JSON），绝不复制 *.env / runtime/fuyao.env。
  - 输出目录在 data-local/backups/（已被 .gitignore 忽略），不进 Git。
  - fuyao 快照里本来就不含 Key（见 scripts/fuyao_recap_sync.py 的安全约定）。
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
import time
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data-local"
DEFAULT_TABLES = ("kline_daily", "kline_etf_daily", "kline_minute", "kline_index_daily")
RECAP = DATA / "fuyao" / "recap"
DATE_RE = __import__("re").compile(r"^date=(\d{4}-\d{2}-\d{2})$")


def _latest_partition(table: str) -> Path | None:
    base = DATA / table
    if not base.is_dir():
        return None
    dates = sorted(
        (m.group(1) for p in base.iterdir()
         if p.is_dir() and (m := DATE_RE.match(p.name))),
        reverse=True,
    )
    if not dates:
        return None
    return base / f"date={dates[0]}"


def _copy_tree(src: Path, dst: Path, skip_keys: bool, dry: bool) -> int:
    copied = 0
    dst.mkdir(parents=True, exist_ok=True)
    for item in src.rglob("*"):
        if not item.is_file():
            continue
        # 显式排除 Key：任何 .env 文件都不进备份。
        if skip_keys and item.name.endswith(".env"):
            continue
        rel = item.relative_to(src)
        target = dst / rel
        if dry:
            print(f"  [dry-run] 将复制 {item} -> {target}")
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, target)
        copied += 1
    return copied


def _copy_partition(src: Path, dst: Path, dry: bool) -> int:
    dst.mkdir(parents=True, exist_ok=True)
    n = 0
    for item in src.iterdir():
        if dry:
            print(f"  [dry-run] 将复制 {item.name} -> {dst / item.name}")
        else:
            if item.is_dir():
                shutil.copytree(item, dst / item.name, dirs_exist_ok=True)
            else:
                shutil.copy2(item, dst / item.name)
        n += 1
    return n


def backup(out: Path, tables, skip_minute: bool, dry: bool) -> dict:
    out = Path(out)
    manifest = {
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "purpose": "TSP 升级前/回滚用：当日行情分区 + fuyao 快照（不含 Key）",
        "tables": [],
        "fuyao_recap": None,
        "key_excluded": True,
    }
    print("输出目录: " + str(out))
    for t in tables:
        if t == "kline_minute" and skip_minute:
            print(f"  跳过 {t}（--skip-minute）")
            continue
        part = _latest_partition(t)
        if part is None:
            print(f"  {t}: 没有找到任何 date= 分区，跳过")
            continue
        dst = out / t / part.name
        n = _copy_partition(part, dst, dry)
        manifest["tables"].append({"table": t, "partition": part.name, "files": n})
        print(f"  {t}: {part.name}（{n} 个文件）")

    if RECAP.is_dir():
        dst = out / "fuyao_recap"
        n = _copy_tree(RECAP, dst, skip_keys=True, dry=dry)
        manifest["fuyao_recap"] = {"files": n}
        print(f"  fuyao_recap: {n} 个文件（已排除 *.env）")
    else:
        print("  fuyao_recap: 目录不存在，跳过")

    if not dry:
        out.mkdir(parents=True, exist_ok=True)
        (out / "manifest.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    return manifest


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="升级前/回滚用本地备份（行情分区 + fuyao 快照，不含 Key）")
    ap.add_argument("--out", default=None, help="输出目录（默认 data-local/backups/upgrade_<时间戳>）")
    ap.add_argument("--tables", nargs="*", default=list(DEFAULT_TABLES),
                    help="要备份的行情表，默认 4 张：kline_daily kline_etf_daily kline_minute kline_index_daily")
    ap.add_argument("--skip-minute", action="store_true", help="跳过 kline_minute（分区较大）")
    ap.add_argument("--dry-run", action="store_true", help="只打印计划，不写盘")
    args = ap.parse_args(argv)

    out = Path(args.out) if args.out else (
        DATA / "backups" / ("upgrade_" + time.strftime("%Y%m%d_%H%M%S"))
    )
    try:
        manifest = backup(out, args.tables, args.skip_minute, args.dry_run)
    except Exception as exc:  # noqa: BLE001
        print("备份失败: " + str(exc)[:200], file=sys.stderr)
        return 1
    total = sum(t["files"] for t in manifest["tables"]) + (manifest["fuyao_recap"] or {}).get("files", 0)
    print("")
    print("完成" + ("（dry-run）" if args.dry_run else "") + f"：共 {total} 个文件")
    print("Key 文件已排除（runtime/fuyao.env 与任何 *.env 不进备份）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
