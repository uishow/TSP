"""regime 市场环境历史全量补算（仅供 docker exec 容器内运行）。

只做 regime：run_regime_batch → upsert_regime_history → refresh_phase_labels。
不重算 concept/industry 主线（留给日常管线，缩小任务面、降风险）。
幂等：对已有区间重算结果一致，对缺失区间追加。
"""
from __future__ import annotations

import logging
import sys
import time
from datetime import date

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s regime_backfill: %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger("regime_backfill")

START = date(2000, 1, 4)
END = date(2026, 11, 9)


def main() -> int:
    log.info("importing app modules ...")
    from app.tickflow.repository import DataStore, KlineRepository
    from app.services import regime_builder

    store = DataStore()
    repo = KlineRepository(store)
    data_dir = store.data_dir
    log.info("data_dir = %s", data_dir)

    t0 = time.time()
    log.info("run_regime_batch start=%s end=%s", START, END)
    rows = regime_builder.run_regime_batch(repo, start=START, end=END)
    if rows is None or rows.is_empty():
        log.error("run_regime_batch returned empty — nothing to upsert")
        return 2
    n = rows.height
    log.info("computed rows = %d (%.1fs)", n, time.time() - t0)

    regime_builder.upsert_regime_history(data_dir, rows)
    log.info("upsert done")

    phase_days = regime_builder.refresh_phase_labels(data_dir)
    log.info("refresh_phase_labels phase_days = %d", phase_days)

    cov = regime_builder.get_regime_coverage(data_dir)
    log.info("coverage after = %s", cov)
    log.info("BACKFILL_DONE")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        log.exception("BACKFILL_FAILED: %s", exc)
        sys.exit(1)
