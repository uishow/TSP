#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
docker compose stop
.venv/bin/python scripts/manage.py stop
