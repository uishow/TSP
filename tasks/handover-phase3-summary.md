# TSP 本地系统 阶段3 交接文档（工作暂停快照）

*交接时间：2026-11-05 08:05（GMT+8，盘前）。工作按用户要求暂停，系统运行中、验收通过。*
*阶段3 唯一入口。前置文档：`tasks/phase1-handover.md`、`tasks/handover-phase2-summary.md`（其 §10 为接管基线、§11 为盘后管道故障处置的原始记录）。*
*最后一次系统侧写操作：2026-11-04 23:42 台账更新。此后除生成本交接文档外，未改动任何代码、配置或数据。*

---

## 0. 摘要（先看这里）

阶段3 从「全面接手系统运维优化」开始，完成了 **7 项代码/工具修复 + 1 次盘后管道故障处置**，并做了两次容器重启与一次桥接重启。当前状态：

- 服务全绿：`tsp-local` healthy、面板 3018 / 桥接 7818 均 200。
- 回归 `181 passed`；`doctor.py` **15 PASS / 1 WARN / 0 FAIL**；`verify_sources.py` 8 项 PASS；`verify_tsp.py` 三个外联域名全部阻断。
- 11-04 盘后管道 job `8e9325d71a` **succeeded**；当日日K 5496 行完整、涨跌幅/涨停梯队/板块热度/指数涨跌幅全部恢复。
- **固定不变量一条未动**：镜像 digest、`upstream/` 只读、容器零外联、provider 锁定、能力矩阵、PIT 关闭、Key 仅宿主机、官方分类白名单。

三条红线：① 不改 `upstream/` 与固定镜像 digest；② 不放开容器外网、不填 vendor Key、不零填充数据；③ 历史主线不得伪造重算（缺历史成分版本）。

恢复工作时**第一步只跑 `scripts/doctor.py`**（只读），不要直接改数据。

---

## 1. 系统与固定不变量

### 1.1 部署拓扑

| 层 | 位置 | 说明 |
|---|---|---|
| 应用容器 | `ghcr.io/shy3130/tick-stock-panel@sha256:c52e95144bac942243ebfc471bbbd7a62f28bf9289e6e512a820b2956410755d` | `127.0.0.1:3018`，`pull_policy: never`，`compose.yaml` 固定 digest |
| Python 覆盖层 | `overrides/`（`:ro` 挂载，PYTHONPATH 优先） | `sitecustomize.py` → `source_policy` / `local_presets` / `bootstrap`（`board_taxonomy` + `enriched_integrity`） |
| 宿主机只读桥接 | `bridge/`，`.venv/bin/python -m uvicorn bridge.server:app --port 7818` | `127.0.0.1:7818`，`scripts/manage.py start|stop|status`；容器内通过 `host.docker.internal` 访问 |
| 数据源 | `free_stockdb` / `tdx_local_day` / `eltdx` / `axdata` / fuyao 离线 parquet | 全部经桥接；容器本身无外网socket |
| 数据根目录 | `data-local/`（416MB） | 日K/enriched/财务/扩展表/离线产物/偏好/任务记录 |
| 运行态 | `runtime/`（gitignore） | `fuyao.env`（0600，仅宿主机）、`bridge.pid`、`bridge.log`、`source-audit.jsonl`、`backup-pre-pipeline-*/` |

### 1.2 固定不变量（阶段3 复核后仍全部成立）

| # | 不变量 | 复核方式 |
|---|---|---|
| 1 | 镜像固定 v0.3.27 digest、`pull_policy: never` | `doctor.py::check_compose` |
| 2 | `upstream/` 只读参考，不改上游源码 | 人工 + 文件 mtime |
| 3 | 容器零外联（白名单仅本机/桥接），三域名 blocked | `verify_tsp.py` |
| 4 | provider 锁定 `local_quant`，能力矩阵 7 项 `usable=true / effective=local_quant`，`tickflow_tier=disabled` | `doctor.py::check_matrix` + `/api/settings/capability-matrix` |
| 5 | 板块白名单：概念仅 `fuyao_ths_concept`、行业仅 `fuyao_ths_industry`，出厂本地表仅作回滚 | `overrides/board_taxonomy.py`，`BOARD_TAXONOMY_ACTIVE: official` |
| 6 | PIT 关闭：`announce_date=None`、`pit_verified=false`、`field_mapping_verified=false` | `doctor.py::check_financial_pit` + `manifest.json` |
| 7 | Key 边界：真实 Key 值全仓 0 泄漏、`.env`/`runtime/fuyao.env` 0600、`runtime/` 不挂载进容器 | `doctor.py::check_credentials`（**精确值比对，不回显**） |
| 8 | 离线产物 PIT 关闭、`report_date` 非公告日 | `doctor.py::check_offline` |
| 9 | fail-closed：缺数据报错/null，不零填充、不网络回退 | 桥接 metadata `missing_values='null; never zero-filled'` |
| 10 | 偏好开关 `pipeline_pull_index=false`、`pipeline_regime_enabled=false` 保持用户既有配置 | 本阶段未改动偏好 |

