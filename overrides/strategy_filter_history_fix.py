#!/usr/bin/env python3
"""O22 · AI 生成策略入口校验缺口运行时补丁（防复发，用户 2026-11-10 指令 10）。

大白话（点哪→发生什么→结果在哪看→出错怎么查）：
  TSP 自带的策略引擎在加载自定义 / AI 策略时，严格要求「每种执行后端只声明
  一种入口函数」：
    - EXECUTION_BACKEND="polars_expr"              只能有 filter，不能有 filter_history
    - EXECUTION_BACKEND="python_history_legacy"     只能有 filter_history，不能有 filter
  AI 生成器偶尔会把两种都写出来（漂移），于是整份策略加载失败、策略页报错。
  上游这条校验是「fail-closed」的，不能改（改了就放过了不合规策略）。
  本补丁在加载失败时，先分辨是不是「多写了一个入口函数」这种可自愈的错误；
  若是，就外科式删掉那个多余的函数（改前自动备份到同目录 .bak），再重试一次加载。
  其它真错误一律原样抛出，绝不掩盖。

升级兼容性（铁律）：
  - 不碰镜像 / tag / digest / compose / upstream / 容器内 /app/app / /app/static。
  - 只动 data-local/strategies/{custom,ai,research,composite}/ 下的用户策略文件
    （挂载卷，非镜像）。
  - 只处理引擎明确报出的两条消息；只删一个明确冗余的顶层函数；改前必备份。
  - TSP_STRATEGY_FH_FIX=0 一键关闭（不装补丁，恢复成引擎原生 fail-closed）。

边界防御：
  - 只在 StrategyEngine._load_file 抛出的 ValueError 命中特定文案时才介入；
  - 只改 /strategies/ 用户目录下的 .py；绝不改镜像内置 app/strategy/*；
  - 每个 (文件, 冗余函数) 组合只尝试一次，避免死循环；
  - 删除用 AST 定位整段函数，不靠脆弱的正则。
"""
from __future__ import annotations

import ast
import logging
import shutil
import threading
import time
from pathlib import Path

log = logging.getLogger("tsp.override.strategy_fh_fix")

# 仅允许在用户策略目录下动手；镜像内置策略不在这些目录里。
_STRATEGY_ROOT_HINTS = ("/strategies/",)
_ENV_OFF = "TSP_STRATEGY_FH_FIX"

_attempted: set[tuple[str, str]] = set()
_lock = threading.Lock()


def _redundant_name_from_error(msg: str) -> str | None:
    """把引擎报错文案映射到「该删哪个函数」。返回 None 表示不归本补丁管。"""
    m = str(msg)
    # 顺序重要：先匹配更具体的 "must declare only filter_history"。
    if "must declare only filter_history" in m:
        return "filter"  # python_history_legacy 后端：多了 filter
    if "must declare only filter" in m and "filter_history" not in m:
        return "filter_history"  # polars_expr 后端：多了 filter_history
    return None


def _remove_top_level_function(source: str, name: str) -> str | None:
    """用 AST 删除源码里名为 name 的顶层函数定义，返回新源码；找不到返回 None。"""
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return None
    target = None
    for node in tree.body:
        if isinstance(node, ast.FunctionDef) and node.name == name:
            target = node
            break
    if target is None or target.end_lineno is None:
        return None
    lines = source.splitlines(keepends=True)
    # 删除 [lineno-1, end_lineno) （AST 行号从 1 开始）。
    new_lines = lines[: target.lineno - 1] + lines[target.end_lineno :]
    return "".join(new_lines)


def _in_user_strategies(path: Path) -> bool:
    norm = str(path).replace("\\", "/")
    if not norm.endswith(".py"):
        return False
    return any(hint in norm for hint in _STRATEGY_ROOT_HINTS)


def _patch_strategy_file(path: Path, redundant: str) -> bool:
    """删除冗余函数并备份。成功返回 True。"""
    try:
        src = path.read_text(encoding="utf-8")
    except OSError as exc:
        log.warning("STRATEGY_FH_FIX: 读文件失败 %s: %s", path.name, exc)
        return False
    new_src = _remove_top_level_function(src, redundant)
    if new_src is None or new_src == src:
        return False
    ts = time.strftime("%Y%m%d_%H%M%S")
    bak = path.with_suffix(path.suffix + f".bak.{ts}.fhfix")
    try:
        shutil.copy2(path, bak)
    except OSError as exc:
        log.warning("STRATEGY_FH_FIX: 备份失败 %s: %s", path.name, exc)
        return False
    try:
        path.write_text(new_src, encoding="utf-8")
    except OSError as exc:
        log.warning("STRATEGY_FH_FIX: 写文件失败 %s: %s", path.name, exc)
        return False
    log.warning(
        "STRATEGY_FH_FIX: 已删除冗余入口函数 %s @ %s (备份 %s)",
        redundant, path.name, bak.name,
    )
    return True


def install() -> None:
    if logging.getLogger().isEnabledFor(logging.DEBUG):
        pass
    if __import__("os").environ.get(_ENV_OFF, "") == "0":
        log.info("STRATEGY_FH_FIX 关闭 (TSP_STRATEGY_FH_FIX=0)")
        return
    try:
        from app.strategy.engine import StrategyEngine
    except Exception as exc:  # noqa: BLE001
        log.warning("STRATEGY_FH_FIX 未装载：无法导入 StrategyEngine: %s", exc)
        return

    original = StrategyEngine._load_file

    def patched_load_file(path):
        p = Path(path)
        try:
            return original(p)
        except ValueError as exc:
            msg = str(exc)
            redundant = _redundant_name_from_error(msg)
            if redundant is None:
                raise
            key = (str(p.resolve()), redundant)
            with _lock:
                if key in _attempted or not _in_user_strategies(p):
                    raise
                _attempted.add(key)
            if not _patch_strategy_file(p, redundant):
                raise
            # 删掉了冗余函数，重试一次（同一份已改文件）。
            return original(p)

    StrategyEngine._load_file = staticmethod(patched_load_file)
    log.info("STRATEGY_FH_FIX 已装载：AI 策略入口冗余函数自愈补丁 (O22)")
