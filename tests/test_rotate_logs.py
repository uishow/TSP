"""Regression coverage for evidence-preserving log rotation."""
import gzip
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'scripts'))
import rotate_logs as rl  # noqa: E402


def _runtime(tmp_path):
    runtime = tmp_path / 'runtime'
    runtime.mkdir(exist_ok=True)
    return runtime


def _audit(tmp_path, payload):
    path = _runtime(tmp_path) / rl.AUDIT_NAME
    path.write_bytes(payload)
    return path


def test_dry_run_changes_nothing(tmp_path):
    payload = b'{"query":"sample"}\n' * 20
    path = _audit(tmp_path, payload)
    result = rl.run(tmp_path, limit=10, apply=False, bridge_log=False, prune=False, keep=12)
    assert result[0]['action'] == 'would_rotate'
    assert path.read_bytes() == payload
    assert not (tmp_path / 'runtime' / 'archive').exists()


def test_apply_rotates_preserves_every_byte_and_recreates_active_log(tmp_path):
    payload = b'{"query":"sample"}\n' * 20
    path = _audit(tmp_path, payload)
    result = rl.run(tmp_path, limit=10, apply=True, bridge_log=False, prune=False, keep=12)
    assert result[0]['action'] == 'rotated'
    assert path.read_bytes() == b''
    archive = tmp_path / result[0]['archive']
    assert archive.name.startswith(rl.ARCHIVE_PREFIX) and archive.suffix == '.gz'
    with gzip.open(archive, 'rb') as handle:
        assert handle.read() == payload


def test_below_threshold_and_missing_are_no_ops(tmp_path):
    path = _audit(tmp_path, b'small')
    assert rl.run(tmp_path, limit=100, apply=True, bridge_log=False,
                  prune=False, keep=12)[0]['action'] == 'below_threshold'
    assert path.read_bytes() == b'small'
    path.unlink()
    assert rl.run(tmp_path, limit=100, apply=True, bridge_log=False,
                  prune=False, keep=12)[0]['action'] == 'missing'


def test_bridge_log_refused_while_bridge_running(tmp_path):
    payload = b'bridge output\n' * 20
    path = _runtime(tmp_path) / rl.BRIDGE_LOG_NAME
    path.write_bytes(payload)
    result = rl.run(tmp_path, limit=10, apply=True, bridge_log=True,
                    prune=False, keep=12, running=True)
    assert result[1]['action'] == 'refused_bridge_running'
    assert path.read_bytes() == payload


def test_bridge_log_archived_when_bridge_stopped(tmp_path):
    payload = b'bridge output\n' * 20
    path = _runtime(tmp_path) / rl.BRIDGE_LOG_NAME
    path.write_bytes(payload)
    result = rl.run(tmp_path, limit=10, apply=True, bridge_log=True,
                    prune=False, keep=12, running=False)
    assert result[1]['action'] == 'rotated'
    archive = tmp_path / result[1]['archive']
    assert archive.name.startswith(rl.BRIDGE_ARCHIVE_PREFIX) and archive.suffix == '.gz'
    with gzip.open(archive, 'rb') as handle:
        assert handle.read() == payload
    assert path.read_bytes() == b''


def test_prune_only_removes_script_owned_audit_archives(tmp_path):
    archive_dir = _runtime(tmp_path) / 'archive'
    archive_dir.mkdir()
    owned = []
    for index in range(3):
        path = archive_dir / f'{rl.ARCHIVE_PREFIX}2026010{index}.jsonl.gz'
        path.write_bytes(str(index).encode())
        owned.append(path)
    foreign = archive_dir / 'manual-notes.txt'
    foreign.write_text('keep me')
    bridge_archive = archive_dir / f'{rl.BRIDGE_ARCHIVE_PREFIX}20260101.log.gz'
    bridge_archive.write_bytes(b'keep me too')
    result = rl.prune_archives(tmp_path, keep=1, apply=True)
    assert result['action'] == 'pruned' and len(result['removed']) == 2
    assert foreign.exists() and bridge_archive.exists()
    assert len(list(archive_dir.glob(f'{rl.ARCHIVE_PREFIX}*.gz'))) == 1


def test_prune_dry_run_keeps_files(tmp_path):
    archive_dir = _runtime(tmp_path) / 'archive'
    archive_dir.mkdir()
    for index in range(3):
        (archive_dir / f'{rl.ARCHIVE_PREFIX}2026010{index}.jsonl.gz').write_bytes(b'x')
    assert rl.prune_archives(tmp_path, keep=1, apply=False)['action'] == 'would_prune'
    assert len(list(archive_dir.iterdir())) == 3


# -- A01 evidence log rotation ---------------------------------------------
def test_apply_rotates_evidence_log_and_preserves_every_byte(tmp_path):
    payload = b'{"seq":1}\n' * 20
    path = _runtime(tmp_path) / rl.EVIDENCE_NAME
    path.write_bytes(payload)
    result = rl.run(tmp_path, limit=10, apply=True, bridge_log=False,
                    prune=False, keep=12)
    ev = result[-1]
    assert ev['action'] == 'rotated'
    assert path.read_bytes() == b''
    archive = tmp_path / ev['archive']
    assert archive.name.startswith(rl.EVIDENCE_ARCHIVE_PREFIX)
    assert archive.name.endswith('.jsonl.gz')
    with gzip.open(archive, 'rb') as handle:
        assert handle.read() == payload


def test_evidence_dry_run_changes_nothing(tmp_path):
    payload = b'{"seq":1}\n' * 20
    path = _runtime(tmp_path) / rl.EVIDENCE_NAME
    path.write_bytes(payload)
    result = rl.run(tmp_path, limit=10, apply=False, bridge_log=False,
                    prune=False, keep=12)
    assert result[-1]['action'] == 'would_rotate'
    assert path.read_bytes() == payload
    assert not (tmp_path / 'runtime' / 'archive').exists()


def test_evidence_chain_resumes_from_genesis_after_rotation(tmp_path):
    from bridge.evidence import GENESIS_HASH, EvidenceLog
    path = _runtime(tmp_path) / rl.EVIDENCE_NAME
    first = EvidenceLog(path, durable=False)
    first.append('SUCCESS', {'n': 1})
    first.append('FAILED', {'n': 2})
    assert first.verify()['chain_ok'] and first.verify()['last_seq'] == 2
    rl.rotate_online_log(tmp_path, path, rl.EVIDENCE_ARCHIVE_PREFIX,
                         limit=1, apply=True)
    restarted = EvidenceLog(path, durable=False)
    new = restarted.append('SUCCESS', {'n': 3})
    assert new['seq'] == 1 and new['prev_sha256'] == GENESIS_HASH
    assert restarted.verify()['chain_ok']


def test_prune_never_removes_evidence_archives(tmp_path):
    archive_dir = _runtime(tmp_path) / 'archive'
    archive_dir.mkdir()
    for index in range(3):
        (archive_dir / f'{rl.ARCHIVE_PREFIX}2026010{index}.jsonl.gz').write_bytes(b'x')
    evidence = archive_dir / f'{rl.EVIDENCE_ARCHIVE_PREFIX}20260101.jsonl.gz'
    evidence.write_bytes(b'evidence chain segment')
    result = rl.prune_archives(tmp_path, keep=1, apply=True)
    assert result['action'] == 'pruned' and len(result['removed']) == 2
    assert evidence.exists()