### 1.3 关键目录

`bridge/`、`overrides/`、`scripts/`、`tests/`、`plugins/local_quant/`、`upstream/`（只读参考）、`docs/`、`tasks/`、`data-local/`、`runtime/`。

---

## 2. 阶段3 工作清单

### 2.1 接管基线修复（5 项）

| # | 问题（事实） | 处置 | 关键文件 |
|---|---|---|---|
| 1 | `PUT /api/settings/preferences/data-providers` 因上游把 provider 默认值写回、`validate_preferences` 抛未捕获异常 → 500 | 新增 `coerce_preferences()`：非法 provider 字段纠正回 `local_quant` 并 warning，严格校验函数保留；重启后同请求 200、7 项仍锁定 | `overrides/source_policy.py` |
| 2 | `MEMBERSHIP_NOTES` 是死代码，`/api/regime/mainline` 仍返回上游旧文案，且旧台账误称「已切换为官方分类描述」 | 新增 `install_membership_note()`，在 `app.main` 之后 patch 模块常量；文案如实说明历史按当时口径生成、未回补、切换前后不可直接比较 | `overrides/board_taxonomy.py`、`overrides/bootstrap.py` |
| 3 | 旧验收命令 `grep -r 'FUYAO_API_KEY' ... \| wc -l # 预期 0` 实际命中 7 处**变量名引用**（误报）；真实 Key 值精确比对为 **0 泄漏** | `doctor.py::check_credentials` 用真实值比对，只输出文件名/布尔，不回显 | `scripts/doctor.py`、phase2 §7 |
| 4 | 验收散落 8 条手工命令；`runtime/source-audit.jsonl` 12.5MB 持续追加且无轮转 | 新增 `scripts/doctor.py`（16 项只读检查）与 `scripts/rotate_logs.py`（默认 dry-run、原子改名、gzip 保留证据、可选 `--prune`） | 见 §4 |
| 5 | `app/api/overview.py` **独立定义** `_dimension_field`，原白名单只 patch `market_overview_builder`；看板总览 `concept_rank`/`industry_rank` 混合本地+官方表 | 新增 `install_board_taxonomy_bindings()`，在 `app.main` 之后幂等补齐所有已加载维度解析器并清缓存 | `overrides/board_taxonomy.py`、`overrides/bootstrap.py` |

### 2.2 盘后管道故障处置（2026-11-04 晚间）

| # | 问题（事实） | 处置 |
|---|---|---|
| 6 | 11-04 盘后管道失败（15:35 桥接进程曾报 `ModuleNotFoundError: bridge.live_sources`，重启后恢复；09:07/09:15 两次 `did not find column adjust`），当日分区停留盘中快照 2362 行/9 列、无 `pre_close`/`change_pct` → 全站涨跌幅类指标为 0、指数 "-" | 备份 → 重跑管道 → 数据恢复，详见 §2.3 |
| 7 | 重跑仍失败：`needs_refresh()` 要求**每个**请求标的本地最新日期 ≥ 今天，盘后停牌股必然不满足 → 触发 `live.daily()`，实时源盘后为空 → `SourceUnavailable` 中断管道 | `bridge/router.py` 新增 `after_hours_local_daily()`：收盘后本地日线已覆盖当日时跳过实时刷新，metadata 留 `latest_refresh=SKIPPED_AFTER_HOURS_LOCAL_DAILY_COVERS_SESSION`；盘中、本地缺当日观测、minute 路径仍 fail-closed |
| 8 | 指数 "-" 另有独立原因：`pipeline_pull_index=false` 使 `kline_index_daily` 只有当日实时分区，`_index_quotes` 需要前一日收盘价 | 新增 `scripts/backfill_index_daily.py`（本地 `tdx_local_day`、默认 dry-run、幂等、不覆盖已有分区），回填 19 个交易日；`doctor.py` 新增 `index_daily_history` 检查 |

### 2.3 故障处置执行记录

1. 备份完整 `data-local` → `runtime/backup-pre-pipeline-20261104-233206/`（416MB，回滚点）。
2. 修 `bridge/router.py` → `pytest` 177 通过 → `.venv/bin/python scripts/manage.py stop && start` 重启桥接 → 含「当日无观测标的」的 `require_latest` 请求实测 200、只返回 `free_stockdb`。
3. 触发 `POST /api/pipeline/run` → job `8e9325d71a` **succeeded**（81 秒，`finished_at=2026-11-04T15:37:08Z`）；`skipped_stages=["sync_index","sync_minute","regime","mainline"]`、`stage_errors=[]`。
4. 当日分区变 5496 行/13 列（含 `pre_close`/`change_pct`）；`breadth=2611/454/2431`、`avg_pct=2.09%`、涨停 117 / 封板率 81.8% / 3 板梯队；概念「科创次新股」+10.62%、行业「半导体设备」+15.88%。
5. 回填指数 19 个交易日 → 上证 +2.16%、深成 +4.22%、创业板 +6.40%、科创综指 +9.90%。
6. 核对 `mainline_history` 与备份逐项一致（9435 行 / 241 天 / 494 member / 无重复键），**管道重算未丢历史**。

