# TSP 本地运维 · 阶段2 全量交接文档

> 生成时间：2026-11-04 22:00（GMT+8）
> 交接范围：自接手系统以来的全部运维优化与数据源增强工作
> 前置文档：`tasks/phase1-handover.md`（阶段1 接手 + 阶段2/3 细节记录）、`docs/data-inventory.md`（数据总览）、`docs/fuyao-offline.md`（离线增强方案）
> 访问入口：主面板 `http://127.0.0.1:3018/`｜本地数据源面板 `http://127.0.0.1:3018/local-sources`

---

## 0. 一句话状态

系统全绿运行：容器 healthy、桥接 healthy、主面板 200、`/local-sources` 200。三个用户可见问题（自选股重复、五档/财务缺失、板块空表/fuyao 报错）全部关闭；fuyao Key 已接入为宿主机侧离线增强源（不进容器、不改不变量）；板块页面已切换为同花顺官方分类。`pytest` 148 项全通过，`verify_sources.py` 8 项 PASS，容器内 `network_blocks.fuyao.aicubes.cn=true`。

---

## 1. 架构与不变量（未改动）

```
固定镜像 ghcr.io/shy3130/tick-stock-panel@sha256:c52e95144bac942243ebfc471bbbd7a62f28bf9289e6e512a820b2956410755d  (只读参考 upstream/)
   └─ 挂载 ./overrides        (只读, 来源政策/启动钩子/板块分类切换/本地扩展)
   └─ 挂载 ./plugins/local_quant (只读, 本地数据源 provider)
   └─ 挂载 ./data-local       (读写, 落盘数据)
        └─ 桥接 ./bridge      (宿主机进程, 适配 eltdx / 通达信本地文件 / free_stockdb / fuyao 离线只读)
```

| 不变量 | 状态 |
|---|---|
| 固定镜像 digest | 未改（`sha256:c52e...0755d`） |
| `upstream/` 源码 | 只读参考，未改 |
| 容器零外联白名单 | `fuyao.aicubes.cn`、`free-api.tickflow.org`、`1.1.1.1` 仍被阻断 |
| provider 锁定 | 仅 `local_quant` 注册，TickFlow fallback 禁止 |
| 能力矩阵 | 7 项 `usable=true / effective=local_quant`，`tickflow_tier=disabled` |
| fuyao provider | **未注册**、**未启用** `app/plugins/fuyao` |
| 所有修复落点 | `bridge/`、`plugins/local_quant/`、`overrides/`、`scripts/`、`tests/` |

---

## 2. 已完成工作汇总

按时间顺序分为 5 个子阶段，均已完成并验收。

### 2.1 自选股重复显示修复

| 项 | 内容 |
|---|---|
| 问题 | `/api/watchlist/enriched` 自选股重复显示 |
| 根因 | `kline_daily_enriched` 当日分区含重复 symbol（3391 行 / 1029 条重复），JOIN 放大行数 |
| 修复 | `scripts/repair_enriched_duplicates.py` 备份+原子重建为 2362 行 / 0 重复；`overrides/source_policy.py::install_enriched_integrity()` 读/写双路径 `unique(subset=['symbol'])` |
| 验收 | `watchlist/enriched` 稳定 2 行（`002474.SZ`、`001219.SZ`） |

### 2.2 五档盘口接入

| 项 | 内容 |
|---|---|
| 问题 | 上游无本地五档盘口数据 |
| 修复 | `bridge/live_sources.py` 新增 `_depth_event()`，调 `eltdx client.quotes.get_depth(codes)` 原生 0x0547；握手日期 + 逐标的 HHMMSS 构造 `event_time`；缺档/无时钟显式失败不补零；盘后 `stale=true` |
| 实测 | 600031.SH 买 18.69/18.68/18.67/18.66/18.65，卖 18.70…18.74 |
| 能力矩阵 | `depth5` `usable=true / effective=local_quant` |

### 2.3 财务观察层接入

