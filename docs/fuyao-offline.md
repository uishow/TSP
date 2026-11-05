# 同花顺 fuyao 离线增强源（2026-11-04）

> 用户已提供 fuyao API Key。本文记录**为什么不做主数据源**、实测发现的时间语义问题、
> 宿主机旁路离线导入方案、容器侧接入方式，以及仍然关闭的能力。

## 1. 决策：不把 fuyao 设为主数据源

| 约束 | 结论 |
|---|---|
| 固定镜像 `ghcr.io/shy3130/tick-stock-panel@sha256:c52e9514…` | 不改镜像，不启用 `app/plugins/fuyao` |
| `overrides/source_policy.py::install_network_guard()` | 容器只允许 loopback + `host.docker.internal:7818`；`fuyao.aicubes.cn` 被阻断 |
| `install_app_policy()` | 只允许 `local_quant` provider 注册，禁止其他插件与 TickFlow fallback |
| 能力矩阵 | 7 项全部 `usable=true / effective=local_quant`，保持不变 |
| `scripts/verify_tsp.py` | 明确断言 `fuyao.aicubes.cn` 必须被阻断，不得改 |

fuyao 插件 manifest 声明 `[realtime, daily, adj_factor, financial]`，但本地已有更可靠的
原始价日 K / 分钟线 / 除权因子 / 全市场实时，且 eltdx 提供原生五档。把 fuyao 放开为主源
会引入单位换算、前复权漂移、分钟缺口回退等风险，净增量为负。

**真正值得接的只有两块**：同花顺官方概念/行业分类、官方财务三表数值与披露日期线索。
因此采用「宿主机旁路离线导入」：Key 只在宿主机使用，产物落到 `data-local/fuyao/`，
容器只读本地文件。

## 2. Key 存放（安全边界）

- 位置：`runtime/fuyao.env`（权限 `0600`），格式 `FUYAO_API_KEY=…`；也可用环境变量 `FUYAO_API_KEY`。
- `runtime/` 未被 `compose.yaml` 挂载，且已在 `.gitignore` 中 → **容器读不到，也不会进版本库**。
- 故意**不**写入 `.env`（它是 compose 的 `env_file`，会注入容器）、**不**写入
  `data-local/user_data/secrets.json`（该目录挂载进容器）。
- Key 不会出现在 `data-local/fuyao/manifest.json`、日志、测试、接口响应或本文档中。
- `bridge/fuyao_offline.py::load_api_key()` 优先级：CLI 显式参数 → 环境变量 → `runtime/fuyao.env`。

## 3. 实测探活（2026-11-04 21:04，证据：`tasks/fuyao-probe.json`）

| 接口 | 结果 |
|---|---|
| `/api/a-share/prices/snapshot?limit=1` | `code=0`，全市场 `total=5580` |
| `/api/a-share-index/catalog/ths-index-list?tag=cn_concept` | `code=0`，390 个板块，一次返回无分页 |
| `…?tag=industry` | `code=0`，320 个板块 |
| `/api/a-share-index/constituents/ths-stock-list?thscode=885431.TI` | `code=0`，1068 只成分，字段 `thscode/ticker/name` |
| 财务三表 × 4 标的 × 8 期 | `code=0`，96 行 |

`thscode` 与本地 `symbol` 同构（`600031.SH`），无需映射表。无 Key 时接口返回
`{"code":2003,"message":"Missing X-api-key"}`，宿主机侧 HTTPS 可达（0.17s）。

### 3.1 关键发现：`report_date_ms` 不是可验证的 PIT 公告日

上游 `app/plugins/fuyao/provider.py` 把 `report_date_ms` 直接映射为 `announce_date`。
对 4 只股票 × 3 张表 × 8 个报告期实测后，**该映射不成立**：