---

## 3. 当前状态快照（2026-11-05 08:02 CST，盘前）

| 项 | 值 |
|---|---|
| 容器 | `tsp-local` healthy，`Up 9 hours`，`127.0.0.1:3018` |
| 面板 / 桥接 | `/health` 均 200 |
| `doctor.py` | **15 PASS / 1 WARN / 0 FAIL**；唯一 WARN = `mainline_history` 设计性提示 |
| `pytest` | **181 passed**（最近一次 11-04 23:4x；演进 148 → 171 → 173 → 177 → 181，阶段3 共 +33 项） |
| `verify_sources.py` | 8 项 PASS（daily/minute/adj_factor/financial/export_daily/boards/eltdx/axdata） |
| `verify_tsp.py` | `network_blocks`: `free-api.tickflow.org` / `fuyao.aicubes.cn` / `1.1.1.1` 均 true |
| `kline_daily/date=2026-11-04` | 5496 行、13 列、含 `change_pct` |
| `kline_daily_enriched/date=2026-11-04` | 8881 行、15 列（多日窗口，正常） |
| `kline_index_daily` | 20 个交易日分区，最新 `date=2026-11-04` |
| `mainline_history` | 9435 行，`2025-11-05..2026-11-03`（主线未纳 11-04，见 §6.4） |
| 离线产物 | `imported_at=2026-11-04T21:16:19+08:00`，boards/financial complete、PIT closed |
| 最后管道任务 | `8e9325d71a` succeeded / done |
| 备份 | `runtime/backup-pre-pipeline-20261104-233206/`（416MB） |
| 启动钩子 | `BOARD_TAXONOMY_ACTIVE: official`、`BOARD_TAXONOMY_BINDINGS_ACTIVE: app.api.overview (official)`、`SOURCE_POLICY_ACTIVE`、`LOCAL_PRESETS_ACTIVE`、`ENRICHED_INTEGRITY_ACTIVE` |

> 11-05 为交易日、当前盘前：日K 最新 11-04 属正常。**盘后管道只能在收盘后跑**（见 §7.4），盘前/盘中重跑会因 fail-closed 拒绝，这不是故障。

---

## 4. 本阶段改动文件清单

| 路径 | 类型 | 作用 | 回归 |
|---|---|---|---|
| `overrides/source_policy.py` | 修改 | `coerce_preferences()`，修复设置页保存 500 | `tests/test_source_policy.py` |
| `overrides/board_taxonomy.py` | 修改 | `install_membership_note()`、`install_board_taxonomy_bindings()`、`_tsp_board_whitelist` 标记、口径文案 | `tests/test_board_taxonomy.py` |
| `overrides/bootstrap.py` | 修改 | 在 `app.main` 之后安装主线文案与看板白名单绑定 | 容器内启动钩子日志 |
| `bridge/router.py` | 修改 | `after_hours_local_daily()` + 盘后跳过空实时刷新 + metadata `latest_refresh` | `tests/test_routing.py` |
| `scripts/doctor.py` | 新增 | 16 项只读体检（不变量/密钥/PIT/官方表/离线新鲜度/指数分区/日志磁盘/服务） | `tests/test_doctor.py` |
| `scripts/rotate_logs.py` | 新增 | 审计日志原子轮转、gzip 保留证据、默认 dry-run | `tests/test_rotate_logs.py` |
| `scripts/backfill_index_daily.py` | 新增 | 本地指数日线历史回填、幂等 | `tests/test_backfill_index_daily.py` |
| `tests/test_doctor.py` / `test_rotate_logs.py` / `test_backfill_index_daily.py` | 新增 | 上述工具回归 | — |
| `tests/test_source_policy.py` / `test_board_taxonomy.py` / `test_routing.py` | 修改 | 覆盖新增行为 | — |
| `README.local.md` | 修改 | 登记体检/轮转/回填工具与盘后刷新语义 | — |
| `tasks/handover-phase2-summary.md` | 修改 | §7 修正验收命令、§10 接管基线、§11 故障处置、修正 §5.1 失实陈述 | — |
| `tasks/handover-phase3-summary.md` | 新增 | 本文档 | — |