| 项 | 内容 |
|---|---|
| 问题 | 财务无数据；§4.2(b)「eltdx 不提供财务」的旧结论被推翻 |
| 修复 | `bridge/finance.py`：`period_end` 取自本地 `gpcw*.dat/zip` 报告期头，最新命名快照取自 `eltdx.corporate.finance_batch`；`announce_date`/`ann_date` 恒 `None`，`pit_verified=false` |
| 批量限制 | `eltdx._RECOVERY_REQUESTS=32`，改 20 只分片 + 递归二分 + 缺失返回 `[]` |
| 限流韧性 | `TSP_BRIDGE_RATE_PER_MIN`（默认 600），provider 对 429 做 (1,2,4,8,16,20)s 退避重试 |
| 验收 | 5 表（metrics/income/balance_sheet/cash_flow/shares）各 ~43920 行 / 5490 只；`/api/financials/status` `available:true` |

### 2.4 板块 fuyao 报错与空表修复 + 伪 TDX 大类修复

| 项 | 内容 |
|---|---|
| 问题1 | 板块页 `拉取失败: 已配置鉴权但未找到凭据 fuyao_api_key`；概念/行业空表 |
| 根因 | `ext_presets.ensure_builtin_presets()` 启动时写回出厂 fuyao 配方（需 Key、域名被阻断） |
| 修复 | `overrides/local_extensions.py::install_local_presets()` 替换出厂配方为本地 boards 配置；`sync_boards()` 启动时自动补数 |
| 问题2 | 行业页出现伪 `TDX` 大类（截图反馈） |
| 根因 | 通达信分类以 `TDX/` 前缀混入申万字段，页面按 `/` 第一段聚合出伪大类 |
| 修复 | `builtin_rows()` 只发布 primary 分类，通达信移入 `local_tdx_*` 独立表 |
| 验收 | `ext_gn_ths` 5492 行、`ext_hy_ths` 5130 行，含 `TDX/` 行数 0；10 张扩展表全有数据 |

### 2.5 fuyao Key 离线增强（宿主机旁路）

| 项 | 内容 |
|---|---|
| 决策 | **不把 fuyao 设为主数据源**；宿主机侧离线导入，容器零外联不变 |
| Key 边界 | `runtime/fuyao.env`（0600，不挂载进容器，`.gitignore` 忽略）；刻意不写 `.env`、不写 `secrets.json` |
| 语义探活 | 4 只 × 3 表 × 8 期 = 96 行；`report_date_ms` **不是可验证 PIT 公告日**（历史期回填 389–479 天、16 键三表冲突） |
| 判定 | `REPORT_DATE_MS_IS_NOT_A_VERIFIED_PIT_DISCLOSURE_DATE`；PIT 继续关闭 |
| 财务产物 | 5,580 只零错误：income 44,640 / balance_sheet 44,639 / cash_flow 44,640 行；候选公告日 44,787 键 |
| 分类产物 | 概念 390 板块 / 70,601 成分；行业 320 板块 / 10,287 成分；零失败 |
| 容器接入 | `bridge/fuyao_offline.py::FuyaoStore` 只读本地 parquet；`bridge/router.py` 新增 `dataset='fuyao'`；`/status` 增加 `fuyao_offline` 与 `fuyao_pit` |
| 页面 | `/local-sources` 增加 fuyao 下拉项与「发布官方分类为独立表」按钮 |
| Key 安全 | 全仓（含 data-local、docs、tests、runtime 缓存）零泄漏 |

### 2.6 板块页面切换为同花顺官方分类（本轮最新）

| 项 | 内容 |
|---|---|
| 用户请求 | 板块页面改用同花顺官方分类 |
| 根因分析 | `market_overview_builder._dimension_field` 按字段名模糊匹配「概念/行业」，官方表发布后 6 张表同时进入维度聚合（本地 4 + 官方 2），概念 1095 / 行业 499 为混合值 |
| 修复 | 新增 `overrides/board_taxonomy.py`：config-id 白名单替换 `_dimension_field`，每维只聚合一张表 |
| 开关 | `TSP_BOARD_TAXONOMY=official|local`（默认 `official`）；官方表不完整时 fail-closed 回退 `local` |
| 启动钩子 | `overrides/bootstrap.py` 在 `app.main` 导入前调用 `install_board_taxonomy()`，使 `rps_rotation` 的 `from ... import _dimension_field` 绑定拾取白名单 |
| 每日管道 | `sync_boards()` 的硬编码 `monitor_ext_fields` 改为 `bt.monitor_ext_fields(active_taxonomy())`，防止重启/盘后管道把配置改回本地出厂表 |
| 监控配置 | `preferences.json` 的 `monitor_ext_fields` 已切换为 `fuyao_ths_concept.所属概念` / `fuyao_ths_industry.所属同花顺行业` |
| 实测 | 概念 390 个、行业 310 个，无任何本地前缀（申万/TDX/通达信）或 `/` 残留 |
| 出厂表保留 | `ext_gn_ths` 5492 行、`ext_hy_ths` 5130 行仍在，可随时回滚 |
| 回滚方法 | 设 `TSP_BOARD_TAXONOMY=local` 重启容器 |
| 回归 | `pytest` 148 项全通过（新增 `tests/test_board_taxonomy.py` 9 项） |

