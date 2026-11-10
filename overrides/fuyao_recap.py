"""复盘页龙虎榜 / 异动监控竞价异动：只读本地 fuyao 快照的旁路 provider。

问题（大白话）：
  「竞价异动提示数据源未配置」和「复盘页龙虎榜空白」，不是页面坏了，而是
  上游 services/dragon_tiger.py 与 services/auction_benchmark.py 会问一句
  「fuyao 这个数据源装了吗？」，本项目为了零外联把除 local_quant 以外的
  数据源全锁掉了，回答永远是「没装」→ 页面显示 source_unavailable。

做法（不破坏任何既有边界）：
  - Key 不进容器：宿主机 scripts/fuyao_recap_sync.py 持 Key 拉数，产物是
    data-local/fuyao/recap/ 下的普通 JSON 快照（已被 .gitignore 忽略）。
  - 容器零外联不变：本模块不发任何网络请求，只读挂载卷里的 JSON。
  - 主数据源不变：不往 custom_loader._PROVIDERS 注册表里加东西，设置页
    /api/settings/data-sources 仍然只列 local_quant。
  - 只包装两个模块级函数：custom.is_custom_provider / custom.get_provider，
    并且**仅**对 name == "fuyao" 生效；其它名字原样交回 source_policy.py
    装好的 local_provider（该拦的照样拦）。
  - 上游的缓存、交易日回退、收益 enrich、AI 复盘摘要全部照常走，不改口径。

升级兼容性（铁律）：
  - 不碰镜像 / tag / digest / compose.yaml / upstream/，不写容器内随镜像分发的
    任何文件；本模块只存在于挂载卷 overrides/。
  - 启动时会核对：目标函数存在、app.plugins.fuyao.client.FuyaoError 可导入。
    任一项找不到（升级后签名变了）→ 记 FUYAO_RECAP_PATCH_SKIPPED 日志，
    原样返回上游行为，绝不白屏、绝不阻断启动；此时最多是这两个页面回到
    「数据源未配置」，TSP 主功能照常可用。
  - 快照缺失/过期属于运行时数据问题，不是补丁失败：记 FUYAO_RECAP_NO_SNAPSHOT，
    让 is_custom_provider("fuyao") 返回 False，上游照旧返回 source_unavailable；
    补跑一次宿主同步脚本即可恢复，无需重启容器。
  - 一键开关：TSP_FUYAO_RECAP=0 完全不装载。
  - 回滚：删掉 bootstrap.py 里那一行 install()，或设 TSP_FUYAO_RECAP=0 重启。

日期口径：
  provider 严格按上游传入的日期找快照，找不到就抛 FuyaoError，由上游自带的
  fallback_prev 回退到上一交易日并标记 state=fallback_prev。绝不拿更晚的
  数据冒充历史数据（无未来函数），也绝不返回空榜假装「今天没有」。
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path

log = logging.getLogger(__name__)

DEFAULT_ROOT = Path("/app/data/fuyao/recap")
FUYAO = "fuyao"
_INSTALLED_FLAG = "_tsp_fuyao_recap_installed"


def _root() -> Path:
    return Path(os.environ.get("TSP_FUYAO_RECAP_DIR") or DEFAULT_ROOT)


def _read_json(path: Path) -> dict | None:
    try:
        obj = json.loads(path.read_text(encoding="utf-8"))
        return obj if isinstance(obj, dict) else None
    except FileNotFoundError:
        # 当日榜单未发布 / 用户翻到没有快照的历史日，属于上游 fallback_prev 的
        # 正常分支，不打警告，避免每翻一页刷一条日志。
        return None
    except (OSError, ValueError) as exc:
        log.warning("FUYAO_RECAP_READ_FAILED: %s (%s)", path.name, type(exc).__name__)
        return None


def _latest() -> dict | None:
    return _read_json(_root() / "latest.json")


def snapshots_ready() -> bool:
    """两类快照至少有一类有可用日期，才算「已配置」。每次调用只读一个 JSON。"""
    latest = _latest()
    if not latest:
        log.warning("FUYAO_RECAP_NO_SNAPSHOT: %s 没有 latest.json，页面照旧提示未配置", _root())
        return False
    for key in ("dragon_tiger", "auction_benchmark"):
        section = latest.get(key) or {}
        date = section.get("latest_date")
        if date and (_root() / key / ("date=%s.json" % date)).is_file():
            return True
    log.warning("FUYAO_RECAP_NO_SNAPSHOT: latest.json 里没有可用日期，页面照旧提示未配置")
    return False


class LocalFuyaoRecap:
    """只实现上游两个特色数据服务会调到的三个方法；其余方法一律不提供。

    trading_days() 返回空列表是刻意的：app.services.trading_day / data_integrity
    也会顺带问 fuyao 要交易日历，返回空 = 它们按「未知」回退到本地近似，
    与本补丁装载前的行为完全一致，不改变主流程口径。
    """

    def dragon_tiger(self, board_type: str = "all", date: str | None = None) -> dict:
        from app.plugins.fuyao.client import FuyaoError

        iso = date or ((_latest() or {}).get("dragon_tiger") or {}).get("latest_date")
        snap = _read_json(_root() / "dragon_tiger" / ("date=%s.json" % iso)) if iso else None
        board = (snap or {}).get("boards", {}).get(board_type)
        if not isinstance(board, dict) or not (
            board.get("stock_items") or board.get("hot_money_items")
        ):
            raise FuyaoError("本地 fuyao 快照没有 %s 的 %s 榜数据" % (iso, board_type))
        return board  # 原始 data 容器，字段与 FuyaoClient._get() 解包后完全一致

    def short_term_benchmark(self, date: str | None = None) -> dict:
        from app.plugins.fuyao.client import FuyaoError

        iso = date or ((_latest() or {}).get("auction_benchmark") or {}).get("latest_date")
        snap = _read_json(_root() / "auction_benchmark" / ("date=%s.json" % iso)) if iso else None
        data = (snap or {}).get("data")
        if not isinstance(data, dict) or not data.get("item"):
            raise FuyaoError("本地 fuyao 快照没有 %s 的竞价风向标数据" % iso)
        return data

    def trading_days(self):
        return []

    def close(self):
        pass


_PROVIDER = LocalFuyaoRecap()


def install() -> bool:
    """在 bootstrap.py 末尾调用。返回是否装载成功，失败绝不抛异常。"""
    import socket

    if os.environ.get("TSP_FUYAO_RECAP", "1") == "0":
        log.warning("FUYAO_RECAP_PATCH_SKIPPED: TSP_FUYAO_RECAP=0（人工关闭）")
        return False
    if getattr(socket, _INSTALLED_FLAG, False):
        return True

    # 精确核对补丁目标；升级后签名/模块变了就安全退回，不阻断启动。
    try:
        from app.data_providers import custom as custom_sources
        from app.data_providers.custom import loader as custom_loader
        from app.plugins.fuyao.client import FuyaoError  # noqa: F401 — 存在性校验

        orig_is = custom_sources.is_custom_provider
        orig_get = custom_sources.get_provider
        if not callable(orig_is) or not callable(orig_get):
            raise AttributeError("is_custom_provider / get_provider 不可调用")
    except Exception as exc:  # noqa: BLE001 — 任何导入/契约变化都只记 SKIPPED
        log.warning("FUYAO_RECAP_PATCH_SKIPPED: 补丁目标不可用 (%s: %s)",
                    type(exc).__name__, str(exc)[:160])
        return False

    def is_custom_provider(name):
        if (name or "").lower() == FUYAO:
            return snapshots_ready()
        return orig_is(name)

    def get_provider(name):
        if (name or "").lower() == FUYAO:
            # 恒返回只读实例；实例内部按快照可用性抛 FuyaoError，
            # 上游能 catch 并走 fallback_prev，不会变成 500。
            return _PROVIDER
        return orig_get(name)  # 交回 source_policy 的 local_quant 单源策略

    custom_sources.is_custom_provider = is_custom_provider
    custom_sources.get_provider = get_provider
    custom_loader.is_custom_provider = is_custom_provider
    custom_loader.get_provider = get_provider

    setattr(socket, _INSTALLED_FLAG, True)
    log.warning(
        "FUYAO_RECAP_ACTIVE: fuyao 只读本地快照已装载（root=%s, ready=%s）；"
        "零外联与 local_quant 单源策略不变",
        _root(), snapshots_ready(),
    )
    return True