**未改动**：`upstream/`、`compose.yaml`、`.env`、`runtime/fuyao.env`、`data-local/user_data/preferences.json`（hash 重启前后一致）、镜像 digest、容器网络白名单、`plugins/local_quant/`。

---

## 5. 验收与复现命令

```bash
cd /Users/beryllewis/private/stock/codex/TSP

# 1) 只读体检（第一件事，绝不写数据）
.venv/bin/python scripts/doctor.py
.venv/bin/python scripts/doctor.py --strict --json     # 巡检/CI；WARN 也会返回非 0

# 2) 回归
.venv/bin/python -m pytest tests -q --basetemp="/tmp/tsp-pytest-$(date +%s%N)"

# 3) 有界真实数据源验收（会覆盖写 tasks/actual-source-checks.json）
.venv/bin/python scripts/verify_sources.py

# 4) 容器内端到端 + 网络阻断（只读）
docker exec -i -w /app tsp-local /app/.venv/bin/python - < scripts/verify_tsp.py

# 5) 关键接口
curl -s http://127.0.0.1:3018/api/overview/market
curl -s http://127.0.0.1:3018/api/settings/capability-matrix
curl -s 'http://127.0.0.1:3018/api/regime/mainline?kind=concept&days=7'
curl -s 'http://127.0.0.1:3018/api/rps/rotation?kind=concept&days=7'

# 6) 运维工具（默认 dry-run，--apply 才写）
.venv/bin/python scripts/rotate_logs.py               # 审计日志 >16MB 时
.venv/bin/python scripts/rotate_logs.py --apply
.venv/bin/python scripts/backfill_index_daily.py      # 指数涨跌幅为 "-" 时
.venv/bin/python scripts/backfill_index_daily.py --apply
.venv/bin/python scripts/import_fuyao.py --all         # 离线产物过期时（需宿主机 Key）

# 7) 服务生命周期
.venv/bin/python scripts/manage.py status             # 桥接
.venv/bin/python scripts/manage.py stop && .venv/bin/python scripts/manage.py start
docker compose restart app                           # 覆盖层改动后必须重启才生效
curl -s -X POST http://127.0.0.1:3018/api/pipeline/run   # 仅收盘后；返回 job_id
curl -s http://127.0.0.1:3018/api/pipeline/jobs/<job_id>
```

> 密钥泄漏判断**不要**用 `grep -r 'FUYAO_API_KEY' ... | wc -l`（变量名引用会误报）；用 `doctor.py` 的真实值精确比对。

---

## 6. 未完成 / 待决策 / 明确关闭

### 6.1 待用户批准（未执行）

1. **上游版本滞后**：GHCR 已发布 `v0.3.29` 与 `latest=a75af0e`（2026-11-04），本地固定 v0.3.27 digest。升级需备份 + 重验插件契约/单位/测试，未获批准不动。
2. **离线产物自动定时刷新**：当前仅 `doctor.py` 新鲜度告警 + 手动 `import_fuyao.py --all`。
3. **桥接进程守护 / 开机自启**：文档明确不修改 macOS 登录启动项；本机重启后仍需 `./scripts/start-local.sh`。
4. **历史主线重算**：需历史成分版本（PIT 证据缺失），fail-closed 不得伪造。

### 6.2 P0/P1 全量清单（未获批准、未执行）

`tasks/p0-p1-plan.md` 的 **28 个原子项（A01–E05）全部 `[ ]`**：证据链/交易日历/新鲜度、实时质量门控、财务公告与 PIT、全史覆盖与跨资产、真实盘中窗口验收等；`tasks/todo.md:81/82/92` 同状态。

### 6.3 明确关闭、不得勾完成

ETF 实时快照；单标的秒级行情时刻独立验证；盘中连续五档回放；完整财务三大报表 / 法定公告日 / 历史 PIT 财务因子与回测；官方三表字段映射独立验证；板块成分历史版本（含官方分类）。五档盘后 `stale=true`、财务 `announce_date=None` 是刻意 fail-closed 语义，不是 bug。

### 6.4 已知告警 ≠ 故障

