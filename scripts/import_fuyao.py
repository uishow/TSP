#!/usr/bin/env python3
"""Host-side offline importer for THS fuyao.

Run on the HOST, never inside the container::

    .venv/bin/python scripts/import_fuyao.py --probe
    .venv/bin/python scripts/import_fuyao.py --boards
    .venv/bin/python scripts/import_fuyao.py --financial --limit 300
    .venv/bin/python scripts/import_fuyao.py --financial          # resume/full
    .venv/bin/python scripts/import_fuyao.py --all --limit 300

Intermediate cache lives in ``runtime/fuyao-cache/`` (host-only, not mounted).
Only finished parquet/json products are written to ``data-local/fuyao/`` so the
container can never observe a half-written import. Every successful unit is
cached atomically, so an interrupted run resumes without re-fetching.

The API key is read from FUYAO_API_KEY or runtime/fuyao.env and is never echoed,
logged or persisted into data-local/.
"""
from __future__ import annotations

import argparse
import concurrent.futures as futures
import json
import os
import sys
import time
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from bridge.fuyao_offline import (  # noqa: E402
    CATALOG_PATH, CONSTITUENTS_PATH, OUT_DIR, QUALITY_BACKFILL, QUALITY_CANDIDATE,
    QUALITY_CONFLICT, STATEMENT_PATHS, TAGS, FuyaoOfflineClient,
    FuyaoOfflineError, classify_report_date, date_of_ms, load_api_key, now_iso,
    normalize_statement, resolve_announce_candidates, write_parquet,
)

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'runtime' / 'fuyao-cache'
PROBE_PATH = ROOT / 'tasks' / 'fuyao-probe.json'
PROBE_SYMBOLS = ('600031.SH', '000001.SZ', '002474.SZ', '600519.SH')
PROBE_PERIODS = 8


def _atomic_json(path: Path, payload):
    if not path.parent.is_dir():
        path.parent.mkdir(parents=True)
    tmp = path.with_name(path.name + '.part')
    tmp.write_text(json.dumps(payload, ensure_ascii=False, sort_keys=True, default=str),
                   encoding='utf-8')
    tmp.replace(path)


def _read_json(path: Path):
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return None


def probe(client) -> dict:
    """Empirically verify what report_date_ms actually means. No PIT claim."""
    evidence = []
    for symbol in PROBE_SYMBOLS:
        for stmt in STATEMENT_PATHS:
            rows = client.financial_statements(stmt, symbol, limit=PROBE_PERIODS)
            for raw in rows:
                period_end = date_of_ms(raw.get('period_end_ms'))
                report_date = date_of_ms(raw.get('report_date_ms'))
                lag = None
                if period_end and report_date:
                    from datetime import date
                    lag = (date.fromisoformat(report_date) - date.fromisoformat(period_end)).days
                evidence.append({
                    'symbol': symbol, 'table': stmt,
                    'fiscal_year': raw.get('fiscal_year'),
                    'fiscal_period': raw.get('fiscal_period'),
                    'period_end': period_end, 'report_date': report_date,
                    'lag_days': lag,
                    'quality': classify_report_date(period_end, report_date),
                })
    candidates = [e for e in evidence if e['quality'] == QUALITY_CANDIDATE]
    backfills = [e for e in evidence if e['quality'] == QUALITY_BACKFILL]
    # Cross-table disagreement for the same (symbol, period_end).
    by_key = {}
    for e in evidence:
        by_key.setdefault((e['symbol'], e['period_end']), set()).add(e['report_date'])
    conflicts = sorted(f'{s}|{p}' for (s, p), dates in by_key.items() if len(dates) > 1)
    verdict = {
        'verdict': 'REPORT_DATE_MS_IS_NOT_A_VERIFIED_PIT_DISCLOSURE_DATE',
        'pit_enabled': False,
        'announce_date_column': 'NEVER_WRITTEN_BY_THIS_IMPORTER',
        'reason': (
            '最新约 4 期的 report_date 表现为个股真实披露日（各标的日期不同，'
            'Q1/Q2/Q3/Q4 滞后分别约 25-30/46-62/24-31/80-114 天）；'
            '更早报告期被按季度类型回填为最新批次日（滞后 389-479 天），'
            '且 balance_sheets 历史行与另外两表在同一 (symbol, period_end) 上冲突。'
            '因此只保留为候选公告日 + 质量标签，不进入 announce_date，PIT 回测仍关闭。'
        ),
        'rows_examined': len(evidence),
        'candidate_rows': len(candidates),
        'backfill_suspect_rows': len(backfills),
        'cross_table_conflict_keys': len(conflicts),
        'cross_table_conflict_examples': conflicts[:8],
        'candidate_lag_days': sorted({e['lag_days'] for e in candidates if e['lag_days'] is not None}),
        'backfill_lag_days': sorted({e['lag_days'] for e in backfills if e['lag_days'] is not None}),
        'probed_at': now_iso(),
        'probe_symbols': list(PROBE_SYMBOLS),
        'probe_periods': PROBE_PERIODS,
    }
    result = {'verdict': verdict, 'evidence': evidence}
    _atomic_json(PROBE_PATH, result)
    return result