---

## 3. 当前数据状态总览

### 3.1 行情类

| 数据集 | 来源 | 状态 | 备注 |
|---|---|---|---|
| `daily` 日K | free_stockdb + tdx 合并 | ✅ | raw 价格基准，单位已校验 |
| `minute` 分钟K | free_stockdb(≥2025) + tdx 5min(≤2024) + 本地 parquet | ✅ | 1m/5m |
| `adj_factor` 复权 | free_stockdb 复权事件 | ✅ | mult 校验 |
| `realtime` 实时 | eltdx `market_snapshot` | ✅（交易时段） | 盘后 `stale=True` 为预期 |
| `depth5` 五档盘口 | eltdx `quotes.get_depth` 原生 0x0547 | ✅ | 买/卖各 5 档齐全 |
| ETF 实时快照 | — | ❌ 未接入 | 已知限制 |

### 3.2 财务类

| 表 | 来源 | 行数 / 标的 | 状态 |
|---|---|---|---|
| `metrics` / `income` / `balance_sheet` / `cash_flow` / `shares` | gpcw 报告期 + eltdx 快照 | ~43920 / 5490 | ✅ 观察层，`announce_date` 空 |
| fuyao 官方 `income` / `balance_sheet` / `cash_flow` | 宿主机离线导入 | 44640/44639/44640 / 5580 | ✅ 独立表，canonical 列名沿用上游（映射未验证） |
| fuyao 候选公告日 | 三表日期交叉校验 | 44787 键 | ⚠️ 候选 16716 / 冲突 22149 / 回填疑似 5900，非 PIT |
| **PIT 三表 / 公告日** | — | — | ❌ 未开放（`announce_date=None`） |

### 3.3 板块 / 概念 / 行业类

| 表 | 内容 | 行数 | 板块页当前 | 备注 |
|---|---|---|---|---|
| `fuyao_ths_concept` | 同花顺官方概念 | 5580 | **✅ 生效** | 390 板块 / 70601 成分 |
| `fuyao_ths_industry` | 同花顺官方行业 | 5578 | **✅ 生效** | 320 板块 / 10287 成分 |
| `ext_gn_ths` | free_stockdb 概念 | 5492 | 保留（回滚用） | 已去 TDX 污染 |
| `ext_hy_ths` | 申万一/二/三级 | 5130 | 保留（回滚用） | 已去 TDX 污染 |
| `local_tdx_concept` / `local_tdx_industry` | 通达信分类 | 5382 / 5506 | 不参与聚合 | 独立 timeseries 表 |
| `local_concepts` / `local_industries` | 本地快照 | 5492 / 5130 | 不参与聚合 | 归属证据 |

### 3.4 其他

| 数据 | 状态 | 备注 |
|---|---|---|
| 自选股 | ✅ 2 只 | 修复重复显示；enriched 按 symbol 去重 |
| 能力矩阵 | ✅ 7 项 `usable=true` | 含 `depth5`、`financial` |
| 监控配置 | ✅ 已切官方分类 | `monitor_ext_fields` → `fuyao_ths_*` |
| 历史主线 | ⚠️ 10977 行 | `2025-11-05..2026-11-03`，仍为旧分类口径（见 §5 待办） |

---

## 4. 实现文件清单