| 现象 | 解释 |
|---|---|
| `doctor.py` 的 1 个 WARN (`mainline_history`) | 历史主线仍为切换分类口径前生成、未重算；API 文案已如实标注 |
| `quote_status.symbol_count=0` / `final_sync_failed=fetch_failed` | 盘后休市态与 11-04 当日失败的历史标记，不影响已落盘日K |
| `skipped_stages=["sync_index","sync_minute","regime","mainline"]` | 偏好开关刻意关闭；`stage_errors=[]`，管道 succeeded |
| 主线历史停在 `2026-11-03` | `pipeline_regime_enabled=false` → `compute_mainline` 被 skip，属配置选择；与备份一致、无数据损坏 |
| `verify_sources.py` 的 eltdx 偶发瞬时 FAILED | `retries=1` 对盘后 TDX 偏敏感，重跑即 PASS；已连续两次全 PASS |
| 概念 389 / 行业 310 | 当日有成交的板块数，随行情变化；官方 catalog 为 390 / 320 |
| **盘前 `dataset=depth5` 返回 503** `TDX handshake lacks a consistent server date; refusing undated depth` | 2026-11-05 08:21 接管实测：握手 `server_datetime=2026-11-05 08:21:55`，但 `server_date_1/2=2026-11-04`（TDX 盘前尚未切换交易日字段）→ 日期不一致，`bridge/live_sources.py:301-303` 按设计拒绝无可靠日期的五档。**盘前/非交易时段的预期 fail-closed，不是代码缺陷**；开盘后 TDX 切换日期字段即自动恢复，无需改代码 |
| `data-local/depth5/` 目录为空 | 审计日志 3 条 depth5 记录 `stale_count == count`（全部为盘后陈旧快照），定版按 fail-closed 不写无效数据；与 §6.3「五档盘后 `stale=true`」一致，不是未接入 |
| 审计日志里 depth5「0 条有来源」的误判 | 记录用的是 `metadata.source`（单数），按 `metadata.sources`（复数）统计会误报为零；真实 3 条均有 `source=eltdx:quotes.get_depth`。排查统计口径先对齐字段名 |

### 6.5 文档台账待清理（非功能任务）

`tasks/todo.md:107–111` 的阶段2 问题 `[ ]` 实际已修复（历史快照未勾）；`docs/data-inventory.md` 回归数仍写 139（实际 181）、生成时间 19:30；`README.local.md` 保留 113/139 等旧数字。阶段3 已修正 phase2 §5.1、§7 的失实陈述，其余未动。

---

## 7. 回滚与应急

### 7.1 整体数据回滚

```bash
# 仅在确认需要整体回滚时执行；会用备份覆盖此后新增的数据
rsync -a --delete runtime/backup-pre-pipeline-20261104-233206/data-local/ data-local/
docker compose restart app
```

备份为 2026-11-04 23:32（管道重跑前）的完整 `data-local`；确认系统稳定数日后可删除该 416MB 目录。

### 7.2 分类口径回滚

按 `tasks/handover-phase2-summary.md` §6 执行：在 `compose.yaml` 的 `app.environment` 显式加 `TSP_BOARD_TAXONOMY=local`（当前未设置、默认 `official`）后 `docker compose restart app`；回滚完记得移除该项。阶段3 的后置白名单绑定会**同步回退**看板总览与轮动到出厂本地表（`ext_gn_ths` / `ext_hy_ths`），出厂表完整保留。

### 7.3 桥接盘后刷新修复回滚

`bridge/router.py` 的 `after_hours_local_daily()` 与 `query()` 内 `covers_session` 分支是本阶段新增。若要回退：删除该辅助函数、把刷新分支恢复为原先的三行逻辑（无条件 `live.daily()` + 空则抛 `SourceUnavailable`）、移除 metadata 的 `latest_refresh` 字段，然后 `manage.py stop && start`。回退后**盘后重跑管道会再次失败**，仅在明确需要恢复旧语义时操作。

### 7.4 常见故障速查

| 现象 | 首查 | 处置 |
|---|---|---|
| 全站涨跌幅为 0 / `平 2362` | 当日 `kline_daily/date=*` 是否只有 9 列、无 `pre_close`/`change_pct` | 收盘后 `POST /api/pipeline/run`，轮询到 succeeded；**盘前/盘中不要跑** |
| 指数卡片 "-" | `doctor.py::index_daily_history` | `backfill_index_daily.py --apply` |
| 设置页保存 500 | 容器日志 `SOURCE_POLICY_BLOCKED` | 确认 `overrides/` 已挂载且容器已重启；正常应 200 且 provider 仍 `local_quant` |
| 板块名单混合申万/TDX | 启动日志 `BOARD_TAXONOMY_*` | 确认 `official` 与 `BOARD_TAXONOMY_BINDINGS_ACTIVE`，必要时重启容器 |
| 管道报 `Latest request returned no observations` | 是否盘后、本地当日分区是否已含当日数据 | 见 §2.2 #7；盘前触发属预期 fail-closed |
| 桥接 503 / `ModuleNotFoundError` | `runtime/bridge.log` | `manage.py stop && start`；再跑 `verify_sources.py` |
| 离线产物过期 | `doctor.py::offline_products` | `import_fuyao.py --all`（宿主机 Key，绝不写进容器） |

---

## 8. 恢复工作 SOP

