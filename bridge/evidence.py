"""Append-only, content-addressed evidence log for the TSP read-only bridge.

Design invariants
-----------------
* One JSON object per line, append only. This module never rewrites, truncates
  or deletes an existing record. Rotation/archiving is a separate, explicit
  operator action (``scripts/rotate_logs.py``).
* Every record carries ``payload_sha256`` (content address) and a chain hash
  over ``prev_sha256 + canonical(record)``, so edited, reordered or injected
  records are detectable by :meth:`verify`.
* A crash mid-write can leave a partial final line. ``append`` terminates that
  line with a newline before writing the next record: the original bytes stay
  in the file and are reported as DAMAGED by ``verify`` -- they are never
  silently dropped or overwritten.
* ``append`` is serialized process-wide. The previous chain head is re-read
  from the file tail on every write, so a restarted process resumes the chain
  without trusting in-memory state (and survives an external log rotation).

This module deliberately has no imports from the rest of ``bridge`` to avoid
circular imports: router, server and local_store all depend on it, not vice
versa.
"""
from __future__ import annotations

import hashlib
import json
import os
import threading
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

SCHEMA_VERSION = 'tsp-evidence/1'
KINDS = frozenset({'SUCCESS', 'FAILED', 'MISSING', 'CONFLICT', 'NOTE'})
GENESIS_HASH = '0' * 64
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PATH = ROOT / 'runtime' / 'evidence.jsonl'
TAIL_CHUNK_BYTES = 65536
MAX_TAIL_BYTES = 16 * 1024 * 1024

_RESERVED = frozenset({
    'schema_version', 'seq', 'observed_at', 'kind', 'payload',
    'payload_sha256', 'prev_sha256', 'record_sha256',
})


def canonical(value) -> str:
    """Stable serialization used for both content and chain hashes."""
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':'), default=str)


def content_hash(value) -> str:
    return hashlib.sha256(canonical(value).encode('utf-8')).hexdigest()


def store_large_payload(root, kind, payload):
    """Persist bulky evidence once, by content hash, outside the append chain.

    A full conflict list from a market-wide refresh can be megabytes. Copying it
    into every response/audit/evidence record both inflates logs enormously and
    makes the chain-head tail scan fragile. The full list stays available via an
    immutable, idempotent sidecar; the chain keeps only its address and count.
    """
    data = canonical(payload).encode('utf-8')
    sha = hashlib.sha256(data).hexdigest()
    path = Path(root) / 'runtime' / 'evidence-parts' / ('%s-%s.json' % (kind, sha))
    if not path.is_file():
        parent = path.parent
        if not parent.is_dir():
            try:
                parent.mkdir(parents=True)
            except FileExistsError:
                if not parent.is_dir():
                    raise
        tmp = path.with_name(path.name + '.part')
        tmp.write_bytes(data)
        os.replace(tmp, path)
    return {'count': len(payload), 'sha256': sha,
            'path': str(path), 'bytes': len(data)}


def _beijing_now() -> str:
    return datetime.now(ZoneInfo('Asia/Shanghai')).isoformat()