def _universe(client, refresh=False) -> list[str]:
    path = CACHE / 'universe.json'
    cached = None if refresh else _read_json(path)
    if isinstance(cached, list) and cached:
        return cached
    symbols = client.universe()
    if not symbols:
        raise FuyaoOfflineError('fuyao universe is empty; refusing to write empty import')
    _atomic_json(path, symbols)
    return symbols


def _fetch_symbol(client, symbol, periods) -> dict:
    out = {}
    for stmt in STATEMENT_PATHS:
        rows = client.financial_statements(stmt, symbol, limit=periods)
        if not rows:
            raise FuyaoOfflineError(f'{stmt}: no rows')
        out[stmt] = rows
    return out


def import_financial(client, args) -> dict:
    fdir = CACHE / 'financial'
    if not fdir.is_dir():
        fdir.mkdir(parents=True)
    symbols = ([s.strip() for s in args.symbols.split(',') if s.strip()]
               if args.symbols else _universe(client, refresh=args.refresh))
    if args.limit:
        symbols = symbols[:args.limit]
    pending = [s for s in symbols if not (fdir / f'{s}.json').is_file()]
    errors = {}

    def work(symbol):
        path = fdir / f'{symbol}.json'
        try:
            raw = _fetch_symbol(client, symbol, args.periods)
            _atomic_json(path, raw)
            time.sleep(0.02)
            return symbol, None
        except Exception as exc:  # labelled failure, no fabricated rows
            return symbol, f'{type(exc).__name__}: {exc}'

    if pending and not args.dry_run:
        with futures.ThreadPoolExecutor(max_workers=args.concurrency) as pool:
            for symbol, error in pool.map(work, pending):
                if error:
                    errors[symbol] = error
        if errors:
            _atomic_json(CACHE / 'financial_errors.json', errors)

    imported_at = now_iso()
    tables = {stmt: [] for stmt in STATEMENT_PATHS}
    done, missing = 0, []
    for symbol in symbols:
        raw = _read_json(fdir / f'{symbol}.json')
        if not isinstance(raw, dict) or set(raw) != set(STATEMENT_PATHS):
            missing.append(symbol)
            continue
        done += 1
        for stmt, rows in raw.items():
            tables[stmt].extend(normalize_statement(stmt, symbol, r, imported_at)
                                for r in rows)
    candidates = resolve_announce_candidates(tables)
    counts = {}
    if not args.dry_run:
        for stmt, rows in tables.items():
            counts[stmt] = write_parquet(rows, OUT_DIR / f'financial_{stmt}.parquet')
        counts['announce_candidates'] = write_parquet(
            candidates, OUT_DIR / 'financial_announce_candidates.parquet')
    quality = Counter(r['report_date_quality'] for r in candidates)
    return {
        'symbols_requested': len(symbols), 'symbols_imported': done,
        'symbols_missing': len(missing), 'errors': len(errors),
        'statement_counts': counts,
        'announce_candidate_quality': dict(quality),
        'report_date_verdict': (_read_json(PROBE_PATH) or {}).get('verdict'),
        'complete': not missing and not errors,
    }