1. **盘前/只读**：`scripts/doctor.py` → 确认 0 FAIL；看 §6 决定优先级，不要先动数据。
2. **今日（11-05）收盘后**：先确认 `free_stockdb` 已同步 11-05（桥接 `require_latest` daily 请求可返回当日行带 `pre_close`/`change_pct`），再 `POST /api/pipeline/run` 并轮询到 succeeded；随后跑 `doctor.py` 与 `pytest`。
3. **每周**：看 `source-audit.jsonl` 体积（>16MB 用 `rotate_logs.py --apply`）、离线产物新鲜度、磁盘余量。
4. **任何覆盖层/桥接代码改动后**：必须重启对应进程（`docker compose restart app` / `manage.py stop && start`），再跑 §5 的 1–4 项。
5. **升级镜像或打开任何关闭项前**：需用户明确批准，先备份、后验收。

---

## 9. 红线（阶段3 之后不要做的事）

1. 不修改 `upstream/` 源码、不改 `compose.yaml` 里的固定 digest 与 `pull_policy`。
2. 不放开容器外网白名单、不在容器内填 vendor Key、不把 `runtime/fuyao.env` 挂载进容器。
3. 不对缺失数据零填充、不静默回退到远程源、不伪造 `announce_date` 或历史成分版本。
4. 不擅自打开 `pipeline_pull_index` / `pipeline_regime_enabled` / P0-P1 清单，不勾选「已完成」。
5. 不在盘中执行盘后管道、不在未备份情况下改 `data-local/`。

---

## 10. 文档索引

| 文档 | 用途 |
|---|---|
| `tasks/handover-phase3-summary.md` | **本文档**：阶段3 唯一入口、暂停快照 |
| `tasks/handover-phase2-summary.md` | 阶段2 基线 + §10 接管基线 + §11 故障处置原始记录 |
| `tasks/phase1-handover.md` | 阶段1 完整交接 |
| `tasks/p0-p1-plan.md` | 28 项待批准原子清单 |
| `tasks/todo.md` | 历史待办（部分未勾为快照，见 §6.5） |
| `docs/data-inventory.md` / `docs/data-source-contract.md` / `docs/live-sources.md` / `docs/fuyao-offline.md` | 数据清单、来源契约、实时源、离线产物 |
| `README.local.md` | 日常启动/停止、体检、轮转、回填入口 |
| `tasks/actual-source-checks.json` | 最近一次 `verify_sources.py` 证据 |

*阶段3 交接结束。系统运行中，工作暂停；恢复时请先执行 `scripts/doctor.py`。*

---

## 12. 阶段4：用户批准后升级至 v0.3.29（2026-11-05 08:45 GMT+8）

阶段3 §6.1 #1「上游版本滞后」已获用户明确批准（连同盘后管道、P0/P1 一并批准）。本节为该次升级的完整记录；§1–§11 保留为阶段3 暂停快照，不改写。

### 12.1 升级前只读评估（关键：覆盖层兼容性）

`docker pull --platform linux/arm64 ghcr.io/shy3130/tick-stock-panel:v0.3.29` 成功（阶段1 的 TLS/blob EOF 问题未复现）。用 `docker create` + `docker cp` 取出新镜像 `/app/app` 源码（285 个 .py；Python 3.11.18 / polars 1.44.1 / fastapi 0.136.1），逐项核对覆盖层依赖：

- **19 个上游模块、20+ 内部符号全部存在**：`KlineRepository` 4 个被 patch 的方法、`provider_has_dataset`、`get_paid_realtime_client`、`ensure_builtin_presets`、`ExtConfig*` / `write_ext_parquet`、三个 `_dimension_field`、`MEMBERSHIP_NOTE`、`daily_pipeline.run_now`、`app.main.app` 等。
- **AST 签名比对一致**：`get_enriched_latest(self)` / `get_enriched_latest_asset(self, asset_type, refresh)` / `flush_live_enriched_asset(self, asset_type, df)` / `merge_live_enriched_asset(self, asset_type, df)` 新旧版本完全相同 → 覆盖层 wrapper 可直接沿用。
- 两处**假阳性**（排查口径错误，非不兼容）：① `get_paid_realtime_client` 定义在 `app/tickflow/client.py:85`，`quote_service` 只是 import，按「在 quote_service 内定义」检查会误报；② `validate_preferences` 定义在 `overrides/source_policy.py:104`，是覆盖层自身符号，不是上游符号。**结论：静态兼容性通过，可升级。**
- 新版与 v0.3.27 有差异的文件：`__init__.py`、`desktop.py`、`main.py`、`services/preferences.py`、`tickflow/repository.py`、`upgrade_manifest.json`；新增 `frontend_static.py`、`startup_diagnostics.py`。

### 12.2 备份与切换

