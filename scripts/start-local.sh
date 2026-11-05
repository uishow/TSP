#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
.venv/bin/python scripts/manage.py start
docker compose up -d