def _sanitize(name: str) -> tuple[str, bool]:
    """Board pages split values on '/' and ';'. Avoid creating fake categories."""
    clean = str(name or '').strip().replace('/', '／').replace(';', '；')
    return clean, clean != str(name or '').strip()


def import_boards(client, args) -> dict:
    bdir = CACHE / 'boards'
    catalogs, counts, warnings = {}, {}, []
    imported_at = now_iso()
    for kind, tag in TAGS.items():
        catalog_path = CACHE / f'catalog_{kind}.json'
        catalog = None if args.refresh else _read_json(catalog_path)
        if not isinstance(catalog, list) or not catalog:
            catalog = [{'thscode': str(r['thscode']), 'name': str(r.get('name') or '')}
                       for r in client.catalog(tag) if isinstance(r, dict) and r.get('thscode')]
            if not catalog:
                raise FuyaoOfflineError(f'{kind} catalog is empty; refusing to write empty table')
            _atomic_json(catalog_path, catalog)
        catalogs[kind] = catalog
        if not (bdir / kind).is_dir():
            (bdir / kind).mkdir(parents=True)
        pending = [r['thscode'] for r in catalog
                   if not (bdir / kind / f"{r['thscode']}.json").is_file()]
        failures = {}

        def work(thscode):
            try:
                rows = client.constituents(thscode)
                if not rows:
                    raise FuyaoOfflineError('no constituents')
                _atomic_json(bdir / kind / f'{thscode}.json', rows)
                time.sleep(0.02)
                return thscode, None
            except Exception as exc:
                return thscode, f'{type(exc).__name__}: {exc}'

        if pending and not args.dry_run:
            with futures.ThreadPoolExecutor(max_workers=args.boards_concurrency) as pool:
                for thscode, error in pool.map(work, pending):
                    if error:
                        failures[thscode] = error
            if failures:
                _atomic_json(CACHE / f'boards_{kind}_errors.json', failures)
                warnings.append(f'{kind}: {len(failures)} board constituent fetches failed')

        by_name = {r['thscode']: r['name'] for r in catalog}
        membership = []
        sanitized = 0
        for thscode, name in sorted(by_name.items()):
            rows = _read_json(bdir / kind / f'{thscode}.json')
            if not isinstance(rows, list) or not rows:
                continue
            clean, changed = _sanitize(name)
            sanitized += int(changed)
            for row in rows:
                symbol = row.get('thscode')
                if not symbol:
                    continue
                membership.append({
                    'symbol': str(symbol),
                    'code': str(symbol).split('.')[0],
                    'name': row.get('name'),
                    'board_code': thscode,
                    'board_name': clean,
                    'board_name_original': name if changed else None,
                    'taxonomy': f'ths_official_{kind}',
                    'source': 'fuyao:ths-index-catalog+constituents',
                    'source_endpoint': CONSTITUENTS_PATH,
                    'imported_at': imported_at,
                    'pit_verified': False,
                    'coverage': 'CURRENT_SNAPSHOT_NO_HISTORY',
                })
        counts[kind] = {
            'boards_in_catalog': len(catalog),
            'boards_fetched': len([p for p in (bdir / kind).glob('*.json')]),
            'membership_rows': len(membership),
            'unique_symbols': len({r['symbol'] for r in membership}),
            'names_sanitized': sanitized,
            'failures': len(failures),
        }
        if not args.dry_run:
            _atomic_json(OUT_DIR / f'ths_{kind}_catalog.json', {
                'tag': tag, 'catalog_endpoint': CATALOG_PATH,
                'imported_at': imported_at, 'source': 'fuyao:ths-index-catalog',
                'pit_verified': False, 'items': catalog,
            })
            write_parquet(membership, OUT_DIR / f'ths_{kind}_membership.parquet')
    return {'board_counts': counts, 'warnings': warnings,
            'complete': all(c['failures'] == 0 for c in counts.values())}