| 文件 | 子阶段 | 作用 |
|---|---|---|
| `overrides/source_policy.py` | 2.1/2.4 | 网络白名单、provider 锁定、enriched 去重、本地 presets hook |
| `overrides/bootstrap.py` | 2.1–2.6 | 启动入口：policy → board_taxonomy → app.main → enriched_integrity → source_panel → daily_pipeline |
| `overrides/local_extensions.py` | 2.4/2.5/2.6 | boards 转 ext_data、官方分类表发布、`sync_boards()` 按 taxonomy 写 monitor_ext_fields |
| `overrides/board_taxonomy.py`（新） | 2.6 | 白名单切换：`OFFICIAL_IDS` / `LOCAL_IDS` / `TAXONOMY_IDS`；fail-closed 回退；缓存清理 |
| `overrides/source_panel.py` | 2.2–2.5 | `/local-sources` 页面：depth5 下拉、财务表下拉、fuyao 下拉、发布按钮 |
| `bridge/live_sources.py` | 2.2 | eltdx 五档 `_depth_event()` |
| `bridge/finance.py` | 2.3/2.5 | 财务观察层 + fuyao 交叉标注列 |
| `bridge/fuyao_offline.py`（新） | 2.5 | Key 读取、REST 客户端、日期分类、三表标准化、候选日交叉校验、只读 `FuyaoStore` |
| `bridge/router.py` | 2.3/2.5 | dataset 路由：`financial` / `fuyao` |
| `bridge/server.py` | 2.3/2.5 | `Query` 模型、限流、`/status` 的 `fuyao_offline` / `fuyao_pit` |
| `plugins/local_quant/` | 2.2/2.3 | `plugin.yaml` + provider：`depth5` / `financial` 能力声明 |
| `scripts/repair_enriched_duplicates.py` | 2.1 | enriched 去重修复脚本 |
| `scripts/import_fuyao.py`（新） | 2.5 | `--probe` / `--boards` / `--financial` / `--all`；断点续跑、原子写 |
| `scripts/verify_sources.py` | 全量 | 有界真实数据源检查（8 项） |
| `scripts/verify_tsp.py` | 全量 | 容器内端到端验收（含 fuyao 阻断断言） |
| `tests/test_board_taxonomy.py`（新） | 2.6 | 白名单、fail-closed 回退、monitor_ext_fields、缓存清理、sync_boards 一致性 |
| `tests/test_fuyao_offline.py`（新） | 2.5 | Key 优先级、fail-closed、日期分类、三表冲突、交叉标注、metadata |
| `tests/test_local_extensions.py` | 2.4/2.5 | TDX primary-only、官方分类独立表、伪大类防护 |
| `tests/test_depth_financial.py` | 2.2/2.3 | 五档事件构造、财务观察层 |
| `tests/test_local_presets.py` | 2.4 | 启动钩子防 fuyao 配方复活 |
| `docs/data-inventory.md` | 全量 | 系统数据总览（已更新板块页切换状态） |
| `docs/fuyao-offline.md`（新） | 2.5 | fuyao 离线增强方案完整说明 |
| `runtime/fuyao.env`（新，0600） | 2.5 | fuyao Key 宿主机专用落点 |

---

## 5. 待办与已知限制（保持关闭）

### 5.1 本轮发现但未完成

| 项 | 说明 | 风险 |
|---|---|---|
| **历史主线口径不一致** | `data-local/mainline_history/part.parquet` 10977 行（`2025-11-05..2026-11-03`，671 个 member）仍为旧分类口径；接管复核发现 `MEMBERSHIP_NOTES` 此前是死代码，`/api/regime/mainline` 实际仍返回上游旧文案（原文「已切换为官方分类描述」为误记）。现已接入如实文案，历史数据**仍未重算、不得伪造** | 切换分类口径前后主线不可直接比较；早年存在归属漂移 |
| 离线产物无自动刷新 | `data-local/fuyao/` 需手动重跑 `scripts/import_fuyao.py` | 分类/财务快照逐渐过时 |

### 5.2 仍关闭（不得勾为完成）