class EvidenceLog:
    def __init__(self, path=DEFAULT_PATH, clock=None, durable=True):
        self.path = Path(path)
        self._clock = clock or _beijing_now
        self._durable = durable
        self._lock = threading.RLock()
        self._write_failures = 0

    # -- internals -----------------------------------------------------
    def _ensure_parent(self):
        # NOTE: this sandbox's path proxy raises FileExistsError for
        # mkdir(exist_ok=True) on an already existing directory. Check first.
        parent = self.path.parent
        if parent.is_dir():
            return
        try:
            parent.mkdir(parents=True)
        except FileExistsError:
            if not parent.is_dir():
                raise

    @staticmethod
    def _last_valid(data):
        """Find the last complete, parseable record inside a tail byte window."""
        for raw in reversed([line for line in data.split(b'\n') if line.strip()]):
            try:
                rec = json.loads(raw.decode('utf-8'))
            except (UnicodeDecodeError, json.JSONDecodeError):
                continue  # a damaged / truncated line is preserved, not trusted
            if isinstance(rec, dict) and 'record_sha256' in rec and 'seq' in rec:
                return rec
        return None

    def _tail(self):
        """Return (prev_hash, seq, needs_newline, last_valid_record).

        Reads backwards from EOF with an exponentially growing window. A single
        record can legitimately be several MB (e.g. a full conflict list), so a
        fixed 64 KiB window can land entirely inside one record: the naive
        implementation then found no chain head, reset ``seq`` to 1 and forked
        the hash chain. Keep expanding until a whole record fits.
        """
        if not self.path.is_file():
            return GENESIS_HASH, 0, False, None
        size = self.path.stat().st_size
        if size == 0:
            return GENESIS_HASH, 0, False, None
        with self.path.open('rb') as fh:
            fh.seek(0, os.SEEK_END)
            size = fh.tell()
            chunk = min(size, TAIL_CHUNK_BYTES)
            data = b''
            last = None
            while True:
                fh.seek(size - chunk)
                data = fh.read(chunk)
                last = self._last_valid(data)
                if last is not None or chunk >= size or chunk >= MAX_TAIL_BYTES:
                    break
                chunk = min(size, chunk * 4, MAX_TAIL_BYTES)
        needs_newline = not data.endswith(b'\n')
        if last is None:
            return GENESIS_HASH, 0, needs_newline, None
        return str(last['record_sha256']), int(last['seq']), needs_newline, last

    # -- public API ----------------------------------------------------
    def append(self, kind, payload, **fields):
        """Append one immutable record and return it (including its hashes)."""
        if kind not in KINDS:
            raise ValueError('Unsupported evidence kind: %s' % kind)
        clash = _RESERVED.intersection(fields)
        if clash:
            raise ValueError('Reserved evidence fields: %s' % sorted(clash))
        with self._lock:
            self._ensure_parent()
            prev_hash, seq, needs_newline, _ = self._tail()
            record = {
                'schema_version': SCHEMA_VERSION,
                'seq': seq + 1,
                'observed_at': self._clock(),
                'kind': kind,
                'payload': payload,
                'payload_sha256': content_hash(payload),
                'prev_sha256': prev_hash,
            }
            record.update(fields)
            record['record_sha256'] = hashlib.sha256(
                (prev_hash + canonical(record)).encode('utf-8')).hexdigest()
            line = (canonical(record) + '\n').encode('utf-8')
            with self.path.open('ab') as fh:
                if needs_newline:
                    # Keep the crashed partial line byte-for-byte; make it a
                    # separate (damaged) line so the next record stays valid.
                    fh.write(b'\n')
                fh.write(line)
                fh.flush()
                if self._durable:
                    os.fsync(fh.fileno())
            return dict(record)

    def safe_append(self, kind, payload, **fields):
        """Best-effort append for audit side paths; never raises to the caller.

        A failed write increments ``write_failures`` which is surfaced on
        ``/status`` -- audit degradation must never be silent, but it also must
        not turn a healthy data response into a 500.
        """
        try:
            return self.append(kind, payload, **fields)
        except Exception as exc:
            with self._lock:
                self._write_failures += 1
            return {'error': type(exc).__name__, 'message': str(exc), 'kind': kind}

    def iter_lines(self):
        if not self.path.is_file():
            return
        with self.path.open('rb') as fh:
            for lineno, raw in enumerate(fh, start=1):
                yield lineno, raw

    def records(self):
        """Yield parseable evidence records, skipping (but not hiding) damage."""
        for _, raw in self.iter_lines():
            try:
                rec = json.loads(raw.decode('utf-8'))
            except (UnicodeDecodeError, json.JSONDecodeError):
                continue
            if isinstance(rec, dict) and 'record_sha256' in rec:
                yield rec

    def recent(self, kind=None, limit=20, max_bytes=1 << 20):
        """Cheap reverse-tail view for status pages; full evidence stays on disk."""
        if limit < 1 or not self.path.is_file():
            return []
        size = self.path.stat().st_size
        if size == 0:
            return []
        with self.path.open('rb') as fh:
            fh.seek(0, os.SEEK_END)
            size = fh.tell()
            chunk = min(size, max_bytes)
            fh.seek(size - chunk)
            data = fh.read()
        found = []
        for raw in reversed([line for line in data.split(b'\n') if line.strip()]):
            try:
                rec = json.loads(raw.decode('utf-8'))
            except (UnicodeDecodeError, json.JSONDecodeError):
                continue
            if not isinstance(rec, dict) or 'record_sha256' not in rec:
                continue
            if kind is not None and rec.get('kind') != kind:
                continue
            found.append(rec)
            if len(found) >= limit:
                break
        return list(reversed(found))

    def verify(self):
        """Full linear integrity check; damaged lines are reported, not fixed."""
        exists = self.path.is_file()
        report = {
            'file': str(self.path), 'schema_version': SCHEMA_VERSION,
            'exists': exists, 'bytes': self.path.stat().st_size if exists else 0,
            'total_lines': 0, 'valid': 0, 'damaged': [], 'kinds': {},
            'chain_ok': True, 'seq_ok': True, 'last_seq': 0,
            'last_hash': GENESIS_HASH, 'write_failures': self._write_failures,
        }
        if not exists:
            return report
        prev = GENESIS_HASH
        last_seq = 0
        for lineno, raw in self.iter_lines():
            report['total_lines'] += 1
            try:
                rec = json.loads(raw.decode('utf-8'))
            except (UnicodeDecodeError, json.JSONDecodeError):
                report['damaged'].append(
                    {'line': lineno, 'reason': 'unparseable', 'bytes': len(raw)})
                continue
            if not isinstance(rec, dict) or 'record_sha256' not in rec:
                report['damaged'].append(
                    {'line': lineno, 'reason': 'not_an_evidence_record', 'bytes': len(raw)})
                continue
            body = {k: v for k, v in rec.items() if k != 'record_sha256'}
            expected = hashlib.sha256(
                (str(body.get('prev_sha256', '')) + canonical(body)).encode('utf-8')
            ).hexdigest()
            if expected != rec.get('record_sha256'):
                report['damaged'].append(
                    {'line': lineno, 'reason': 'hash_mismatch', 'bytes': len(raw)})
                continue
            if rec.get('prev_sha256') != prev:
                report['chain_ok'] = False
            seq = int(rec.get('seq', 0))
            if seq != last_seq + 1:
                report['seq_ok'] = False
            last_seq = seq
            prev = rec['record_sha256']
            report['valid'] += 1
            label = str(rec.get('kind'))
            report['kinds'][label] = report['kinds'].get(label, 0) + 1
        report['last_seq'] = last_seq
        report['last_hash'] = prev
        return report

    def status(self):
        """O(1)-ish status summary; does not scan the whole log."""
        prev_hash, seq, _, _ = self._tail()
        return {'enabled': True, 'path': str(self.path),
                'last_seq': seq, 'last_hash': prev_hash,
                'write_failures': self._write_failures,
                'schema_version': SCHEMA_VERSION}


_default = None
_default_lock = threading.Lock()


def default_evidence():
    """Process-wide default log, referenced lazily so tests can substitute it."""
    global _default
    with _default_lock:
        if _default is None:
            _default = EvidenceLog()
        return _default