| 项 | 值 |
|---|---|
| 回滚点 | `runtime/backup-pre-upgrade-20261105-084434/`（472MB / 27511 文件，含 `data-local/`、`compose.yaml`、`.env`(0600)、`overrides/`、`plugins/`、`bridge/`、`scripts/`、`tests/` 与 `ROLLBACK.md`） |
| 旧 digest | `sha256:c52e95144bac942243ebfc471bbbd7a62f28bf9289e6e512a820b2956410755d` |
| 新 digest | `sha256:c1e8ca1939a4ffed538394f799a75a1a309c191b20e99e0c02c6f82edd39d739` |
| 切换命令 | `docker compose up -d --force-recreate app`（bind mount 数据保留） |
| 启动日志 | `2026-11-05 08:45:11 Tick Stock Panel v0.3.29 starting (mode=local_only)`；五条钩子 `SOURCE_POLICY_ACTIVE` / `LOCAL_PRESETS_ACTIVE` / `BOARD_TAXONOMY_ACTIVE: official` / `ENRICHED_INTEGRITY_ACTIVE` / `BOARD_TAXONOMY_BINDINGS_ACTIVE` 齐全、零 Traceback |

`pull_policy: never`、platform arm64、`upstream/` 只读、容器零外联、provider 锁定、PIT 关闭、Key 仅宿主机等**固定不变量全部未改**。

### 12.3 必要收尾：`doctor.py` 基线同步

升级后首次 `doctor.py` 报 `[FAIL] compose_invariants: fixed image digest changed` —— 原因是 `scripts/doctor.py:27` 的 `PINNED_DIGEST` 硬编码旧 digest，**是体检工具基线未跟上升级，不是系统故障**。已改为新 digest；`tests/test_doctor.py` 通过 `doctor.PINNED_DIGEST` 动态引用，无需改动。`README.local.md` 首段已同步，`tasks/image-provenance.json` / `tasks/imported-image.json` 作为 v0.3.27 历史证据保留不改。

### 12.4 升级后全量验收（全部通过）

| 项 | 结果 |
|---|---|
| `doctor.py` | **15 PASS / 1 WARN / 0 FAIL**（唯一 WARN 仍为 `mainline_history` 设计性提示） |
| `pytest` | **181 passed** |
| `verify_sources.py` | 8 项全 PASS（daily/minute/adj_factor/financial/export_daily/boards/eltdx/axdata） |
| `verify_tsp.py` | 三域名 `free-api.tickflow.org` / `fuyao.aicubes.cn` / `1.1.1.1` 全阻断；跨期分钟 96 根 |
| 设置页保存 500 修复 | `PUT /api/settings/preferences/data-providers` **200**，7 项仍 `local_quant`，`preferences.json` hash **幂等不变** |
| 看板总览 | `breadth=2611/454/2431`、`avg_pct=2.09%`，`concept_rank` 命中官方 catalog |
| 板块 / 自选 / 财务 | 概念 390 / 行业 320；自选 2 行；`/api/financials/status available=true` |
| 能力矩阵 | 7 项 `usable=true / effective=local_quant`，`tickflow_tier=disabled` |

**瞬时告警（非故障）**：升级后第一次 `verify_sources.py` 的 eltdx/axdata 报 `ResponseTimeoutError` / `SourceAdapterError`；多轮独立探测（3 轮握手 + 2 轮桥接 realtime）均恢复正常，重跑 8 项全 PASS。桥接是宿主机进程、本轮未重启，与升级无关；盘前 `last_price=0.0` 时桥接正确标 `stale=True`。与 §6.4「eltdx 偶发瞬时 FAILED」一致。

### 12.5 回滚方法（如需）

```bash
cd /Users/beryllewis/private/stock/codex/TSP
# 1) 恢复 compose.yaml 的旧 digest（见备份 ROLLBACK.md）
# 2) 恢复 doctor.py 的 PINNED_DIGEST 为旧值
# 3) 仅当数据也需回滚时：rsync -a --delete runtime/backup-pre-upgrade-20261105-084434/data-local/ data-local/
docker compose up -d --force-recreate app
.venv/bin/python scripts/doctor.py
```

升级未改动任何 `data-local/` 数据，通常只需回退 digest 与 `PINNED_DIGEST` 两处并重建容器。

### 12.6 仍待办（本阶段未做）

- 今日（11-05）**收盘后**的盘后管道（§8 SOP 第 2 条）：需先确认 free-stockdb 已同步 11-05 日K，再 `POST /api/pipeline/run` 轮询到 succeeded。
- P0/P1 28 项：已获批准启动，但 C03/C04/C06/C07/C08 依赖真实公告日与历史成分版本、E01 依赖真实盘中窗口，**按 fail-closed 不得伪造**，需分批推进并逐项留证。
- §6.1 其余待批准项（离线产物自动刷新、桥接守护/自启、历史主线重算）仍保持关闭。

## 13. 阶段4 P0/P1 第一阶段进展（2026-11-05，追加指针）