- ETF 实时快照
- 单标的秒级行情时刻独立验证
- 盘中连续五档回放
- 完整财务三大报表 / 公告日 / 历史 PIT 财务因子（`announce_date` 恒空）
- 官方三表字段映射独立验证（`field_mapping_verified=false`）
- 板块成分历史版本（含官方分类，均无历史 PIT）
- `tasks/p0-p1-plan.md` 的 P0/P1 清单未获批准

### 5.3 fail-closed 语义（不得为「看起来可用」而违反）

- 五档 `stale=true`（盘后）是预期语义
- 财务 `announce_date=None`、`pit_verified=false` 是刻意关闭
- fuyao `report_date` 仅作候选公告日 + 质量标签，不写 `announce_date`
- 缺失数据显式报错，不补零、不静默回退

---

## 6. 回滚指南

### 6.1 板块分类回滚（官方 → 本地）

```bash
# 方法1：环境变量
echo 'TSP_BOARD_TAXONOMY=local' >> compose.yaml  # 或 docker run -e
docker compose -f compose.yaml restart app

# 方法2：删除官方表（强制 fail-closed 回退）
rm data-local/ext_data/fuyao_ths_concept/part.parquet
rm data-local/ext_data/fuyao_ths_industry/part.parquet
docker compose -f compose.yaml restart app
# 启动日志会显示 BOARD_TAXONOMY_ACTIVE: local
```

出厂表 `ext_gn_ths`（5492 行）、`ext_hy_ths`（5130 行）始终保留，回滚后立即生效。

### 6.2 fuyao 离线增强移除

```bash
# 移除 Key
rm runtime/fuyao.env
# 移除导入产物（不影响容器运行）
rm -rf data-local/fuyao/
rm -rf runtime/fuyao-cache/
# 移除官方分类表（板块页会自动回退本地分类）
rm -rf data-local/ext_data/fuyao_ths_concept/
rm -rf data-local/ext_data/fuyao_ths_industry/
docker compose -f compose.yaml restart app
```

容器不受影响——fuyao 从未注册为 provider，从未进入容器网络白名单。

---

## 7. 验收命令（交接后可直接执行）

```bash
cd /Users/beryllewis/private/stock/codex/TSP

# 服务健康
docker compose ps                          # tsp-local Up (healthy)
.venv/bin/python scripts/manage.py status  # healthy
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3018/
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3018/local-sources

# 全量回归
.venv/bin/python -m pytest tests -q --basetemp="/tmp/tsp-pytest-$(date +%s%N)"
# 预期：148 passed

# 有界真实数据源
.venv/bin/python scripts/verify_sources.py
# 预期：daily/minute/adj_factor/financial/export_daily/boards/eltdx/axdata 8 项 PASS

# 容器内端到端（fuyao 域名必须仍被阻断）
docker exec -i -w /app tsp-local /app/.venv/bin/python - < scripts/verify_tsp.py
# 预期：network_blocks.fuyao.aicubes.cn=true

# 启动钩子日志
docker compose logs --since 5m app 2>&1 | grep -E 'BOARD_TAXONOMY|SOURCE_POLICY|LOCAL_PRESETS|ENRICHED_INTEGRITY'
# 预期：BOARD_TAXONOMY_ACTIVE: official

# 板块页实际输出
curl -s 'http://127.0.0.1:3018/api/rps/rotation?kind=concept&days=7' | head -c 500
curl -s 'http://127.0.0.1:3018/api/rps/rotation?kind=industry&days=7' | head -c 500
# 预期：概念 390 个、行业 310 个，无申万/TDX/通达信前缀

# 监控配置
.venv/bin/python -c "import json,pathlib; print(json.dumps(json.loads(pathlib.Path('data-local/user_data/preferences.json').read_text()).get('monitor_ext_fields'),ensure_ascii=False))"
# 预期：concept -> fuyao_ths_concept.所属概念, industry -> fuyao_ths_industry.所属同花顺行业

# 统一只读体检（推荐：不变量 / 密钥值比对 / PIT / 产物新鲜度 / 日志磁盘 / 服务）
.venv/bin/python scripts/doctor.py
.venv/bin/python scripts/doctor.py --json        # 结构化输出；--strict 让 WARN 也返回非 0

# 审计日志归档（默认 dry-run，超过 16MB 才需要）
.venv/bin/python scripts/rotate_logs.py
.venv/bin/python scripts/rotate_logs.py --apply

# Key 文件权限（不回显 Key 值）
ls -la runtime/fuyao.env  # 权限 -rw------- (0600)
# 注意：不要用 `grep -r 'FUYAO_API_KEY' ... | wc -l` 判断泄漏——代码/文档里的
# 变量名引用会产生误报（实测 7 处引用、0 处真实值）。doctor.py 用真实 Key 值精确比对。
```

