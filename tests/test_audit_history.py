"""D01: historical data audit (read-only, resumable)."""
import struct
import sys
from pathlib import Path

# scripts/ is not a package; load it explicitly from the project tree.
_SCRIPTS = Path(__file__).resolve().parents[1] / 'scripts'
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))
from scripts import audit_history as ah  # noqa: E402


def _write_day(path, ymd_list):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('wb') as f:
        for ymd in ymd_list:
            f.write(struct.pack('<I', ymd) + b'\x00' * 28)


def test_scan_file_ok_and_dates(tmp_path):
    p = tmp_path / 'sh000001.day'
    _write_day(p, [20240102, 20240103])
    rec = ah.scan_file(p, 'daily')
    assert rec['status'] == 'OK'
    assert rec['records'] == 2
    assert rec['first_date'] == '20240102'
    assert rec['last_date'] == '20240103'


def test_scan_file_bad_length(tmp_path):
    p = tmp_path / 'sh000001.day'
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(b'\x00' * 33)  # not a multiple of 32
    rec = ah.scan_file(p, 'daily')
    assert rec['status'] == 'BAD_FILE'


def test_run_enumerates_and_resumes(tmp_path):
    vip = tmp_path / 'vipdoc' / 'sh' / 'lday'
    _write_day(vip / 'sh600031.day', [20240102, 20240103, 20240104])
    bad = tmp_path / 'vipdoc' / 'sh' / 'lday' / 'sh600032.day'
    bad.parent.mkdir(parents=True, exist_ok=True)
    bad.write_bytes(b'\x00' * 33)
    ck = tmp_path / 'ck.json'

    rep1 = ah.run(root=tmp_path, checkpoint=ck, resume=False)
    assert rep1['total_files'] == 2
    assert rep1['ok'] == 1
    assert rep1['bad_file'] == 1

    # second run with resume must skip already-scanned files (same mtime/size)
    rep2 = ah.run(root=tmp_path, checkpoint=ck, resume=True)
    assert rep2['total_files'] == 2
    assert rep2['failed'][0]['path'] == str(bad)