本节只做指针，不改写上文任何历史记录。用户批准「1 盘后管道 / 2 升级 v0.3.29 / 3 启动 P0/P1」后：升级已完成（§12）；**P0/P1 第一阶段 A01–A04 已实现并验收，A05 观察层已接入但准入切换未完成（计划中保持未勾选）**。§12.6 的「P0/P1 28 项待启动」已被本节取代，原文保留不篡改。

**当前权威进度以 `tasks/p0-p1-plan.md`「第一阶段实施记录」和 `README.local.md` 阶段4 章节为准**，台账见 `tasks/todo.md`。

关键增量：`runtime/evidence.jsonl` 内容寻址 + 链式哈希证据链；`/query` 成功/失败全量 outcome 与 `as_of` / `purpose` / `scope`；本地通达信指数日线观测交易日历（未来日期无开市权威）；冲突与读失败完整持久化并区分 float32 舍入 / 实质分歧；`rotate_logs.py` 纳入证据链归档。验收：pytest 227 passed、verify_sources 8 PASS、doctor 16 PASS/1 WARN/0 FAIL（新增 `evidence_chain` 检查）、verify_tsp 三域名阻断、桥接重启闭环、真实证据链 317 条 `chain_ok=true / seq_ok=true / damaged=0`。

**真实发现（只记录未对账）**：2024-12-31 `600031.SH` 的 5 分钟 bar 在 `tdx_local_lc5` 与 `local_parquet_5min_raw` 之间有 49 条实质分歧（`low` / `amount`），另有 49 条仅为 float32 舍入；根因对账属 D01/D02。

§9 红线与「仍关闭」清单全部不变；B/C/D/E 共 23 项未做，C03/C04/C06/C07/C08 与 E01 按 fail-closed 不得伪造。今日收盘后盘后管道仍待执行（§8 SOP 第 2 条；已安排 16:30 一次性自动化 `TSP 11-05 盘后管道与验收`）。

## 14. 阶段4 P0/P1 第二阶段进展（2026-11-05 午间，追加指针）

本节只做指针，不改写上文任何历史记录。**当前权威进度以 `tasks/p0-p1-plan.md`「第二阶段实施记录」与 `README.local.md` 阶段4续篇为准**；台账见 `tasks/todo.md`。

用户提出「`/api/kline/minute` 经常报请求超时（30s）」并追问 fuyao Key 是否落地，随后要求继续完成未完成任务。本阶段修复的是第一阶段证据链在真实负载下暴露的缺陷与两个用户可见故障，**未新增 P0/P1 原子项完成声明**。

- **30s 超时**：桥接 2 槽并发立即 429 + provider 旧退避累计约 31s 撞破前端 30s 上限。改为桥接内有界排队（并发 8 / 排队 8s，可用环境变量调整）+ 退避预算约 7.65s。实测 6 路与 12 路并发分钟图全部 200，最大延迟 1.97s / 4.05s，证据链无 `BRIDGE_BUSY` / `RATE_LIMITED`。
- **证据链断裂**：`_tail()` 固定 64KB 尾部窗口遇到 4.56MB 大记录会丢链头、`seq` 重开并断链。改为指数扩窗到 16MB；大 `conflicts` 明细改存内容寻址 sidecar，HTTP 响应仍完整。11:49 停机窗口轮转 80.8MB audit + 92.2MB evidence 为 gzip 归档（7.94MB / 9.49MB），活动文件从 GENESIS 起新链。`doctor.py` 从 14 PASS/2 WARN/**1 FAIL** 恢复为 **16 PASS/1 WARN/0 FAIL**。
- **午休实时行情归零**：新鲜度门槛改锚定最后交易时段边界，午休/收盘后的定版快照不再被误判过期，但停牌/无时钟/超前时钟/日期不一致仍 fail-closed。实测 0 行/503 → 5,569 行/200，带 `LUNCH_BREAK_FINAL_SNAPSHOT` 与 `stale=true` 证据。
- **fuyao Key**：已落地于 `runtime/fuyao.env`（0600，`FUYAO_API_KEY`，非空），不在 `.env` / `secrets.json` / compose 挂载中，manifest 记 `pit_enabled=false`。按设计仅供宿主机离线导入，容器内不可见，域名阻断与 §9 红线不变。

验收基线：`pytest` **242 passed**；`verify_sources.py` **8 PASS**；`doctor.py` **16 PASS/1 WARN/0 FAIL**；容器内 `verify_tsp.py` 三域名全阻断、跨期分钟 96 根；桥接 `stop→start→healthy`、容器 healthy。新增 `pytest.ini` 固定测试根目录，避免升级备份的测试副本破坏收集。

§12.6 的「今日收盘后盘后管道」仍待执行（文档记载已安排 16:30 一次性自动化 `TSP 11-05 盘后管道与验收`）；B/C/D/E 共 23 项与 A05 准入切换仍未完成，C03/C04/C06/C07/C08 与 E01 按 fail-closed 不得伪造。
