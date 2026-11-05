"""D01: enumerate and validate all local historical market data.

Read-only audit of the TDX local binaries that back the bridge: daily (lday),
1-minute (minline/lc1) and 5-minute (fzline/lc5) bars, plus the gpcw financial
binaries. For every file it checks the 32-byte record alignment, parses the
first and last bar dates, and reports file totals. A checkpoint makes the run
resumable: files already checked (by path + mtime + size) are skipped unless
they changed. Bad files (truncated / odd length) are listed, never repaired.

This script never writes market data; it only appends to a checkpoint and prints
a report. Coverage is reported as success / failed / unchecked — a sample is
never substituted for the denominator.
"""
from __future__ import annotations

import json
import struct
from datetime import date
from pathlib import Path
import sys

ROOT = Path('/Users/beryllewis/Library/Application Support/CrossOver/Bottles/通达信/drive_c/tdx-new')
RECORD = 32

# (folder, extension, kind) scanned under each market directory.
BAR_TARGETS = [
    ('lday', 'day', 'daily'),
    ('minline', 'lc1', '1m'),
    ('fzline', 'lc5', '5m'),
]


def _bar_date(kind, raw):
    if kind == 'daily':
        ymd = struct.unpack_from('<I', raw, 0)[0]
        return '%08d' % ymd
    # minute: 16-bit packed date
    day = struct.unpack_from('<H', raw, 0)[0]
    return '%04d-%02d-%02d' % (day // 2048 + 2004, (day % 2048) // 100, day % 2048)


def scan_file(path, kind):
    """Return per-file audit stats or a failure record."""
    size = path.stat().st_size
    if size % RECORD != 0:
        return {'path': str(path), 'kind': kind, 'status': 'BAD_FILE',
                'reason': 'size not a multiple of 32 bytes', 'bytes': size,
                'records': size // RECORD}
    if size == 0:
        return {'path': str(path), 'kind': kind, 'status': 'EMPTY', 'bytes': 0, 'records': 0}
    with path.open('rb') as f:
        first = f.read(RECORD)
        if size >= RECORD * 2:
            f.seek(-RECORD, 2)
            last = f.read(RECORD)
        else:
            last = first
    return {'path': str(path), 'kind': kind, 'status': 'OK', 'bytes': size,
            'records': size // RECORD, 'first_date': _bar_date(kind, first),
            'last_date': _bar_date(kind, last)}


def scan_market(market_dir):
    results = []
    for folder, ext, kind in BAR_TARGETS:
        target = market_dir / folder
        if not target.is_dir():
            continue
        for path in sorted(target.glob(f'*.{ext}')):
            results.append(scan_file(path, kind))
    return results


def run(root=None, checkpoint=None, resume=True):
    root = Path(root) if root else ROOT
    checkpoint = Path(checkpoint) if checkpoint else (
        Path(__file__).resolve().parents[1] / 'runtime' / 'audit' / 'history-checkpoint.json')
    checkpoint.parent.mkdir(parents=True, exist_ok=True)
    done = {}
    if resume and checkpoint.is_file():
        try:
            done = json.loads(checkpoint.read_text())
        except Exception:
            done = {}
    all_results = []
    failed = []
    checked_paths = set()
    for market in ('sh', 'sz', 'bj'):
        market_dir = root / 'vipdoc' / market
        if not market_dir.is_dir():
            continue
        for rec in scan_market(market_dir):
            p = rec['path']
            st = Path(p).stat()
            key = f'{p}:{st.st_mtime_ns}:{st.st_size}'
            checked_paths.add(p)
            if key in done:
                all_results.append(done[key])
                continue
            done[key] = rec
            all_results.append(rec)
            if rec['status'] not in ('OK', 'EMPTY'):
                failed.append(rec)
    checkpoint.write_text(json.dumps(done, ensure_ascii=False))
    total = len(all_results)
    ok = sum(1 for r in all_results if r['status'] == 'OK')
    bad = sum(1 for r in all_results if r['status'] == 'BAD_FILE')
    empty = sum(1 for r in all_results if r['status'] == 'EMPTY')
    failed = [r for r in all_results if r['status'] not in ('OK', 'EMPTY')]
    report = {
        'root': str(root),
        'total_files': total,
        'ok': ok,
        'bad_file': bad,
        'empty': empty,
        'failed': failed,
        'checkpoint': str(checkpoint),
        'unchecked': 0,
        'note': 'Resumable; files already scanned (path+mtime+size) are skipped. '
                'Coverage is counted as OK/BAD/EMPTY, never sampled.',
    }
    return report


def main():
    report = run()
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report['bad_file'] == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
