#!/usr/bin/env python3
"""TSP local operations doctor — read-only, evidence-based invariant check.

Run on the HOST with ``.venv/bin/python scripts/doctor.py``. It replaces the
scattered handover checklist with one repeatable command. It never writes into
data-local/, never opens vendor network connections from the container, and
never prints credential values (only file names and booleans).

Checks: live services, pinned image/policy, credential boundary (exact-value
comparison, not a variable-name grep), capability matrix, PIT semantics,
official board tables, offline product freshness, log/disk hygiene, the
append-only evidence hash chain and the mainline history taxonomy note.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import stat
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PINNED_DIGEST = 'sha256:c1e8ca1939a4ffed538394f799a75a1a309c191b20e99e0c02c6f82edd39d739'
PANEL = 'http://127.0.0.1:3018'
BRIDGE = 'http://127.0.0.1:7818'
AUDIT_LIMIT_BYTES = 16 * 1024 * 1024
OFFLINE_MAX_AGE_DAYS = 7
MIN_FREE_BYTES = 5 * 1024 ** 3
TEXT_SUFFIXES = {'.py', '.md', '.json', '.jsonl', '.txt', '.log', '.yaml',
                 '.yml', '.sh', '.env', '.cfg', '.ini', '.toml'}
SKIP_DIRS = {'.venv', '.git', '.pytest_cache', '__pycache__', 'node_modules',
             '.workbuddy', '.workbuddy-ai'}
MAX_SCAN_BYTES = 4 * 1024 * 1024
FINANCIAL_TABLES = ('metrics', 'income', 'balance_sheet', 'cash_flow', 'shares')
OFFICIAL_FIELDS = {
    'concept': 'fuyao_ths_concept.所属概念',
    'industry': 'fuyao_ths_industry.所属同花顺行业',
}
SECRET_KEYS = ('FUYAO_API_KEY', 'TSP_BRIDGE_TOKEN', 'AUTH_PASSWORD')


def check(name, status, detail, **evidence):
    return {'name': name, 'status': status, 'detail': detail, 'evidence': evidence}


def read_env(path):
    values = {}
    if not path.is_file():
        return values
    for line in path.read_text(encoding='utf-8', errors='ignore').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        values[key.strip()] = value.strip().strip('\'"')
    return values


def parse_time(value):
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value, timezone.utc)
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        parsed = datetime.fromisoformat(value.strip().replace('Z', '+00:00'))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def http_get(url, timeout=3, token=None):
    headers = {'Authorization': 'Bearer ' + token} if token else {}
    request = urllib.request.Request(url, headers=headers)
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        with opener.open(request, timeout=timeout) as response:
            body = response.read()
            try:
                return response.status, json.loads(body)
            except (ValueError, UnicodeDecodeError):
                return response.status, None
    except urllib.error.HTTPError as exc:
        return exc.code, None
    except Exception:
        return 0, None


def check_compose(text):
    violations = []
    if PINNED_DIGEST not in text:
        violations.append('fixed image digest changed')
    if 'pull_policy: never' not in text:
        violations.append('pull_policy is not never')
    if './runtime' in text or '/runtime:' in text:
        violations.append('runtime/ (host-only secrets) mounted into container')
    if '127.0.0.1:3018:3018' not in text:
        violations.append('panel is not loopback-bound')
    if 'TSP_SOURCE_POLICY' not in text:
        violations.append('source policy switch missing')
    status = 'PASS' if not violations else 'FAIL'
    return check('compose_invariants', status,
                 'pinned digest / pull_policy / no runtime mount / loopback / policy switch'
                 if not violations else '; '.join(violations),
                 violations=violations)


def check_credentials(root, compose_text=''):
    env_path = root / '.env'
    fuyao_env = root / 'runtime' / 'fuyao.env'
    env = read_env(env_path)
    fuyao = read_env(fuyao_env)
    problems = []
    modes = {}
    for label, path in (('.env', env_path), ('runtime/fuyao.env', fuyao_env)):
        if not path.is_file():
            problems.append(f'{label} missing')
            continue
        modes[label] = oct(stat.S_IMODE(path.stat().st_mode))
        if stat.S_IMODE(path.stat().st_mode) != 0o600:
            problems.append(f'{label} is not 0600')
    if './runtime' in compose_text or '/runtime:' in compose_text:
        problems.append('runtime/ mounted into container')

    secrets = {key: value for source in (env, fuyao) for key, value in source.items()
               if key in SECRET_KEYS and value and len(value) >= 6}
    leaks = []
    scanned = 0
    for path in root.rglob('*'):
        if not path.is_file() or path.suffix not in TEXT_SUFFIXES:
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.resolve() in {env_path.resolve(), fuyao_env.resolve()}:
            continue
        try:
            if path.stat().st_size > MAX_SCAN_BYTES:
                continue
            text = path.read_text(encoding='utf-8', errors='ignore')
        except OSError:
            continue
        scanned += 1
        for value in secrets.values():
            if value in text:
                leaks.append(str(path.relative_to(root)))
                break
    if leaks:
        problems.append('real credential value found outside its env file')

    vendor_keys = [key for key in ('TICKFLOW_API_KEY', 'FUYAO_API_KEY') if env.get(key)]
    if not fuyao.get('FUYAO_API_KEY'):
        problems.append('fuyao offline key missing from runtime/fuyao.env')
    status = 'FAIL' if problems else ('WARN' if vendor_keys else 'PASS')
    detail = ('; '.join(problems) if problems else
              'vendor keys present in .env (network guard still blocks egress): '
              + ', '.join(vendor_keys) if vendor_keys else
              '0600 env files, no runtime mount, real key values absent outside their env file')
    return check('credential_boundary', status, detail,
                 file_modes=modes, scanned_text_files=scanned,
                 leak_files=leaks, vendor_keys_present=vendor_keys)


def check_matrix(payload):
    if not isinstance(payload, dict) or not payload.get('capabilities'):
        return check('capability_matrix', 'FAIL', 'matrix unavailable or empty')
    rows = payload['capabilities']
    bad = [row.get('id') for row in rows
           if row.get('effective') != 'local_quant' or row.get('usable') is not True]
    if payload.get('tickflow_tier') != 'disabled':
        bad.append('tickflow_tier')
    return check('capability_matrix', 'PASS' if not bad else 'FAIL',
                 'all capabilities locked to local_quant, tickflow tier disabled'
                 if not bad else 'unexpected providers: ' + ', '.join(map(str, bad)),
                 capabilities=len(rows), violations=bad)


def check_logs(root, limit=AUDIT_LIMIT_BYTES):
    targets = ('runtime/source-audit.jsonl', 'runtime/evidence.jsonl',
               'runtime/bridge.log', 'data-local/logs/backend.log')
    sizes = {}
    for rel in targets:
        path = root / rel
        sizes[rel] = path.stat().st_size if path.is_file() else None
    rotatable = targets[:2]  # both can be atomically rotated while bridge is live
    over = [rel for rel in rotatable if (sizes[rel] or 0) > limit]
    return check('log_hygiene', 'WARN' if over else 'PASS',
                 ('rotatable logs exceed threshold (%s); run scripts/rotate_logs.py --apply'
                  % ', '.join(over)) if over else
                 'log sizes within threshold; bridge.log needs a stopped bridge to rotate',
                 sizes_bytes=sizes, threshold_bytes=limit, over_limit=over)


def check_evidence_chain(root):
    """Verify the content-addressed audit chain without importing bridge deps."""
    path = root / 'runtime' / 'evidence.jsonl'
    if not path.is_file():
        return check('evidence_chain', 'PASS',
                     'evidence log not created yet; chain check pending first request',
                     exists=False)
    try:
        import importlib.util
        source = root / 'bridge' / 'evidence.py'
        spec = importlib.util.spec_from_file_location('tsp_evidence_probe', source)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        report = module.EvidenceLog(path).verify()
    except Exception as exc:
        return check('evidence_chain', 'FAIL',
                     'evidence chain unreadable: %s: %s' % (type(exc).__name__, exc),
                     exists=True)
    damaged = report.get('damaged') or []
    ok = report.get('chain_ok') and report.get('seq_ok') and not damaged
    return check('evidence_chain', 'PASS' if ok else 'FAIL',
                 ('evidence chain intact: %s records, %s kinds' %
                  (report.get('valid'), report.get('kinds'))) if ok else
                 ('evidence chain damaged: %s bad lines, chain_ok=%s, seq_ok=%s' %
                  (len(damaged), report.get('chain_ok'), report.get('seq_ok'))),
                 exists=True, records=report.get('valid'), damaged=len(damaged),
                 chain_ok=report.get('chain_ok'), seq_ok=report.get('seq_ok'),
                 bytes=report.get('bytes'))


def check_disk(root, minimum=MIN_FREE_BYTES):
    free = shutil.disk_usage(root).free
    return check('disk_space', 'PASS' if free >= minimum else 'WARN',
                 f'free {free / 1024 ** 3:.1f} GiB (minimum {minimum / 1024 ** 3:.1f} GiB)',
                 free_bytes=free, minimum_bytes=minimum)


def check_offline(root, now=None, max_days=OFFLINE_MAX_AGE_DAYS):
    manifest = root / 'data-local' / 'fuyao' / 'manifest.json'
    if not manifest.is_file():
        return check('offline_products', 'FAIL', 'fuyao manifest missing')
    try:
        meta = json.loads(manifest.read_text(encoding='utf-8'))
    except (ValueError, OSError) as exc:
        return check('offline_products', 'FAIL', f'manifest unreadable: {exc}')
    problems = []
    if (meta.get('boards') or {}).get('complete') is not True:
        problems.append('boards import incomplete')
    if (meta.get('financial') or {}).get('complete') is not True:
        problems.append('financial import incomplete')
    if meta.get('pit_enabled') is not False:
        problems.append('PIT flag is not false')
    if meta.get('key_present_in_this_file') is not False:
        problems.append('manifest claims a key is present')
    verdict = (meta.get('report_date_verdict') or {}).get('verdict')
    if verdict != 'REPORT_DATE_MS_IS_NOT_A_VERIFIED_PIT_DISCLOSURE_DATE':
        problems.append('report_date verdict changed')
    imported = parse_time(meta.get('imported_at')) or datetime.fromtimestamp(
        manifest.stat().st_mtime, timezone.utc)
    current = now or datetime.now(timezone.utc)
    age_days = (current - imported).total_seconds() / 86400
    stale = age_days > max_days
    status = 'FAIL' if problems else ('WARN' if stale else 'PASS')
    detail = ('; '.join(problems) if problems else
              f'offline snapshot is {age_days:.1f} days old; rerun scripts/import_fuyao.py --all'
              if stale else 'offline import complete, PIT closed, snapshot fresh')
    return check('offline_products', status, detail,
                 imported_at=meta.get('imported_at'), age_days=round(age_days, 2),
                 max_age_days=max_days, problems=problems)


def _read_parquet(path):
    import polars as pl
    return pl.read_parquet(path)


def check_official_tables(root):
    expected = OFFICIAL_FIELDS
    try:
        rows = {}
        for cid in ('fuyao_ths_concept', 'fuyao_ths_industry'):
            part = root / 'data-local' / 'ext_data' / cid / 'part.parquet'
            if not part.is_file():
                return check('official_boards', 'FAIL', f'{cid} part.parquet missing')
            frame = _read_parquet(part)
            rows[cid] = frame.height
            column = '所属概念' if cid.endswith('concept') else '所属同花顺行业'
            if column in frame.columns:
                bad = sum(1 for value in frame[column].to_list()
                          if value and '/' in str(value))
                if bad:
                    return check('official_boards', 'FAIL',
                                 f'{cid} has {bad} slash-contaminated labels', rows=rows)
        prefs_path = root / 'data-local' / 'user_data' / 'preferences.json'
        monitor = (json.loads(prefs_path.read_text(encoding='utf-8'))
                   .get('monitor_ext_fields', {})) if prefs_path.is_file() else {}
        actual = {kind: (monitor.get(kind) or {}).get('field') for kind in expected}
        mismatch = {kind: actual[kind] for kind in expected
                    if actual[kind] != expected[kind]}
    except Exception as exc:  # noqa: BLE001 — report, never crash the doctor
        return check('official_boards', 'WARN', f'cannot verify: {type(exc).__name__}: {exc}')
    status = 'FAIL' if any(count == 0 for count in rows.values()) else (
        'WARN' if mismatch else 'PASS')
    return check('official_boards', status,
                 'monitor_ext_fields does not point at the official tables' if mismatch else
                 'official tables non-empty, no slash labels, monitor fields aligned',
                 rows=rows, expected=expected, actual=actual, mismatch=mismatch)


def check_financial_pit(root):
    opened = []
    unverifiable = []
    for table in FINANCIAL_TABLES:
        part = root / 'data-local' / 'financials' / table / 'part.parquet'
        if not part.is_file():
            unverifiable.append(f'{table}: missing')
            continue
        try:
            frame = _read_parquet(part)
            if 'announce_date' in frame.columns:
                filled = frame['announce_date'].drop_nulls().len()
                if filled:
                    opened.append(f'{table}: {filled} announce_date values')
            else:
                unverifiable.append(f'{table}: no announce_date column')
            if 'pit_verified' in frame.columns:
                if frame['pit_verified'].drop_nulls().sum() not in (0, None):
                    opened.append(f'{table}: pit_verified=true')
        except Exception as exc:  # noqa: BLE001
            unverifiable.append(f'{table}: {type(exc).__name__}')
    status = 'FAIL' if opened else ('WARN' if unverifiable else 'PASS')
    return check('financial_pit', status,
                 'announce_date / PIT unexpectedly populated' if opened else
                 'announce_date empty and PIT closed across the five upstream tables'
                 if not unverifiable else 'some tables cannot be verified',
                 violations=opened, unverifiable=unverifiable)


def check_index_daily_sessions(root):
    """Index change_pct needs at least two kline_index_daily partitions."""
    target = root / 'data-local' / 'kline_index_daily'
    parts = sorted(p.name for p in target.glob('date=*')
                   if p.is_dir() and (p / 'part.parquet').is_file())
    enough = len(parts) >= 2
    return check('index_daily_history', 'PASS' if enough else 'WARN',
                 'index cards need two sessions; otherwise change_pct is null ("-")'
                 if not enough else 'index daily history has >= 2 sessions',
                 sessions=len(parts), latest=parts[-4:])


def check_mainline_history(root):
    part = root / 'data-local' / 'mainline_history' / 'part.parquet'
    if not part.is_file():
        return check('mainline_history', 'WARN', 'history table missing')
    try:
        frame = _read_parquet(part)
        dates = frame['date'].to_list() if 'date' in frame.columns else []
    except Exception as exc:  # noqa: BLE001
        return check('mainline_history', 'WARN', f'unreadable: {type(exc).__name__}: {exc}')
    return check('mainline_history', 'WARN',
                 'history was computed under the pre-switch taxonomy and is NOT '
                 'recomputed; the API note must state this explicitly',
                 rows=frame.height, first_date=min(dates) if dates else None,
                 last_date=max(dates) if dates else None)


def check_runtime_services(root, panel=PANEL, bridge=BRIDGE, timeout=3):
    results = []
    for label, url in (('panel_root', panel + '/'), ('panel_health', panel + '/health'),
                       ('local_sources_page', panel + '/local-sources')):
        code, _ = http_get(url, timeout=timeout)
        results.append(check(label, 'PASS' if code == 200 else 'FAIL',
                             f'HTTP {code}', url=url))
    code, payload = http_get(bridge + '/health', timeout=timeout)
    ok = code == 200 and isinstance(payload, dict) and payload.get('service') == 'tsp-local-readonly-bridge'
    results.append(check('bridge_health', 'PASS' if ok else 'FAIL',
                         f'HTTP {code}, service identity {"ok" if ok else "unverified"}'))
    code, payload = http_get(panel + '/api/settings/capability-matrix', timeout=timeout)
    results.append(check_matrix(payload) if code == 200 else
                   check('capability_matrix', 'FAIL', f'HTTP {code}'))
    token = read_env(root / '.env').get('TSP_BRIDGE_TOKEN')
    code, payload = http_get(bridge + '/status', timeout=timeout, token=token)
    pit = (payload or {}).get('fuyao_pit')
    closed = isinstance(pit, str) and pit.startswith('DISABLED_')
    results.append(check('bridge_pit_status',
                         'PASS' if code == 200 and closed else 'FAIL',
                         f'HTTP {code}, fuyao_pit={pit}'))
    code, payload = http_get(panel + '/api/regime/mainline?kind=concept&days=7', timeout=timeout)
    note = (payload or {}).get('membership_note', '') if code == 200 else ''
    states_mixed = '未回补' in note and '不可直接比较' in note
    results.append(check('mainline_note', 'PASS' if states_mixed else 'WARN',
                         f'HTTP {code}; history caveat {"present" if states_mixed else "missing (restart app to apply overrides)"}'))
    return results


def run_checks(root=ROOT, panel=PANEL, bridge=BRIDGE, skip_network=False, now=None,
               timeout=3):
    compose_text = ''
    compose = root / 'compose.yaml'
    if compose.is_file():
        compose_text = compose.read_text(encoding='utf-8')
    results = [check_compose(compose_text),
               check_credentials(root, compose_text),
               check_logs(root), check_evidence_chain(root), check_disk(root),
               check_offline(root, now=now),
               check_official_tables(root), check_financial_pit(root),
               check_index_daily_sessions(root), check_mainline_history(root)]
    if not skip_network:
        results.extend(check_runtime_services(root, panel, bridge, timeout))
    return results


def main():
    parser = argparse.ArgumentParser(description='Read-only TSP operations doctor')
    parser.add_argument('--root', default=str(ROOT), help='workspace root')
    parser.add_argument('--panel', default=PANEL)
    parser.add_argument('--bridge', default=BRIDGE)
    parser.add_argument('--timeout', type=float, default=3)
    parser.add_argument('--skip-network', action='store_true')
    parser.add_argument('--strict', action='store_true', help='exit 2 on WARN too')
    parser.add_argument('--json', action='store_true')
    args = parser.parse_args()
    results = run_checks(Path(args.root), args.panel, args.bridge,
                         args.skip_network, timeout=args.timeout)
    counts = {level: sum(1 for item in results if item['status'] == level)
              for level in ('PASS', 'WARN', 'FAIL')}
    report = {'generated_at': datetime.now(timezone.utc).isoformat(),
              'root': str(args.root), 'summary': counts, 'checks': results}
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        for item in results:
            print(f"[{item['status']:4}] {item['name']}: {item['detail']}")
        print(f"SUMMARY: {counts['PASS']} PASS / {counts['WARN']} WARN / {counts['FAIL']} FAIL")
    if counts['FAIL']:
        return 1
    if args.strict and counts['WARN']:
        return 2
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
