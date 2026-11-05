"""Bridge shared library.

Shared by the host-side read-only bridge server (port 7818) and the TSP
container's overrides (e.g. ``overrides.realtime_quality`` imports
``bridge.quote_quality`` for in-process data-quality admission). Mounted into
the TSP container at /app/bridge; pure stdlib modules only, safe to import.
"""