---

## 8. 关键决策记录

| 决策 | 理由 |
|---|---|
| 不把 fuyao 设为主数据源 | 容器零外联是核心安全不变量；fuyao 需 Key 且域名需放行，破坏面太大 |
| Key 只放宿主机 `runtime/fuyao.env` | `.env` 是 compose `env_file` 会注入容器；`secrets.json` 挂载进容器；`runtime/` 不挂载且 `.gitignore` 忽略 |
| `report_date_ms` 不写 `announce_date` | 96 行探活显示历史期按季度回填（389–479 天）、16 键三表冲突；上游 provider 的直接映射不成立 |
| 官方分类发独立表不覆盖内置表 | `sync_boards()` 每日整表替换，覆盖会丢数据；独立表可随时发布/撤回 |
| 板块切换用白名单而非改配置 | `_dimension_field` 按字段名模糊匹配，多表同时进入聚合；只有 config-id 白名单能精确选一张表 |
| `sync_boards()` 不再硬编码 monitor_ext_fields | 每日管道的 `preferences.save()` 会覆盖手动改动；必须配套改 |
| fail-closed 回退而非空表 | 官方导入不完整时回退 `local`，不显示空或半成品官方列表 |
| 出厂表保留不删 | 回滚成本为零；不影响页面（白名单已排除） |

---

## 9. 文档索引

| 文档 | 内容 |
|---|---|
| **本文** | 全量阶段2交接（自选股→五档→财务→板块→fuyao→官方分类切换） |
| `tasks/phase1-handover.md` | 阶段1 接手 + §9 阶段2 细节 + §10 阶段3 fuyao 细节 |
| `docs/data-inventory.md` | 系统全部数据情况总览（已更新板块切换状态） |
| `docs/fuyao-offline.md` | fuyao 离线增强方案、Key 边界、语义探活、导入命令 |
| `tasks/todo.md` | 历史任务收口记录 |
| `tasks/fuyao-probe.json` | `report_date_ms` 语义探活证据（96 行） |
| `.workbuddy-ai/memory/2026-11-04.md` | 工作日志 |

---

*交接时间：2026-11-04 22:00（GMT+8）。系统运行中，可直接验收。*

---

## 10. 阶段3 接管基线（2026-11-04 晚间）

### 10.1 复核结论

按 §7 逐条复跑交接验收：容器 `tsp-local` healthy、桥接 7818 healthy、主面板与 `/local-sources` 200；`pytest` 148 项通过；`verify_sources.py` 8 项 PASS；容器内 `verify_tsp.py` 三个域名全部阻断（含 `network_blocks.fuyao.aicubes.cn=true`）；能力矩阵 7 项 `usable=true / effective=local_quant`、`tickflow_tier=disabled`；官方分类概念 389 / 行业 310、无本地前缀残留；`watchlist/enriched` 2 行；`preferences.json` 重启前后 hash 一致。**交接文档状态属实，系统可直接接管。**

### 10.2 本轮修复（5 项，均不改上游、不改取数逻辑）