| 观察 | 证据 |
|---|---|
| 最近约 4 期**像**个股真实披露日 | 每只票日期不同（`600031` Q3=10-30、`000001` Q3=10-24、`002474` Q3=10-27、`600519` Q3=10-31）；滞后 Q1 约 25–30 天、Q2 约 46–62 天、Q3 约 24–31 天、年报约 80–114 天，落在法定披露窗口内 |
| 更早历史期被**按季度类型回填** | 同一 `fiscal_period` 跨年份复用同一个 `report_date`，如 `600031` 2025Q3 返回 `2026-10-30`、2024Q4 返回 `2026-03-31`；滞后 389–479 天 |
| 三表在同一 `(symbol, period_end)` 上**互相冲突** | `600031` 2025Q4：income/cash_flow=`2026-03-31`，balance_sheet=`2026-10-30`；探活 96 行中有 16 个冲突键 |
| `balance_sheets` 历史行更混乱 | 同一序列滞后天数在 19/25/29/30 与 297/303/455 之间跳变 |

结论：`REPORT_DATE_MS_IS_NOT_A_VERIFIED_PIT_DISCLOSURE_DATE`。
如果直接写入 `announce_date`，历史回测会出现时点错配（既可能提前也可能延后一年）。

### 3.2 处置（fail-closed）

- 导入产物只写 `report_date` + `announce_date_candidate` + `report_date_quality`，
  **绝不写 `announce_date`**。
- 三表交叉校验（`resolve_announce_candidates()`）：
  - 三表日期一致且滞后在 10–130 天 → `ANNOUNCE_DATE_CANDIDATE`（仍是候选，非 PIT）
  - 三表不一致 → `CROSS_TABLE_CONFLICT`
  - 滞后 > 130 天 → `HISTORICAL_BACKFILL_SUSPECT`
  - 其它 → `LAG_OUTSIDE_DISCLOSURE_WINDOW` / `REPORT_DATE_BEFORE_PERIOD_END` / `REPORT_DATE_MISSING`
- 所有行 `pit_verified=False`、`announce_date_verified=False`、`field_mapping_verified=False`。
- 现有 5 张财务观察表只增加 `fuyao_*` 交叉标注列，`announce_date` 与 `pit_verified` 保持原值。

## 4. 离线导入

```bash
# 语义探活（写 tasks/fuyao-probe.json）
.venv/bin/python scripts/import_fuyao.py --probe

# 官方概念/行业分类（2 次目录 + 710 次成分，8 并发，约 30 秒）
.venv/bin/python scripts/import_fuyao.py --boards

# 财务三表：先试点，再全量（断点续跑，中断后重跑同一命令即可）
.venv/bin/python scripts/import_fuyao.py --financial --limit 20
.venv/bin/python scripts/import_fuyao.py --financial

# 只汇总、不写产物
.venv/bin/python scripts/import_fuyao.py --all --limit 20 --dry-run
```

- 中间缓存：`runtime/fuyao-cache/`（宿主机专有，不进容器），每个标的/板块原子写一个 JSON。
- 只有成品写进 `data-local/fuyao/`，容器不会看到半成品。
- 失败单元记录到 `runtime/fuyao-cache/*_errors.json`，不补零、不伪造行、不静默丢弃整表。
- 板块名中的 `/` 与 `;` 在导入与发布两处都被替换成全角，避免页面按分隔符聚合出伪大类
  （上一轮 `TDX` 伪大类即由此产生）。

### 4.1 全市场实测结果（2026-11-04 21:16）

| 项目 | 结果 |
|---|---|
| 官方分类 | 概念 390 板块 / 70,601 条成分 / 5,580 只；行业 320 板块 / 10,287 条成分 / 5,578 只；**零失败** |
| 发布为独立表 | `fuyao_ths_concept` 5,580 行、`fuyao_ths_industry` 5,578 行；含 `/` 的值 0 条 |
| 财务三表 | 5,580 只全部导入、**零错误**；`income` 44,640、`balance_sheet` 44,639、`cash_flow` 44,640 行 |
| 候选公告日 | 44,787 个 `(symbol, period_end)`：候选 16,716、三表冲突 22,149、回填疑似 5,900、缺失 17、窗口外 5 |
| 耗时 | 官方分类约 29 秒（710 次成分调用，8 并发）；财务三表约 10 分钟（16,740 次，8 并发） |

