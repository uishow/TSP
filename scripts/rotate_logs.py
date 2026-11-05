#!/usr/bin/env python3
"""Archive host-side append-only logs without losing evidence.

``runtime/source-audit.jsonl`` and ``runtime/evidence.jsonl`` are rotated while
the bridge is live: the bridge opens them with mode 'a' on every request, so an
atomic rename plus a fresh empty file is safe. ``runtime/bridge.log`` is held
open by the bridge process (Popen fd) and can only be archived while the bridge
is stopped via ``--bridge-log``; otherwise the renamed file would keep growing.

Rotating the evidence log starts a NEW hash chain at the genesis hash for the
active file; each gzip archive is a complete, self-contained chain segment and
is never pruned (``--prune`` only touches ``source-audit-*`` archives). Evidence
is therefore preserved in full across rotations.

Archives are gzip copies under ``runtime/archive/``. Nothing is deleted unless
``--prune`` is passed explicitly. Default mode is a dry run; pass ``--apply``
to write.
"""
from __future__ import annotations

import argparse
import gzip
import json
import os
import shutil
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDIT_NAME = 'source-audit.jsonl'
EVIDENCE_NAME = 'evidence.jsonl'
BRIDGE_LOG_NAME = 'bridge.log'
ARCHIVE_PREFIX = 'source-audit-'
EVIDENCE_ARCHIVE_PREFIX = 'evidence-'
BRIDGE_ARCHIVE_PREFIX = 'bridge-log-'
DEFAULT_LIMIT_BYTES = 16 * 1024 * 1024


def bridge_running(timeout=2):
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        with opener.open('http://127.0.0.1:7818/health', timeout=timeout) as response:
            return response.status == 200
    except Exception:
        return False


def _stamp():
    return datetime.now().strftime('%Y%m%d-%H%M%S')


def _gzip_into(source: Path, archive: Path):
    # NOTE: this sandbox's path proxy raises FileExistsError for
    # mkdir(exist_ok=True) on an already existing directory. Check first.
    if not archive.parent.is_dir():
        try:
            archive.parent.mkdir(parents=True)
        except FileExistsError:
            if not archive.parent.is_dir():
                raise
    temporary = archive.with_name(archive.name + '.tmp')
    with source.open('rb') as src, gzip.open(temporary, 'wb') as dst:
        shutil.copyfileobj(src, dst)
    os.replace(temporary, archive)


def rotate_online_log(root: Path, path: Path, prefix: str, limit: int,
                      apply: bool, stamp: str | None = None):
    """Rename an append-only log, recreate it empty, then compress the archive."""
    if not path.is_file():
        return {'action': 'missing', 'file': str(path)}
    size = path.stat().st_size
    if size <= limit:
        return {'action': 'below_threshold', 'file': str(path), 'bytes': size}
    if not apply:
        return {'action': 'would_rotate', 'file': str(path), 'bytes': size}
    stamp = stamp or _stamp()
    runtime = path.parent
    staging = runtime / f'.{path.name}.{stamp}.staging'
    suffix = '.jsonl.gz' if path.name in (AUDIT_NAME, EVIDENCE_NAME) else '.log.gz'
    archive = runtime / 'archive' / f'{prefix}{stamp}{suffix}'
    os.replace(path, staging)
    path.touch()  # the next bridge request reopens/creates it in append mode
    try:
        _gzip_into(staging, archive)
    except Exception as exc:  # keep the staging file: never lose evidence
        return {'action': 'error', 'file': str(path), 'error': str(exc),
                'staging_preserved': str(staging)}
    staging.unlink()
    return {'action': 'rotated', 'file': str(path), 'bytes': size,
            'archive': str(archive.relative_to(root))}


def prune_archives(root: Path, keep: int, apply: bool):
    archive_dir = root / 'runtime' / 'archive'
    if not archive_dir.is_dir():
        return {'action': 'none', 'removed': []}
    owned = sorted(
        (p for p in archive_dir.iterdir()
         if p.is_file() and p.name.startswith(ARCHIVE_PREFIX) and p.suffix == '.gz'),
        key=lambda p: p.stat().st_mtime, reverse=True)
    excess = owned[keep:]
    if apply:
        for path in excess:
            path.unlink()
    return {'action': 'pruned' if apply and excess else 'would_prune',
            'removed': [p.name for p in excess], 'kept': min(len(owned), keep)}


def run(root: Path, limit: int, apply: bool, bridge_log: bool,
        prune: bool, keep: int, running=None):
    runtime = root / 'runtime'
    stamp = _stamp() if apply else None
    audit = rotate_online_log(root, runtime / AUDIT_NAME, ARCHIVE_PREFIX,
                              limit, apply, stamp=stamp)
    results = [audit]
    if bridge_log:
        if (running if running is not None else bridge_running()):
            results.append({'action': 'refused_bridge_running',
                            'file': str(runtime / BRIDGE_LOG_NAME),
                            'hint': 'manage.py stop -> rotate_logs.py --bridge-log --apply -> manage.py start'})
        else:
            results.append(rotate_online_log(root, runtime / BRIDGE_LOG_NAME,
                                             BRIDGE_ARCHIVE_PREFIX, limit, apply, stamp=stamp))
    # Appended last so result[0] stays the audit result and result[1] stays the
    # bridge-log result for existing callers.
    results.append(rotate_online_log(root, runtime / EVIDENCE_NAME,
                                     EVIDENCE_ARCHIVE_PREFIX, limit, apply, stamp=stamp))
    if prune:
        results.append(prune_archives(root, keep, apply))
    return results


def main():
    parser = argparse.ArgumentParser(description='Archive TSP host audit logs (dry run by default)')
    parser.add_argument('--root', default=str(ROOT))
    parser.add_argument('--threshold-mb', type=float,
                        default=DEFAULT_LIMIT_BYTES / 1024 ** 2)
    parser.add_argument('--apply', action='store_true', help='actually rotate')
    parser.add_argument('--bridge-log', action='store_true',
                        help='also archive bridge.log (requires stopped bridge)')
    parser.add_argument('--prune', action='store_true',
                        help='delete oldest script-owned audit archives')
    parser.add_argument('--keep', type=int, default=12)
    args = parser.parse_args()
    if args.keep < 1:
        parser.error('--keep must be >= 1')
    root = Path(args.root)
    limit = int(args.threshold_mb * 1024 ** 2)
    results = run(root, limit, args.apply, args.bridge_log, args.prune, args.keep)
    for item in results:
        print(json.dumps(item, ensure_ascii=False))
    if not args.apply:
        print('DRY RUN: no files changed; pass --apply to rotate')
    return 1 if any(item['action'] == 'error' for item in results) else 0


if __name__ == '__main__':
    raise SystemExit(main())