| 项 | 事实 | 处置 |
|---|---|---|
| 设置页保存 500 | 日志 13:40:27Z：`PUT /api/settings/preferences/data-providers` 因上游把 provider 默认值写回，`validate_preferences` 抛 `SourcePolicyError` 未捕获 → 500 | `overrides/source_policy.py::coerce_preferences()` 把非法 provider 字段纠正回 `local_quant` 并 warning，严格校验函数保留；重启后同请求返回 200，7 项仍 `local_quant`，近 5 分钟日志零 500 |
| 主线口径文案失实 | `MEMBERSHIP_NOTES` 定义后从未被调用，API 仍返回上游旧文案；§5.1 曾误称「已切换为官方分类描述」 | `overrides/board_taxonomy.py::install_membership_note()` + `overrides/bootstrap.py` 在 `app.main` 之后 patch 模块常量；文案如实声明历史按当时口径生成、未回补、切换前后不可直接比较。API 实测生效 |
| 密钥验收命令误判 | `grep -r 'FUYAO_API_KEY' ... \| wc -l` 实际命中 7 处**变量名引用**（非零即误报）；以真实 Key 值精确比对全仓为 **0 处泄漏** | §7 改用 `scripts/doctor.py` 精确值比对（不回显 Key） |
| 无统一体检 / 日志无轮转 | `runtime/source-audit.jsonl` 12.5MB 持续追加、桥接日志持有 fd、验收散落 8 条手工命令 | 新增 `scripts/doctor.py`（15 项只读检查）与 `scripts/rotate_logs.py`（默认 dry-run、原子改名、gzip 保留证据、可选 `--prune`）；`README.local.md` 登记用法 |
| **看板总览仍是混合分类** | `app/api/overview.py` **独立定义** `_dimension_field`，原白名单只 patch `market_overview_builder`；`/api/overview/market` 的 `concept_rank` / `industry_rank` 同时聚合 4 张表（本地 3 + 官方 1） | `overrides/board_taxonomy.py::install_board_taxonomy_bindings()` 在 `app.main` 之后补齐所有已加载维度解析器（幂等 + 清缓存）；重启日志 `BOARD_TAXONOMY_BINDINGS_ACTIVE: app.api.overview (official)`，容器内实测选中表仅 `fuyao_ths_concept` / `fuyao_ths_industry`，看板排名 5/5 命中官方 catalog |

### 10.3 接管后验收

- `pytest` **173 项全通过**（原 148 + 新增 25：`tests/test_doctor.py`、`tests/test_rotate_logs.py`、来源策略与主线文案回归、看板总览白名单回归）。
- `scripts/doctor.py` **14 PASS / 1 WARN / 0 FAIL**；唯一 WARN 是 `mainline_history` 的设计性提示（历史未重算），不是故障。
- 重启容器后：`BOARD_TAXONOMY_ACTIVE: official`、`BOARD_TAXONOMY_BINDINGS_ACTIVE: app.api.overview (official)`、`SOURCE_POLICY_ACTIVE`、`LOCAL_PRESETS_ACTIVE`、`ENRICHED_INTEGRITY_ACTIVE` 五条钩子齐全；`verify_sources.py` 8 PASS、`verify_tsp.py` 阻断断言仍为 true、板块/自选股/能力矩阵复验通过。
- 不变量全未变：固定镜像 digest、`upstream/` 只读、容器零外联白名单、provider 锁定、能力矩阵、`announce_date=None` / `pit_verified=false`、Key 仅宿主机 0600 且不进容器挂载清单。

### 10.4 待用户决策（未擅自执行）

1. **上游版本滞后**：GHCR 已发布 `v0.3.29` 与 `latest=a75af0e`（2026-11-04），本地固定 `v0.3.27` digest。固定镜像是核心不变量，升级需先备份、重验插件契约/单位/测试，未获批准不执行。
2. **离线产物自动刷新、桥接进程守护/自启**：文档明确不修改 macOS 登录启动项；当前仅提供 `doctor.py` 新鲜度告警 + 手动 `import_fuyao.py --all` 与 `rotate_logs.py`。
3. **历史主线重算**：需历史成分版本（PIT 证据缺失），按 fail-closed 不得伪造，保持关闭。
4. §5.2 全部限制项与 `tasks/p0-p1-plan.md` 的 P0/P1 清单继续关闭，不勾完成。

### 10.5 日常运维入口

```bash
.venv/bin/python scripts/doctor.py                   # 体检；异常时看 evidence
.venv/bin/python scripts/doctor.py --strict --json   # 巡检 / CI 用
.venv/bin/python scripts/rotate_logs.py --apply      # 仅当体检提示审计日志超 16MB
.venv/bin/python scripts/import_fuyao.py --all       # 仅当体检提示离线产物过期
```

*接管时间：2026-11-04 晚间（GMT+8）。系统运行中，全部验收通过。*

---

## 11. 盘后管道故障处置（2026-11-04 23:30 GMT+8）

