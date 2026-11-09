"""收尾：临时调小 enriched 批大小后重算全量 enriched，避开 9.67GiB 内存下的 OOM。

根因：pipeline._RAM_LARGE_BYTES = 8 GiB，而容器可见内存 9.67 GiB 被判为
"内存充裕"，_adaptive_sym_batch 因此不收缩批次，直接用默认
enriched_batch_size=1000 → 每批约 1000 只 × 2747 行/只 ≈ 275 万行，
在 join_asof 阶段被 OOM Killed。

本脚本临时把 enriched_batch_size 设为 100（约 27 万行/批、约 56 批），
跑完在 finally 恢复原值，不改动用户的长期偏好。

执行（容器内）：
  docker cp scripts/finalize_enriched.py tsp-local:/tmp/finalize_enriched.py
  docker exec -d tsp-local sh -c 'TSP_SOURCE_POLICY=0 PYTHONUNBUFFERED=1 \
    /app/.venv/bin/python -u /tmp/finalize_enriched.py > /tmp/finalize_pipeline.log 2>&1'
"""
from __future__ import annotations
from app.services import preferences as prefs
from app.indicators.pipeline import run_pipeline

BATCH = 100


def main() -> None:
    original = prefs.get_enriched_batch_size()
    try:
        prefs.set_enriched_batch_size(BATCH)
        print(f"[batch] enriched_batch_size {original} -> {BATCH}", flush=True)
        rows = run_pipeline()
        print(f"[pipeline] enriched rows={rows}", flush=True)
    finally:
        prefs.set_enriched_batch_size(original)
        print(f"[batch] restored -> {original}", flush=True)
    print("[done] 全量 enriched 重算完成", flush=True)


if __name__ == "__main__":
    main()
