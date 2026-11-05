"""A01: append-only, content-addressed, crash-recoverable evidence log."""
from __future__ import annotations

import hashlib
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pytest

from bridge.evidence import (
    GENESIS_HASH, SCHEMA_VERSION, EvidenceLog, canonical, content_hash,
)


def log(tmp_path, **kw):
    kw.setdefault('durable', False)
    kw.setdefault('clock', lambda: '2026-11-05T09:30:00+08:00')
    return EvidenceLog(tmp_path / 'evidence.jsonl', **kw)


def test_four_kinds_are_persisted_with_content_and_chain_hashes(tmp_path):
    ev = log(tmp_path)
    written = [ev.append(kind, {'n': i}, note=kind)
               for i, kind in enumerate(('SUCCESS', 'FAILED', 'MISSING', 'CONFLICT'))]
    assert [r['seq'] for r in written] == [1, 2, 3, 4]
    assert written[0]['prev_sha256'] == GENESIS_HASH
    assert written[1]['prev_sha256'] == written[0]['record_sha256']
    assert written[0]['payload_sha256'] == content_hash({'n': 0})
    assert written[0]['schema_version'] == SCHEMA_VERSION
    assert written[0]['observed_at'] == '2026-11-05T09:30:00+08:00'
    report = ev.verify()
    assert report['valid'] == 4 and report['total_lines'] == 4
    assert report['kinds'] == {'SUCCESS': 1, 'FAILED': 1, 'MISSING': 1, 'CONFLICT': 1}
    assert report['chain_ok'] and report['seq_ok'] and not report['damaged']
    assert report['last_seq'] == 4


def test_restart_resumes_chain_from_disk_not_memory(tmp_path):
    first = log(tmp_path)
    head = first.append('SUCCESS', {'phase': 'before'})
    second = log(tmp_path)  # simulates a restarted bridge process
    resumed = second.append('FAILED', {'phase': 'after'})
    assert resumed['seq'] == 2
    assert resumed['prev_sha256'] == head['record_sha256']
    assert second.verify()['chain_ok']


def test_crashed_partial_tail_is_preserved_and_reported(tmp_path):
    ev = log(tmp_path)
    head = ev.append('SUCCESS', {'ok': True})
    with ev.path.open('ab') as fh:
        fh.write(b'{"partial": ')  # crash mid-write, no newline
    resumed = ev.append('FAILED', {'after': 'crash'})
    assert resumed['prev_sha256'] == head['record_sha256']
    raw = ev.path.read_bytes()
    assert b'{"partial": ' in raw  # original bytes never overwritten
    report = ev.verify()
    assert report['valid'] == 2
    assert [d['reason'] for d in report['damaged']] == ['unparseable']
    assert report['chain_ok'] and report['seq_ok']


def test_tampering_is_detected(tmp_path):
    ev = log(tmp_path)
    ev.append('SUCCESS', {'price': 18.68})
    lines = ev.path.read_text().splitlines()
    tampered = json.loads(lines[0])
    tampered['payload']['price'] = 999.0
    ev.path.write_text(json.dumps(tampered, sort_keys=True, separators=(',', ':')) + '\n')
    report = ev.verify()
    assert report['valid'] == 0
    assert report['damaged'][0]['reason'] == 'hash_mismatch'


def test_injected_record_with_valid_hash_but_wrong_parent_breaks_chain(tmp_path):
    ev = log(tmp_path)
    ev.append('SUCCESS', {'n': 1})
    body = {'schema_version': SCHEMA_VERSION, 'seq': 2,
            'observed_at': '2026-11-05T09:30:00+08:00', 'kind': 'NOTE',
            'payload': {'fake': True}, 'payload_sha256': content_hash({'fake': True}),
            'prev_sha256': GENESIS_HASH}
    body['record_sha256'] = hashlib.sha256(
        (GENESIS_HASH + canonical(body)).encode('utf-8')).hexdigest()
    with ev.path.open('a') as fh:
        fh.write(canonical(body) + '\n')
    ev.append('SUCCESS', {'n': 3})
    report = ev.verify()
    assert report['valid'] == 3 and not report['damaged']
    assert report['chain_ok'] is False  # hash-valid forgery, wrong chain head
    assert report['seq_ok']


def test_multi_megabyte_record_does_not_reset_the_chain(tmp_path):
    # Regression: a fixed 64 KiB tail window lands inside one large record,
    # finds no chain head and forks the chain from seq=1.
    ev = log(tmp_path)
    head = ev.append('SUCCESS', {'blob': 'x' * 300000})
    assert head['seq'] == 1
    nxt = ev.append('FAILED', {'after': 'large record'})
    assert nxt['seq'] == 2
    assert nxt['prev_sha256'] == head['record_sha256']
    report = ev.verify()
    assert report['valid'] == 2 and report['chain_ok'] and report['seq_ok']

    restarted = log(tmp_path)
    third = restarted.append('SUCCESS', {'after': 'restart'})
    assert third['seq'] == 3 and third['prev_sha256'] == nxt['record_sha256']


def test_large_payload_sidecar_is_idempotent_and_content_addressed(tmp_path):
    from bridge.evidence import store_large_payload
    payload = [{'i': i} for i in range(100)]
    first = store_large_payload(tmp_path, 'conflicts', payload)
    second = store_large_payload(tmp_path, 'conflicts', payload)
    assert first == second
    assert first['count'] == 100 and first['sha256'] == content_hash(payload)
    path = Path(first['path'])
    assert path.is_file() and json.loads(path.read_text()) == payload
    assert len(list(path.parent.iterdir())) == 1


def test_unknown_kind_and_reserved_fields_are_rejected(tmp_path):
    ev = log(tmp_path)
    with pytest.raises(ValueError):
        ev.append('MAYBE', {})
    with pytest.raises(ValueError):
        ev.append('NOTE', {}, seq=99)
    assert not ev.path.exists() or ev.path.stat().st_size == 0


def test_concurrent_appends_keep_unique_monotonic_seq(tmp_path):
    ev = log(tmp_path)

    def worker(i):
        return [ev.append('SUCCESS', {'worker': i, 'k': k})['seq'] for k in range(10)]

    with ThreadPoolExecutor(max_workers=8) as pool:
        seqs = [s for group in pool.map(worker, range(8)) for s in group]
    assert sorted(seqs) == list(range(1, 81))
    assert ev.verify()['seq_ok']


def test_recent_is_a_tail_view_and_safe_append_never_raises(tmp_path):
    ev = log(tmp_path)
    for i in range(5):
        ev.append('CONFLICT' if i % 2 else 'SUCCESS', {'i': i})
    recent = ev.recent('CONFLICT', limit=2)
    assert [r['payload']['i'] for r in recent] == [1, 3]
    assert ev.status()['last_seq'] == 5

    assert 'error' not in ev.safe_append('NOTE', {'ok': 1})
    assert ev.status()['last_seq'] == 6


def test_safe_append_counts_failure_instead_of_hiding_it(tmp_path):
    ev = log(tmp_path)
    ev.path.mkdir()  # force every open('ab') to fail: path is now a directory
    result = ev.safe_append('FAILED', {'reason': 'probe'})
    assert 'error' in result
    assert ev.status()['write_failures'] == 1
