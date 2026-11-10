#!/usr/bin/env python3
"""补全 instruments.parquet 的 name 列（中文名）。

背景：bridge 的 free_stockdb 日线 bar 不带 name 字段，导致 sync_instruments
把 name 错填成代码本身（000157.SZ -> name="000157"），全站「股票名称」
显示为空/代码。本脚本用 eltdx 代码表（TdxClient.codes.*）生成权威
code->中文名 映射，回填 instruments.parquet。

用法：
  .venv/bin/python scripts/fix_instrument_names.py
可选参数：
  --dry-run   只统计不写盘
"""
from __future__ import annotations

import argparse
import logging
from contextlib import contextmanager
from pathlib import Path

import polars as pl


@contextmanager
def _safe_tdx():
    """eltdx codes 握手失败时降级为 None; 调用方每个循环都有 try/except。"""
    try:
        from eltdx import TdxClient
        with TdxClient(timeout=6) as client:
            yield client
    except Exception as exc:  # noqa: BLE001
        log.warning('eltdx codes 不可用 (%s); 不阻断名称修复', exc)
        yield None

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("fix_names")

ROOT = Path(__file__).resolve().parents[1]
PARQUET = ROOT / "data-local" / "instruments" / "instruments.parquet"


def _bridge_name_map() -> dict[str, str]:
    """全市场实时快照一次返回 5600+ 行, 每行自带中文名 (生产链路已在用)。

    2026-11-10: 交易时段 eltdx ``codes`` 握手经常 ``ResponseTimeoutError``,
    导致 instruments 的 name 被写成代码本身 (用户「数据-立即同步」后连板梯队
    不显示股票名)。这里把已经在跑的全市场快照当权威名称源, 一次请求即可。
    """
    import httpx

    # .env 里的 TSP_BRIDGE_URL 是「容器内视角」的 host.docker.internal,
    # 宿主脚本必须用环回地址直连, 否则走沙盒代理直接断连。
    token, url = '', 'http://127.0.0.1:7818'
    try:
        for line in (ROOT / '.env').read_text().splitlines():
            if line.startswith('TSP_BRIDGE_TOKEN='):
                token = line.split('=', 1)[1].strip()
    except OSError:
        return {}
    if not token:
        return {}
    try:
        with httpx.Client(base_url=url, headers={'Authorization': 'Bearer ' + token},
                          trust_env=False, timeout=20) as client:
            resp = client.post('/query', json={'dataset': 'realtime', 'symbols': []})
            resp.raise_for_status()
            rows = resp.json().get('rows', [])
        out: dict[str, str] = {}
        for row in rows:
            sym, name = row.get('symbol'), row.get('name')
            if sym and name and not str(name).strip().isdigit():
                out[str(sym)] = str(name).strip()
        return out
    except Exception as exc:  # noqa: BLE001 -- 名称补齐失败不能中断修数
        log.warning('bridge 全市场名称映射不可用: %s', exc)
        return {}


def build_name_map() -> dict[str, str]:
    """从 eltdx 代码表拿到 完整symbol(代码.交易所) -> 中文名。

    必须以 symbol 为 key: 同一 6位代码在 SH/SZ 可能既是指数又是股票
    (如 000001=上证指数/平安银行), 仅用代码做 key 会串味。

    优先用 bridge 全市场快照 (见 _bridge_name_map); 拿不到才回退 eltdx codes。
    """
    bridged = _bridge_name_map()
    if len(bridged) >= 3000:
        log.info('使用 bridge 全市场快照的权威名称 %d 条', len(bridged))
        return bridged
    log.warning('bridge 名称不足 (%d 条), 回退 eltdx codes', len(bridged))

    name_map: dict[str, str] = dict(bridged)
    with _safe_tdx() as client:
        # A股（沪/深/北）
        for m in ("sh", "sz", "bj"):
            try:
                rows = client.codes.a_shares(m)
            except Exception as e:  # noqa: BLE001
                log.warning("a_shares(%s) 失败: %s", m, e)
                continue
            for r in rows:
                code = getattr(r, "code", None)
                nm = getattr(r, "name", None)
                ex = getattr(r, "exchange", m)
                if code and nm:
                    name_map[f"{code}.{str(ex).upper()}"] = nm
        # ETF / 指数（让这些名称也能显示）
        for m in ("sh", "sz", "bj"):
            for getter in ("etfs", "indices"):
                try:
                    rows = getattr(client.codes, getter)(m)
                except Exception:
                    continue
                for r in rows:
                    code = getattr(r, "code", None)
                    nm = getattr(r, "name", None)
                    ex = getattr(r, "exchange", m)
                    if code and nm:
                        key = f"{code}.{str(ex).upper()}"
                        if key not in name_map:
                            name_map[key] = nm
    return name_map


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not PARQUET.exists():
        raise SystemExit(f"找不到 {PARQUET}")

    df = pl.read_parquet(PARQUET)
    log.info("读取 %s  行数=%d 列=%s", PARQUET, df.height, df.columns)

    name_map = build_name_map()
    log.info("eltdx 代码表拿到名称 %d 条", len(name_map))

    updated: list = []
    fixed = 0
    for s, old in zip(df["symbol"].to_list(), df["name"].to_list()):
        new = name_map.get(s)  # 用完整 symbol 匹配 (代码.交易所)
        if new is None:
            # eltdx 无此 symbol 的权威名 -> 保留旧值
            updated.append(old)
            continue
        # eltdx 有该 symbol 的权威名: 直接采用, 覆盖任何旧值
        # (含第一版脚本因仅按代码做 key 而串味的指数名错误)
        if new != old:
            fixed += 1
        updated.append(new)

    out = df.with_columns(pl.Series("name", updated))
    n_with_name = sum(
        1 for x in updated if x and not (isinstance(x, str) and x.isdigit() and len(x) <= 6)
    )
    log.info("可显示真实名称的行: %d / %d；本脚本修正 %d 行", n_with_name, out.height, fixed)

    if args.dry_run:
        log.info("[dry-run] 不写盘")
        return

    out.write_parquet(PARQUET)
    log.info("已写回 %s", PARQUET)


if __name__ == "__main__":
    main()