**约一半的键存在三表日期冲突**，进一步印证 `report_date_ms` 不能作为 PIT 公告日。
原始证据在 `tasks/fuyao-probe.json`，全量质量分布见 `manifest.json`。

### 产物清单（`data-local/fuyao/`）

| 文件 | 内容 |
|---|---|
| `manifest.json` | 导入时间、Key 来源标签（非值）、端点、计数、语义判定、`pit_enabled=false` |
| `financial_income.parquet` / `financial_balance_sheet.parquet` / `financial_cash_flow.parquet` | 官方三表数值，canonical 列名沿用上游 provider 映射 |
| `financial_announce_candidates.parquet` | `(symbol, period_end)` 级三表交叉校验结果 |
| `ths_concept_catalog.json` / `ths_industry_catalog.json` | 官方板块目录 |
| `ths_concept_membership.parquet` / `ths_industry_membership.parquet` | 长表成分明细 |

## 5. 容器侧接入（零外联不变）

### 5.1 独立官方分类表

`overrides/local_extensions.py::publish_official_boards()` 读取离线产物，发布两张**新表**：

| 表 id | 字段 | 说明 |
|---|---|---|
| `fuyao_ths_concept` | `所属概念` | 官方概念，多值 `;` 分隔 |
| `fuyao_ths_industry` | `所属同花顺行业` | 官方行业，扁平无层级 |

- **不覆盖** `ext_gn_ths` / `ext_hy_ths`（仍是本地 free_stockdb / 申万分类），
  `monitor_ext_fields` 不自动切换，避免影响监控列、筛选器、策略扩展字段。
- 字段名刻意与上游一致，用户若要切到官方分类，可把 `monitor_ext_fields` 改指向新表 id。
- 配置里 `url=''`、`enabled=False`、无 `auth`、无 `fanout` → 拉取调度器永远不会尝试找 Key。
- 只有 `manifest.boards.complete=true` 才发布；导入不完整时返回空结果，绝不写半成品。
- 手动发布：`POST /api/local-sources/fuyao/publish`，或 `/local-sources` 页面上的按钮。
  每日盘后管道 `sync_boards()` 也会顺带刷新。

### 5.2 桥接查询

`bridge/router.py` 新增只读 dataset `fuyao`（`bridge/fuyao_offline.py::FuyaoStore`）：

| `table` | 返回 |
|---|---|
| `status` | 离线导入计数、语义判定、不变量声明 |
| `income` / `balance_sheet` / `cash_flow` | 官方三表数值 |
| `announce_candidates` | 候选公告日与质量标签 |
| `concept` / `industry` | 官方分类长表成分 |

响应 metadata 固定带 `no_network_access=true`、`key_in_container=false`、
`pit_verified=false`。`/local-sources` 页面下拉框可直接核对。
`bridge/server.py::/status` 增加 `fuyao_offline` 与 `fuyao_pit` 状态。

## 6. 仍然关闭 / 已知限制

- **PIT 财务因子与回测仍关闭**：`announce_date` 恒空、`pit_verified=false`。
  要开放需要独立的法定披露日源逐条核验，不能只靠 `report_date_ms`。
- 官方三表的字段映射沿用上游 provider，`field_mapping_verified=false`
  （如 `financial_expense` 用利息费用近似）；`*_raw` 类单位口径需单独核验。
- 官方分类是**当前成分快照**，无历史成分版本，`pit_verified=false`，主线/复盘回看早年仍有归属漂移。
- 离线产物需手动重跑导入脚本才会更新；没有自动定时任务。
- 容器网络白名单、能力矩阵、上游镜像、`verify_tsp.py` 的阻断断言全部未改动。

## 7. 验收命令

```bash
.venv/bin/python -m pytest -q --basetemp="/tmp/tsp-pytest-$(date +%s%N)"
.venv/bin/python scripts/verify_sources.py
docker exec -i -w /app tsp-local /app/.venv/bin/python - < scripts/verify_tsp.py   # network_blocks.fuyao.aicubes.cn 必须为 true
curl -s -X POST http://127.0.0.1:3018/api/local-sources/fuyao/publish
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3018/local-sources
```
