"""Fixed read-only verification of the local financial observation layer.

C02 keeps the bridge's financial data honest: it reads only what the local TDX
gpcw binaries actually contain, never calls the SDK to backfill remote data, and
labels every field with its true verification standing.

The gpcw observation layer is intentionally a *raw* layer: columns are numbered
(col1..colN) because no column-to-field mapping has been verified end to end.
report_period_end comes from the file header and is the reporting period, never
an announcement date. announce_date stays null and pit_verified stays false.
"""
from __future__ import annotations

from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import struct

from . import financial_schema as fs
from .tdx_local import TDXLocal
from .schemas import SourceUnavailable


class LocalFinancial:
    def __init__(self, tdx=None):
        self.tdx = tdx or TDXLocal()

    def observation(self, symbols, latest_only=True):
        """Raw gpcw observation rows, each labelled with its true verification state.

        Returns the rows from tdx_local.financials('raw', ...) with a consistent
        ``field_mapping_verified=False``, ``announce_date=None`` and
        ``pit_verified=False`` so downstream can never mistake raw columns for a
        mapped three-statement field.
        """
        rows = self.tdx.financials('raw', symbols, latest_only)
        for row in rows:
            row['field_mapping_verified'] = False
            row['announce_date'] = None
            row['pit_verified'] = False
        return rows

    def verify_table(self, table, symbols=None):
        """Combine the static schema contract with what the local layer can serve."""
        table = fs.normalize_table(table)
        status = fs.verification_status(table)
        local_available = False
        if fs.is_observation_table(table):
            # raw/observation are served directly from local gpcw
            local_available = True
        report = {
            'table': table,
            'local_source': 'tdx_gpcw_observation' if fs.is_observation_table(table) else 'bridge_contract_only',
            'local_available': local_available,
            'field_mapping_verified': status['field_mapping_verified'],
            'pit_verified': status['pit_verified'],
            'announce_date_source': status['announce_date_source'],
            'period_semantics': status['period_semantics'],
            'note': status['note'],
        }
        return report

    def coverage(self, symbols):
        """Per native table: source + verification standing (no fabricated coverage)."""
        return [self.verify_table(t, symbols) for t in fs.NATIVE_TABLES + fs.OBSERVATION_TABLES]

    def audit_local_files(self, root=None):
        """Enumerate local gpcw binaries and report period coverage (read-only).

        This is the genuine local inventory: how many report files exist, which
        report periods they carry, and total bytes. It never reads remote data.
        """
        base = Path(root) if root else self.tdx.vipdoc
        cw = base / 'cw'
        files = sorted(cw.glob('gpcw????????.dat')) + sorted(cw.glob('gpcw????????.zip'))
        periods = []
        total_bytes = 0
        for path in files:
            total_bytes += path.stat().st_size
            period = path.name[4:12]
            periods.append(period)
        return {
            'root': str(base),
            'file_count': len(files),
            'period_count': len(periods),
            'periods': periods,
            'total_bytes': total_bytes,
            'note': 'Local gpcw binaries only; no remote backfill performed.',
        }

    def schema_verify_row(self, row):
        """Attach C01 contract verdicts to a single observation row.

        A raw observation row always gets field_mapping_verified=False and
        announce_date=None; pit_verified stays False. This is the gate that keeps
        raw numbered columns from being presented as mapped fields.
        """
        verdict = dict(row)
        verdict['field_mapping_verified'] = False
        verdict['announce_date'] = None
        verdict['pit_verified'] = False
        verdict['period_end'] = row.get('period_end')
        verdict['source'] = row.get('source', 'tdx_gpcw_observation')
        return verdict

    def build_synthetic_gpcw(self, path, report_end, code, values):
        """Write a minimal valid gpcw binary for tests (mirrors tdx_local parser).

        Layout (matches bridge/tdx_local.py financials):
          header '<hIHIII' (22 bytes): [0:2] pad, [2:6] report date int,
          [6:10] count, [10:14] pad, [14:18] record size (bytes, /4),
          [18:22] pad; then per-code 11-byte record at offset 20+11*i:
          6-byte code, 1-byte kind, 4-byte absolute float offset; then float values.
        """
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        size = len(values) * 4
        if size > 16384 or size % 4:
            raise ValueError('record size must be a multiple of 4 and <= 16384')
        payload = bytearray(struct.pack('<hIHIII', 0, int(report_end), 1, 0, size, 0))
        record = code.encode('ascii')[:6].ljust(6, b'\x00') + b'\x00' + struct.pack('<I', 20 + 11)
        # ensure header occupies 22 bytes; record starts at offset 20
        while len(payload) < 20:
            payload.append(0)
        payload[20:20 + len(record)] = record
        payload += struct.pack('<%df' % len(values), *values)
        path.write_bytes(bytes(payload))
        return path