### 11.1 现象与根因

用户反馈看板大量数值为 0、指数涨跌幅为 "-"。实测 `/api/overview/market`：
`breadth=0/2362/0`、涨跌分布 100% 落在 `0~1%`、`top_gainers==top_losers`、
`indices[].change_pct=null`、`quote_status.final_sync_failed=fetch_failed`。

1. 11-04 收盘最终同步与定时盘后管道失败（15:35 桥接进程曾报 `ModuleNotFoundError: bridge.live_sources`，重启后恢复；09:07/09:15 另两次为 `did not find column adjust`），当日 `kline_daily/date=2026-11-04` 停留在盘中快照：**2362 行、9 列、无 `pre_close`/`change_pct`**；历史 11-03 分区则有 5482 行且带这两个字段。
2. 上游看板的涨跌家数/分布/封板率/领涨领跌/概念行业热度/指数涨跌幅都以 `change_pct` 为共同输入，缺失即全 0 或 null；全 0 排序取首条，故所有板块领涨股都是 `000001.SZ` 平安银行。成交额、换手、均线占比、情绪雷达等不依赖涨跌幅，因此仍有数值。
3. 重跑管道仍失败：`bridge/router.py::needs_refresh()` 要求**每个**请求标的本地最新日期 ≥ 今天，盘后全市场停牌/无当日成交的标的必然不满足 → 触发 `live.daily()`，而盘后实时源为空 → `SourceUnavailable` → 整条管道中断。
4. 指数 "-" 另有独立原因：`pipeline_pull_index=false` 使 `kline_index_daily` 只有实时写入的当日分区，`_index_quotes` 需要前一日收盘价才能算涨跌幅。

### 11.2 处置（不变量全未动）

| 动作 | 内容 |
|---|---|
| 备份 | `runtime/backup-pre-pipeline-20261104-233206/`（完整 `data-local` 416MB，可作回滚点） |
| 桥接修复 | `bridge/router.py` 新增 `after_hours_local_daily()`：收盘后本地日线已覆盖当日时跳过实时刷新，metadata 留 `latest_refresh=SKIPPED_AFTER_HOURS_LOCAL_DAILY_COVERS_SESSION`；盘中、本地无当日观测、minute 路径仍按原逻辑 fail-closed。含「当日无观测标的」的 `require_latest` 请求实测 200 且只返回 `free_stockdb` |
| 重跑管道 | `POST /api/pipeline/run` → job `8e9325d71a` **succeeded**（81 秒）。当日分区变 5496 行并含 `pre_close`/`change_pct`；`breadth=2611/454/2431`、`avg_pct=2.09%`、涨停 117 / 封板率 81.8% / 3 板梯队、概念与行业热度恢复真实涨幅 |
| 指数补齐 | `scripts/backfill_index_daily.py`（默认 dry-run、幂等、不覆盖已有分区、仅本地 `tdx_local_day`）回填 19 个交易日；指数涨跌幅恢复（上证 +2.16%、深成 +4.22%、创业板 +6.40%、科创综指 +9.90%） |
| 体检 | `scripts/doctor.py` 新增 `index_daily_history` 检查（交易日分区不足 2 个即 WARN） |

### 11.3 验收与残余

- `pytest` **181 项通过**；`doctor.py` **15 PASS / 1 WARN / 0 FAIL**（唯一 WARN 仍是历史主线口径提示）；`verify_sources.py` 8 PASS（eltdx 曾有一次瞬时失败、重跑即恢复，`retries=1` 对盘后 TDX 偏敏感）；`verify_tsp.py` 三域名阻断仍为 true；容器与桥接 healthy。
- `mainline_history` 与备份逐项一致（9435 行 / 241 天 / 494 member / 无重复键），管道重算未丢历史。
- `skipped_stages=["sync_index","sync_minute","regime","mainline"]` 是偏好开关（`pipeline_pull_index=false`、`pipeline_regime_enabled=false`）刻意关闭，未擅自打开；主线仍停在 11-03，符合 §5.1 的 fail-closed 约束。
- `quote_status.symbol_count=0` / `final_sync_failed` 是盘后休市态与当日失败的历史标记，不影响已落盘日K与看板聚合。