def write_manifest(key_source: str, results: dict, args) -> dict:
    probe = (_read_json(PROBE_PATH) or {}).get('verdict') or {}
    previous = _read_json(OUT_DIR / 'manifest.json') or {}
    financial = results.get('financial') or previous.get('financial')
    boards = results.get('boards') or previous.get('boards')
    manifest = {
        'imported_at': now_iso(),
        'importer': 'scripts/import_fuyao.py',
        'key_source': key_source,
        'key_present_in_this_file': False,
        'key_never_written_to_data_local': True,
        'container_network_policy': 'UNCHANGED: fuyao.aicubes.cn still blocked',
        'capability_matrix': 'UNCHANGED: effective provider remains local_quant',
        'base_url': 'https://fuyao.aicubes.cn',
        'mode': 'HOST_SIDE_OFFLINE_IMPORT_ONLY',
        'pit_enabled': False,
        'announce_date_column': 'NEVER_WRITTEN_BY_THIS_IMPORTER',
        'report_date_verdict': probe,
        'financial': financial,
        'boards': boards,
        'products': sorted(p.name for p in OUT_DIR.glob('*')) if OUT_DIR.is_dir() else [],
        'warnings': (boards or {}).get('warnings', []) + (
            ['financial import incomplete; see runtime/fuyao-cache/financial_errors.json']
            if financial and not financial.get('complete') else []),
        'limits': {'financial_periods': args.periods, 'financial_limit': args.limit},
    }
    _atomic_json(OUT_DIR / 'manifest.json', manifest)
    return manifest


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description='Host-side offline fuyao importer')
    ap.add_argument('--probe', action='store_true', help='verify report_date_ms semantics')
    ap.add_argument('--financial', action='store_true', help='import three statements')
    ap.add_argument('--boards', action='store_true', help='import official THS classifications')
    ap.add_argument('--all', action='store_true', help='probe + financial + boards')
    ap.add_argument('--limit', type=int, default=0, help='cap symbols (0 = full market)')
    ap.add_argument('--symbols', default='', help='comma-separated explicit symbols')
    ap.add_argument('--periods', type=int, default=8, help='quarters per statement')
    ap.add_argument('--concurrency', type=int, default=6)
    ap.add_argument('--boards-concurrency', type=int, default=8)
    ap.add_argument('--refresh', action='store_true', help='ignore cached universe/catalog')
    ap.add_argument('--dry-run', action='store_true', help='summarize only, write nothing')
    args = ap.parse_args(argv)
    if not any((args.probe, args.financial, args.boards, args.all)):
        ap.error('choose --probe / --financial / --boards / --all')
    do_probe = args.probe or args.all
    do_financial = args.financial or args.all
    do_boards = args.boards or args.all

    key, key_source = load_api_key()
    print(f'key_source={key_source} (value hidden)')
    results = {}
    with FuyaoOfflineClient(key) as client:
        if do_probe:
            result = probe(client)
            v = result['verdict']
            print(f"probe: rows={v['rows_examined']} candidates={v['candidate_rows']} "
                  f"backfill={v['backfill_suspect_rows']} conflicts={v['cross_table_conflict_keys']}")
            print(f"  verdict: {v['verdict']}")
            print(f"  evidence -> {PROBE_PATH}")
        if do_financial:
            results['financial'] = import_financial(client, args)
            print('financial:', json.dumps(results['financial'], ensure_ascii=False, default=str))
        if do_boards:
            results['boards'] = import_boards(client, args)
            print('boards:', json.dumps(results['boards'], ensure_ascii=False, default=str))
    if not args.dry_run and (do_financial or do_boards):
        manifest = write_manifest(key_source, results, args)
        print(f"manifest -> {OUT_DIR / 'manifest.json'} "
              f"(pit_enabled={manifest['pit_enabled']})")
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except FuyaoOfflineError as exc:
        print(f'FUYAO_IMPORT_FAILED: {exc}', file=sys.stderr)
        raise SystemExit(2)
