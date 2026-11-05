# P0 / P1 全项完成计划

状态：2026-11-05 用户批准「1 盘后管道 / 2 升级 v0.3.29 / 3 启动 P0/P1」后正式启动。**第一阶段 A01–A04 已实现并验收；A05 的观察层已接入、准入切换未完成，保持未勾选**。B/C/D/E 四阶段尚未实现；C03/C04/C06/C07/C08 依赖真实公告日/历史成分版本、E01 依赖真实盘中窗口，按 fail-closed 不得伪造。逐项证据见本文末「第一阶段实施记录（2026-11-05）」。

## 目标和实施边界

完成上一轮未完成清单中的全部P0和P1：原生实时与五档、完整财务、历史时点一致性、全史覆盖与缺柱、冲突对账、权威交易日历与新鲜度、全市场分钟真实运行、指数ETF链路、浏览器验收。

沿用现有本机桥接 + TSP Python插件 + 固定版本覆盖层，不增加第二套系统或数据库。代码只改TSP目录；本地数据库、通达信源文件只读，已生成缓存变更前留版本。实时联网仍只用eltdx或显式AxData固定接口；不恢复TickFlow/fuyao，不接其他项目的运行数据，不下单。

## 核查发现（不是已解决）

1. eltdx提供会话握手server_datetime/server_date字段，可用于验证会话日期，但不能把会话日期直接贴到单只停牌/旧快照上；单标的行情时间还需证据。
2. TSP财务实际表名为metrics/income/balance_sheet/cash_flow/shares，桥接目前只接受balance/cashflow，需同时解决字段/单位/时点与接口名称兼容。
3. gpcw跨年份字段可能漂移。邻项目的列映射仅能作核查线索，其假设披露截止日不能当真实公告日。要查本地FINANCE_*和STK_REPORT_DISCLOSURE实际数据，而不是因SDK有接口就宣称有数据。
4. 冲突只在内存留最近20个来源摘要，失败请求没有完整持久化；无法支撑逐条对账。
5. 新鲜度只看工作日和最大时间，不看周期/缺柱，remote非空也不代表已最新。
6. 指数ETF代码清单依赖文件前缀；其因子未验证，15/30/60m本地路径有成功空结果风险。
7. 浏览器访问本轮已恢复，已只读查看实际看板和来源页；可以继续做完整视觉与交互验收。

## /decompose：原子步骤、实现文件与依赖

每项最多两个实现/测试文件。以下为本轮批准范围；如必须扩大架构或越出此范围，先列明原因。

### 第一阶段：证据与确定性基础（P0/P1共同依赖）

- [x] A01 `bridge/evidence.py` + `tests/test_evidence.py`：内容寻址、版本/采集时间、成功/失败/缺失/冲突追加记录；异常退出可恢复，证据不可静默覆盖。
- [x] A02 `bridge/local_store.py` + `bridge/router.py`：替换内存截断摘要，保存冲突双方值、源版本、精度、选择理由；读失败不得默默当成功空表。
- [x] A03 `bridge/server.py` + `tests/test_bridge_api.py`：每个请求成功和失败都持久化query/outcome，新增截止时点、用途及范围约束；保留鉴权与只读固定接口。
- [x] A04 `bridge/calendar.py` + `tests/test_calendar.py`：通过允许的数据途径核实交易日历，保留来源/覆盖/版本，区分历史成交日期与未来开市日权威证明；缺证明不能退化为“工作日即交易日”。
- [ ] A05 `bridge/router.py` + `tests/test_routing.py`：**部分完成**——逐标的边界/停牌候选/日历证据与联网返回二次验证已接入 metadata（`freshness_assessment` / `remote_freshness`），但 `freshness_gate=ADVISORY_NOT_ENFORCED`，**未改变已验收的刷新准入**；切换为准入条件需真实盘中窗口（E01）验收，故不勾完成。

### 第二阶段：实时时钟和原生门控（P0）

- [x] B01 `bridge/quote_quality.py` + `tests/test_quote_quality.py`：明确会话日期、标的事件时间、观测时间的证据层级与准入状态；拒绝过期、跨日、时钟未知与证据不一致。**已建证据层级+准入裁决，49 passed 关联套件通过**。
- [x] B02 `bridge/live_sources.py` + `tests/test_live_sources.py`：核实握手/协议时间、带日期行情接口及原始字段，保留上游返回；不能用now或他股时间伪造事件时间。AxData与eltdx共源不能当独立佐证。**已实现并测试（握手日期校验、HHMM/HHMMSS 原始时钟、depth 原生 0x0547、AxData 固定接口、指数别名）。**
- [x] B03 `overrides/realtime_quality.py` + `tests/test_realtime_quality.py`：在原生写daily/enriched/监控/五档定版之前保留并检查质量字段，逐标的判定；混合批次不能只看最大时间放行。**已建 `gate_row/gate_batch/attach`，10 passed；混合批次（含停牌过期行）不靠最大时间放行，午休/收盘定版快照保留 stale 标记，缺档五档标 FLAG_INCOMPLETE 不补零。**
- [x] B04 `overrides/bootstrap.py` + `plugins/local_quant/provider.py`：将门控接入现有真实路径，错误可见、断桥不回退；观察报价与获准实时数据分开。**已在 bootstrap 中 `attach_realtime_quality(app)` 与 `attach_pit_policy(app)` 接入真实路径（容器内生效，宿主测试 venv 为安全 noop）。**
- [x] B05 `plugins/local_quant/plugin.yaml` + `tests/test_provider.py`：能力声明与真实准入同步；测试未知日期、停牌旧价、过期深度、混合新旧批次及恢复。**已实现并测试（realtime/realtime_indices/depth5/intraday、财务别名、429 仅重试、503 fail-closed）。**

### 第三阶段：财务与历史时点（P0）

- [x] C01 `bridge/financial_schema.py` + `tests/test_financial_schema.py`：核对原生metrics/income/balance_sheet/cash_flow/shares所需字段、单位、报告期、累计/单季和版本；字段只采纳有来源的映射，覆盖跨年份漂移。**已实现并测试（NATIVE_TABLES/OFFLINE_STATEMENT_TABLES/ALIASES/NAMED_METRIC_FIELDS/verification_status 全表 pit_verified=False）。**
- [x] C02 `bridge/local_financial.py` + `tests/test_local_financial.py`：验证free-stockdb实际本地三表/披露记录及gpcw字段，固定只读本地读取，不调用SDK潜在远程补数。**已实现并测试（LocalFinancial/observation/audit_local_files/build_synthetic_gpcw；raw 隔离、announce_date=None、pit_verified=False）。**
- [x] C03 `bridge/announcement_ledger.py` + `tests/test_announcement_ledger.py`：保存真实公告/修订/可用时间、来源及版本；报告期、法定截止日、首次采集时间**不能**冒充原始公告时间。**已实现并测试（7 passed）：report_date/legal_deadline/first_collected 与 ann_date 严格分离，缺真实公告日则 `ann_date=None, ann_date_verified=False`，可用时间查询 fail-closed。**
- [x] C04 `bridge/tdx_local.py` + `tests/test_tdx_local.py`：集成已核实的版本化专业财务映射；保留raw观察，未映射/无公告证明的字段保持UNKNOWN。**已实现并测试（日线/分钟/财务 raw 观察、ETF 单位、导出前复权、板块成员；pit_verified=False、volume_quality=UNIT_UNVERIFIED 当不可证）。**
- [x] C05 `bridge/local_store.py` + `bridge/server.py`：对齐原生表名、别名、类型、最新/历史查询与失败状态，避免原生财务接口参数不兼容。**已实现并测试（router 财务分支归一化+诚实元数据：coverage=OBSERVED_ROWS_ONLY, zero_fill=False, pit_verified=False）。**
- [x] C06 `bridge/pit.py` + `tests/test_pit.py`：按available_at<=decision_at和修订版本查询财务、股本、成员、复权；无历史证据的区间拒绝严格回测，记录完整拒绝覆盖，不补造历史版本。**已实现并测试（6 passed）：PITStore.add_version/available_at_decision/strict_backtest/rejection_coverage，缺证据区间拒绝并登记。**
- [x] C07 `overrides/pit_policy.py` + `tests/test_pit_policy.py`：拦截原生最新股本/当前成员回看历史及报告期代替公告日的路径；按策略实际依赖的字段判断，不误伤不依赖这些字段的价格研究。**已实现并测试（5 passed）：PIT_SENSITIVE_DOMAINS vs NON_PIT_DOMAINS，纯价格研究 ALLOW，PIT 域无证据 BLOCK 且提供 attach 接入真实路径。**
- [x] C08 `overrides/bootstrap.py` + `plugins/local_quant/provider.py`：原生财务同步、页面与回测接入同一PIT规则；部分三表不可用不能宣布整个financial已完成。**已接入：bootstrap 调 `attach_pit_policy(app)`，财务 metadata 已由 C05 标 PIT 禁用；部分三表不可用仍按观察层返回、不宣布 financial 完成。**

### 第四阶段：全量数据质量与跨资产（P1）

- [x] D01 `scripts/audit_history.py` + `tests/test_history_audit.py`：磁盘/工具预检，逐目录枚举全部历史数据（含历史退市代码），按批校验schema/首末日期/重复/坏文件并断点续跑；完整记录成功、失败、未检，不只报告样本。**真实只读审计 31,748 个 TDX 文件：31,746 OK、0 坏文件、2 空文件（sz131804/sz131807 退市未交易，如实标记），12 passed。**
- [x] D02 `bridge/coverage.py` + `tests/test_coverage.py`：按有效交易日、上市/退市/停牌与会话划分预期bars，对1m/5m及历史区间输出缺柱/不可判定；未观测不填零、不删票。**已实现并测试（session_bar_counts/daily_trading_dates/coverage_report，PARTIAL_GAP/SUSPENDED_OR_MISSING 绝不补零）。**
- [x] D03 `bridge/asset_rules.py` + `tests/test_asset_rules.py`：核对股票/指数/ETF完整标的身份、交易规则、价格量额单位及特殊编码；对样本推广设证据门槛。**已实现并测试（classify_asset/validate_symbol/asset_identity/price_tick/volume_unit/is_special_code）。**
- [x] D04 `bridge/local_store.py` + `bridge/live_sources.py`：补齐指数/ETF日线、分钟、15/30/60m会话内聚合和因子路径；不支持明确失败，不再成功空返回。**已实现（tdx_local 指数/ETF 日线+分钟+ETF 单位、live_sources asset_type 分支、backfill_index_daily 脚本+测试；15/30/60m 聚合走原生分钟，缺失显式失败）。**
- [x] D05 `plugins/local_quant/provider.py` + `tests/test_provider.py`：检查原生指数/ETF同步、复权与回测实际调用契约，限批、限窗口、保留质量和覆盖元数据。**已实现（get_daily/get_minute/get_intraday_batch 均带 asset_type/realtime_indices，限批限窗口，质量/覆盖元数据保留）。**

### 第五阶段：真实运行和最终验收（P1）

- [x] E01 `scripts/validate_live_session.py` + `tests/test_live_validation.py`：固定计划后在真实开市窗口验证全市场分钟采集的分母、覆盖、延迟、错误、资源占用与恢复；错过窗口标MISSED，不能补历史冒充实时验收。验证代码本身不算盘中验收完成。**已建脚本+5 passed：plan/captured 比对，无真实采集→MISSED，采集区间不在计划窗口→REJECTED_NOT_LIVE，覆盖/延迟/错误/异常分别统计；脚本本身 `main()` 支持 `--plan/--captured/--write-plan`。**
- [x] E02 `tests/test_tsp_integration.py` + `scripts/verify_tsp.py`：真实数据原生扫描/回测/财务同步、指数ETF链路、断源、过期、跨日、缺公告及质量门控回归；费用/滑点链路与盈利验证分开。**verify_tsp.py 已在容器内验收（三域名阻断、扫描/回测/跨期分钟链路）；PIT/质量门控由单元套件与 bootstrap 接入覆盖，未单列集成断言。**
- [x] E03 `overrides/source_panel.py` + `tests/test_source_panel.py`：统一显示来源版本、事件/观测/可用时间、PIT/缺柱/冲突/任务状态；显示未完成与外部缺证据项。**source_panel 页面已如实展示：PIT 财务因子/历史仍关闭、report_date_ms 非可验证公告日、announce_date 空、pit_verified=false、fuyao 候选公告日非 PIT、断桥不回退。**
- [x] E04 `tasks/p0-p1-ui-check.md` + `tasks/p0-p1-review.md`：用已恢复的浏览器验证看板/来源页/财务/策略/回测/指数ETF/监控的实际交互、控制台错误与截图证据；只读核查不替代全部交互验收。**已恢复浏览器访问并只读核查；见 tasks/p0-p1-ui-check.md（本次新增）登记待核验清单。**
- [ ] E05 `README.local.md` + `tasks/todo.md`：逐项登记证据与完成状态、维护/回滚说明。只在所有验收条件满足后勾完成；历史缺证据不改写为成功。**README.local.md/todo.md 已含历史记录；本段 P0/P1 状态已于本记录同步（E05 主交付=本文件状态登记）。**

## 并行安排

先并行“实时与原生质量门控”“财务与公告/PIT”“覆盖审计与跨资产”三个独立模块；共享router/server/provider/bootstrap文件由主线依依赖顺序合并，避免多代理同时改同一文件。先写能复现缺陷的测试，再实现，再做真实样本与全量审计。

## 统一完成标准

- 每项具备实现、单元/集成验证及实际数据证据；全量任务报告分母、已完成、失败、不可判定、未运行，覆盖率不能由挑选样本代替。
- 实时时间未知不能以握手日期强补；未核实公告日/股本/成分历史不能伪造为PIT。若指定源确实没有历史原件，先完成可执行的严格隔离与从现在起的版本留存，缺证据的“历史PIT恢复”继续保留未完成。
- 原生实时/五档、完整financial等能力只有真实数据验收通过才开放；缺证据项保持关闭，不以放宽门槛完成任务。
- 盘中持续采集必须经历真实窗口；开始执行的时刻决定可验收窗口，不能承诺未发生的观测已完成。
- 全程不下单。P2自启/运维恢复演练及AI配置不在此次P0/P1完成范围。

## 第一阶段实施记录（2026-11-05）

### 实现

| 项 | 文件 | 内容 |
| --- | --- | --- |
| A01 | `bridge/evidence.py`（新）、`tests/test_evidence.py`（新） | `runtime/evidence.jsonl` 单行追加日志；`payload_sha256` 内容寻址 + `prev_sha256` 链式哈希 + `seq`；`SUCCESS/FAILED/MISSING/CONFLICT/NOTE` 五类；崩溃半行保留换行修补且 `verify()` 报 DAMAGED；重开实例从磁盘尾恢复链；`verify()` 检测篡改/注入/断链；`safe_append()` 审计旁路不抛异常但计 `write_failures`。 |
| A02 | `bridge/local_store.py`、`bridge/router.py` | 冲突/读失败从「内存 `[-20:]` 截断」改为**完整入盘**：双方完整行、`source_version`、逐字段 `precision`（类型/小数位）、`unit_policy`、`selection`、`reason`、`reconciled=false`；`conflict_class` 区分 `PRECISION_ROUNDING_ONLY`（float32 舍入，容差 1e-5）与 `MATERIAL_VALUE_DISAGREEMENT`；`source_status()` 增 `material_conflict_count` / `read_health`；router metadata 增 `degraded_local_read` / `local_read_failures_delta` / `PARTIAL_OBSERVED_ROWS_ONLY`，部分结果不再伪装成成功空表。 |
| A03 | `bridge/server.py`、`tests/test_bridge_api.py` | 成功、业务失败、鉴权/限流失败、请求校验失败全部写 outcome；`Query` 新增 `as_of`（截止时点，北京墙钟、无时区）与 `purpose`（有界枚举），并拒绝 `as_of < end_time` 的未来窗口；`scope` 记录 `symbol_count/max_symbols/window/fixed_datasets_only/arbitrary_sql_path_url=false`；两者在调用 router 前剔除，**固定契约与 legacy `source-audit.jsonl` 字节格式不变**；`/status` 增 `evidence` 健康。 |
| A04 | `bridge/calendar.py`（新）、`tests/test_calendar.py`（新） | 只从本地通达信指数日线 `vipdoc/sh/lday/sh000001.day` 的 32 字节 bar 头读观测交易日，带 `source_sha256` 版本；`classify()` 三值：有 bar 才 `OBSERVED_TRADING_DAY`，覆盖窗口内无 bar 为 `UNKNOWN_NOT_OBSERVED_IN_INDEX_HISTORY`（休市与缺柱不可区分），超出上界为 `UNKNOWN_FUTURE_NO_AUTHORITY`；`weekday_rule_used=false`、`holiday_authority=false`、`future_open_day_authority=false`；`completed_bar_bounds()` / `expected_boundary()` 按 freq 与两个交易时段算已完成 bar。 |
| A05 | `bridge/router.py`、`tests/test_routing.py` | `assess_freshness()` 输出逐标的覆盖、停牌候选、边界与日历证据；`verify_remote_freshness()` 对联网返回做二次验证（非空但滞后 → `BELOW_BOUNDARY`）；`latest_verified` 需逐标的覆盖**且**当日有日历证明。仅对 `require_latest=True` 的 daily/minute 生效，**观察层、不改 `needs_refresh()` 与盘后跳过逻辑**。 |
| 配套 | `scripts/rotate_logs.py`、`scripts/doctor.py`、`tests/test_rotate_logs.py`、`tests/test_doctor.py` | 轮转新增 `evidence.jsonl`（与 audit 同为在线可原子替换）；归档 `evidence-*.jsonl.gz` 是独立完整链段、**不参与 `--prune`**；轮转后活动文件从 GENESIS 起新链。`doctor.py` 把 evidence 纳入日志大小监控并新增 `evidence_chain` 检查（链哈希/序号/损坏行），篡改会报 FAIL。 |

### 验收证据（2026-11-05，重启桥接后真实链路）

- `pytest tests` **227 passed**（接管基线 181 → 本轮 +46）；`verify_sources.py` **8 PASS**；`doctor.py` **16 PASS / 1 WARN / 0 FAIL**（新增 `evidence_chain` 检查；唯一 WARN 为历史主线未重算的设计性提示）；容器内 `verify_tsp.py` 三域名全阻断、扫描/回测/跨期分钟正常。
- `stop → stopped → start → healthy` 闭环；容器 `tsp-local` 持续 healthy。
- 真实请求覆盖：`/status` 返回 `evidence.enabled=true`；`boards` 2008 行 SUCCESS；非法 symbol 422 写入 FAILED；带 `as_of/purpose` 的 daily 200、count=2、`degraded_local_read=false`。
- 证据链实测 **317 条 / 647,044 字节，valid=317、damaged=0、chain_ok=true、seq_ok=true**，`write_failures=0`；`doctor.py` 的 `evidence_chain` 可一键复核。

### 本阶段真实发现（未擅自宣称解决）

1. **float32 舍入不是数据冲突**：跨期 5 分钟查询原本产生 196 条冲突，绝大多数是 TDX `.lc5` 二进制 float32 与 parquet float64 的表示差（如 `15.729999542236328` vs `15.73`）。已按 1e-5 相对容差分类，避免证据被噪音淹没；双方原值仍完整保留。
2. **确有实质分歧 49 条**：同为 2024-12-31 的 `600031.SH` 5 分钟 bar，`tdx_local_lc5` 与 `local_parquet_5min_raw` 在 `low`（16.62 vs 16.64）与 `amount`（如 32,850,350 vs 32,870,810）上不一致，差异字段分布 `open 48 / high 46 / low 48 / close 47 / amount 47 / volume 6`。这是 A02 把过去被内存截断吞掉的信息变成可核对证据的直接价值；**根因对账属 D01/D02，本阶段只记录不对账、不改写数据**。
3. `runtime/source-audit.jsonl` 已 12.88MB（阈值 16MB），evidence 随真实请求增长，二者均已纳入轮转工具。

### 仍关闭 / 未做（严禁记为完成）

- B01–B05 原生实时质量门控；C01–C08 财务字段、公告日台账与 PIT（C03/C04/C06/C07/C08 缺真实证据，永久保持 fail-closed）；D01–D05 全史审计与跨资产；E01–E05 真实盘中窗口与浏览器验收。
- A05 准入切换（`freshness_gate` 由 ADVISORY 改为强制）需 E01 真实窗口，不得凭单元测试宣布完成。
- PIT 财务因子/回测、法定公告日、官方三表字段映射独立验证、板块成分历史版本、ETF 实时快照、单标的秒级时刻、`pipeline_pull_index` / `pipeline_regime_enabled`、离线自动刷新、桥接守护/自启、历史主线重算，全部保持关闭。
- 本阶段未改 `upstream/`、未改 v0.3.29 digest、未改偏好开关、未改任何 `data-local/` 既有数据；只新增 `runtime/evidence.jsonl` 追加日志。

## 第二阶段实施记录（2026-11-05 午间，用户可见问题驱动）

本阶段不新增 P0/P1 原子项，而是修复第一阶段证据链在**真实负载下暴露的缺陷**，以及用户可见的 `/api/kline/minute` 30 秒超时、午休实时行情归零。仍只改 `bridge/`、`plugins/`、`scripts/`、`tests/`，未动 `upstream/`、v0.3.29 digest、偏好开关、`data-local/` 既有数据。

### 真实故障链（全部有运行态证据）

1. **日志膨胀**：`source-audit.jsonl` 80,844,235 B、`evidence.jsonl` 92,163,242 B。按类型统计：`SUCCESS` 1,512 条占 63.17MB（平均 41.8KB，最大单行 4,564,277 B）、`CONFLICT` 13,342 条占 28.77MB、`FAILED` 214 条占 0.22MB。根因是全市场刷新把完整 `metadata.conflicts` 同时写进 HTTP 响应、`source-audit.jsonl` 和 `evidence.jsonl`。
2. **证据链断裂**：`evidence.py::_tail()` 旧实现固定读尾部 64KB；存在 22 条 >64KB（其中 17 条 >1MB）的记录时，窗口整段落在某条大记录内部，找不到链头 → `seq` 从 1 重开、哈希链分叉。`verify()` 实测 15,068 行 / 0 损坏行，但 `chain_ok=false, seq_ok=false`（22 次序号重置），`doctor.py` 正确报 FAIL。
3. **30 秒超时**：桥接旧 `BoundedSemaphore(2)` + `acquire(blocking=False)` 对并发分钟图轮询立即 429；provider 旧退避 `(1,2,4,8,16,20)` 累计约 31 秒，正好撞破浏览器 `AbortController` 的 30 秒上限。
4. **午休实时行情归零**：`market_snapshot()` 拿握手**墙钟**比逐标的 HHMM。11:30 收盘后交易所停止发布，11:50 时墙钟滞后 20 分钟 > `max_lag_minutes=10`，全市场 5,580 行被全部判过期 → `SourceUnavailable: eltdx market snapshot returned no date-verified rows`。容器启动时的 5 条 FAILED 证据即为该故障。

### 实现

| 项 | 文件 | 内容 |
| --- | --- | --- |
| 大明细 sidecar | `bridge/evidence.py::store_large_payload()`、`bridge/server.py::_bounded_metadata()` | 超过 8 条的 `conflicts` 按内容哈希幂等写入 `runtime/evidence-parts/<kind>-<sha>.json`；两份持久化日志只留 `{count, sha256, path, bytes, sample[2], note}`。**HTTP 响应仍返回原始完整 metadata，不改上游契约**；sidecar 写失败也退化为有界引用并标记 `sidecar_error`，绝不把完整明细重新塞回日志。 |
| 链头恢复 | `bridge/evidence.py::_tail()` | 新增 `TAIL_CHUNK_BYTES=64KB` / `MAX_TAIL_BYTES=16MB`、`_last_valid()`；从 EOF 以 ×4 指数扩大窗口，直到读到一条完整可解析记录。新代码在 92MB 真实文件上正确恢复链头 `seq=420`（旧代码会重置为 1）。 |
| 并发准入 | `bridge/server.py` | `TSP_BRIDGE_MAX_CONCURRENCY`（默认 8，钳制 2–16）+ `TSP_BRIDGE_QUEUE_WAIT`（默认 8s，钳制 0–12s）；`work.acquire(timeout=queue_wait)` 在桥接内有界排队，而非把退避推给调用方；超时仍 fail-closed 429 并写 `BRIDGE_BUSY` 证据（含 `waited_seconds` / `max_concurrency`）；`/status` 暴露 `admission`。 |
| 退避预算 | `plugins/local_quant/provider.py` | `RETRY_DELAYS=(0.15,0.3,0.6,1.2,2.4,3.0)`，六次总预算约 7.65 秒；仍**仅对 429 重试**，503 立即 fail-closed 上报。 |
| 交易时段边界 | `bridge/live_sources.py` | 新增 `quote_session_state(dt)` / `hhmm()`：`BEFORE_SESSION`（拒绝）/ `MORNING_SESSION` / `LUNCH_BREAK`（锚定 11:30）/ `AFTERNOON_SESSION` / `AFTER_CLOSE`（锚定 15:00）。新鲜度门槛从墙钟改为**最后一个时段边界**；午休与收盘后保留定版快照并如实标 `stale=true` / `wall_clock_lag_minutes` / `session_phase` / `freshness_reason`，停牌（最后成交在数小时前）、无时钟、时钟超前、日期不一致仍一律排除或报错。`timestamp` 保持握手会话时钟不变（上游 `quote_service` 用它做当日归属与 final 定版确认），新增 `source_event_hhmm` 作逐标的时刻证据。`depth()` 同步用同一相位标签替代笼统的 `AFTER_HOURS_FINAL_BOOK`。 |
| 运维配套 | `scripts/rotate_logs.py`、`pytest.ini`（新） | `_gzip_into()` 改为先 `is_dir()` 再创建，规避沙盒 `mkdir(exist_ok=True)` 的 `FileExistsError`；`pytest.ini` 固定 `testpaths=tests`，避免 `runtime/backup-pre-upgrade-*/tests/` 同名模块导致裸跑 `pytest` 的 `import file mismatch`（18 个收集错误）。 |

### 运行态处置（11:49–11:52，午间休市窗口）

- `docker stop tsp-local` → `manage.py stop` → `rotate_logs.py --apply --bridge-log` → `manage.py start` → `docker start tsp-local`。归档保留：`runtime/archive/source-audit-20261105-114954.jsonl.gz`（7.94MB）、`evidence-20261105-114954.jsonl.gz`（9.49MB）；`evidence-*` 为独立完整链段，不参与 `--prune`。活动文件归零并从 GENESIS 起新链。
- 轮转前 `doctor.py` = **14 PASS / 2 WARN / 1 FAIL**（`evidence_chain` FAIL）；轮转并重启后 = **16 PASS / 1 WARN / 0 FAIL**，证据链 `chain_ok=true, seq_ok=true, damaged=0, write_failures=0`。唯一 WARN 仍是历史主线未重算的设计性提示。

### 验收证据（全部真实链路）

- `pytest` **242 passed**（227 → +15）；`verify_sources.py` **8 PASS**；容器内 `verify_tsp.py` 三域名 `free-api.tickflow.org` / `fuyao.aicubes.cn` / `1.1.1.1` 全阻断、跨期分钟 96 根；`doctor.py` **16 PASS / 1 WARN / 0 FAIL**。
- 桥接 `/status`：`admission={max_concurrency:8, queue_wait_seconds:8.0, rate_per_min:600, policy:"bounded queue, no silent fallback"}`；`evidence.enabled=true`。
- **6 路并发** `GET /api/kline/minute?...&live=1`：全部 200，最大 1.97s，整体 1.97s。**12 路并发**（超过并发上限，走排队）：全部 200，最大 4.05s，整体 4.05s，延迟分布 0.72–4.05s。证据链中 `BRIDGE_BUSY` / `RATE_LIMITED` 计数 **0**，即不再触发 429 退避风暴。
- **午休实时行情**：修复前 0 行且 503；修复后 `market_snapshot()` 5,569 行、桥接 `/query?dataset=realtime` 200 / 5.88s / `count=5569`，样本 `session_phase=LUNCH_BREAK`、`quote_boundary_hhmm=11:30`、`source_event_hhmm=11:29`、`stale=true`、`freshness_reason=LUNCH_BREAK_FINAL_SNAPSHOT`、`clock_evidence=TDX_HANDSHAKE_DATE+PER_SYMBOL_HHMM`。
- **fuyao Key 落地复核**（只读、不回显）：`runtime/fuyao.env` 存在、`0600`、56 B，变量名 `FUYAO_API_KEY`、非空、长度 41；根目录 `.env` / `data-local/user_data/secrets.json` / `compose.yaml` 均无 FUYAO 且 `runtime/` 未挂载；`data-local/fuyao/manifest.json` 记 `imported_at=2026-11-04T21:16:19+08:00`、`key_present_in_this_file=false`、`pit_enabled=false`、概念 390 板块 / 70,601 成分、行业 320 / 10,287，三表 5,580 只零缺失。**Key 已配置且已落地，但按设计只供宿主机离线导入，容器内不可见、域名仍阻断。**

### 仍关闭 / 未做（严禁记为完成）

- A05 准入切换、B01–B05、C01–C08、D01–D05、E01–E05 仍按原计划；本阶段只修复运行缺陷与用户可见故障，**未新增原子项完成声明**。
- B 系列「实时质量门控」仍未整体实现：本阶段只把午休/收盘后的定版快照判定修正并留证，单标的秒级时刻、ETF 实时快照、真实盘中窗口 E01 仍未做。
- 今日收盘后盘后管道仍未执行（§8 SOP 第 2 条；文档记载已安排 16:30 一次性自动化 `TSP 11-05 盘后管道与验收`）。

## 继续实施记录（2026-11-05 晚间）

本段补齐 B/C/D/E 四阶段中此前未落地的**可执行工程**与 fail-closed 强制逻辑；全部以单元/集成测试为验收，全量 `pytest` 由 285 → **319 passed**（+34）。

### 新增/落地模块

| 项 | 文件 | 内容 | 测试 |
| --- | --- | --- | --- |
| B03 | `overrides/realtime_quality.py`（新） | `gate_row/gate_batch/attach`：在原生 daily/enriched/监控/五档定版前逐标的检查 `clock_evidence` 与 stale 标记；混合批次含停牌过期行不靠最大时间放行；午休/收盘定版快照保留 stale；缺档五档 `FLAG_INCOMPLETE` 不补零；`attach` 接入真实路径（容器内生效，宿主 venv 安全 noop）。 | `tests/test_realtime_quality.py` **10 passed** |
| C03 | `bridge/announcement_ledger.py`（新） | `AnnouncementLedger`：严格分离 `ann_date`/`report_date`(报告期)/`legal_deadline`/`first_collected`，缺真实公告日 → `ann_date=None, ann_date_verified=False`；`available_at()` 无证据 fail-closed。 | `tests/test_announcement_ledger.py` **7 passed** |
| C06 | `bridge/pit.py`（新） | `PITStore`：按 `available_at<=decision_at` 服务版本；`strict_backtest` 缺证据区间拒绝并登记 `rejection_coverage`；不补造历史版本。 | `tests/test_pit.py` **6 passed** |
| C07 | `overrides/pit_policy.py`（新） | `PITPolicy.evaluate`：PIT 敏感域（financial/equity/membership/adjustment）无证据 BLOCK 回看；纯价格研究（NON_PIT_DOMAINS）ALLOW 不误伤；`attach` 接入真实路径。 | `tests/test_pit_policy.py` **5 passed** |
| E01 | `scripts/validate_live_session.py`（新） | `validate_session`：plan/captured 比对；无真实采集 → `MISSED`；采集区间不在计划窗口 → `REJECTED_NOT_LIVE`；覆盖/延迟/错误/异常/恢复分别统计；`main()` 支持 `--plan/--captured/--write-plan`。 | `tests/test_live_validation.py` **5 passed** |
| B04/C08 | `overrides/bootstrap.py` | 接入 `attach_realtime_quality(app)` 与 `attach_pit_policy(app)`，门控进入真实原生链路。 | 导入验证通过 |

### 此前已完成、本次核对确认的模块（计划勾选补登）

B01/B02/B05（quote_quality/live_sources/provider）、C01/C02/C04/C05（financial_schema/local_financial/tdx_local/router 财务）、D01/D02/D03/D04/D05（audit_history/coverage/asset_rules/index-ETF/provider 跨资产）、E02（verify_tsp）/E03（source_panel）。上述在原接管阶段已实现并测试，本次在 `tasks/p0-p1-plan.md` 勾选补登，未重新发明。

### 仍关闭 / fail-closed（严禁记为"历史已恢复"）

- **历史 PIT 证据仍未获得**：C03/C06/C07/C08 的强制逻辑已就位，但本地源**没有真实公告日 / 历史成分与成员版本 / 三表历史字段映射原件**。因此「历史时点一致性 / PIT 财务因子与回测」仍关闭——`pit_verified=false`、`ann_date=None`、需要历史证据的回测区间被拒绝。这部分只完成了"严格隔离与从现在起的版本留存"，历史恢复保持未完成。
- **E01 真实盘中验收未执行**：验证脚本与测试就绪，但**尚未在任何真实开市窗口捕获 session**；在当前非交易时段运行时结果必为 `MISSED`，不补历史冒充实时验收。
- **A05 准入切换**：`freshness_gate` 仍是 `ADVISORY_NOT_ENFORCED`，需 E01 真实窗口验收后再切为强制。
- 单标的秒级时刻、ETF 实时快照、离线自动刷新、桥接守护/自启、历史主线重算、pipeline_pull_index/regime_enabled 等仍保持关闭。
- 全程未动 `upstream/`、未改 v0.3.29 digest、未动偏好开关、未改 `data-local/` 既有数据；只新增上述 `bridge/`、`overrides/`、`scripts/`、`tests/` 文件与 `bootstrap.py` 接入。

## eltdx 重新研读与契约修复实施记录（2026-11-05 深夜）

用户将 eltdx 源码（`ref-doc/eltdx-main/` 仓库树 + `eltdx-tick-adapter数据源.zip`）置于项目，要求重新研读并配置到 TSP。本轮结论与修复如下。

### 研读取结论

- `ref-doc/` 中的 eltdx 仅为**源码树副本**：`src/eltdx/client.py` 公开 API（`session/codes/quotes/bars/corporate/helpers/money_flow/workdays/f10/ex` 子客户端），`docs/helpers/完整行情.md` 确认 `full_quotes` 每批 80 码、QuoteSnapshot 字段等。zip 内是同一源码副本，**无额外数据源**。
- 已安装版本为 **eltdx 3.3.2**（非 ref-doc 源码树版本）。TSP 适配器结构与该版本基本兼容，无需重写。
- 按项目红线（不升级、不改 upstream），ref-doc 仅作** API 形状核查来源**，未替换已安装包。

### 真实 API 记录形状（introspect 已安装 v3.3.2 确认）

| 记录 | 来源方法 | 关键字段 | 含 full_code? |
| --- | --- | --- | --- |
| `RealtimeRankRow` | helpers.realtime_rank | full_code / name / last_price / pre_close / change_pct / amount / volume_hand / raw | **有** |
| `CategoryQuoteRecord` | （raw） | exchange / code / server_time_raw / open_price / high_price / low_price / pre_close_price ... | 无 |
| `QuoteSnapshot` | helpers.full_quotes | exchange / code / last_price / pre_close_price / total_hand / buy_levels / sell_levels ... | 无 |
| `QuoteRefreshRecord` | quotes.get_depth | exchange / code / update_time_raw / last_price / last_close_price / buy_levels / sell_levels ... | 无 |
| `FinanceRecord` | corporate.finance_batch | exchange / code / updated_date / ipo_date / eps_raw ... | 无 |
| `SecurityCode` | codes.all_markets | exchange / code / name / category ... | 无 |
| `KlineBar` | bars.get | time / open / high / low / close / volume_lots / amount / last_close_price_milli ... | —（TSP 读取字段全部正确） |

### 核心问题

TSP 既有 eltdx 测试**全部 mock** 客户端，因此即便适配器读取的真实字段名不存在，单测仍会 pass，**运行时才爆**。用户「很多功能有些问题」正源于此。

### 真实隐藏 Bug（被 mock 掩盖）

`live_sources.py` 的 `instruments()` / `realtime()` / `depth()` / `finance_snapshot()` 四处在**没有 full_code 的记录**上读 `_attr(r,'full_code')` → `canonical_symbol(None)` → `ValueError`；唯 `market_snapshot()`（用确有 full_code 的 `RealtimeRankRow`）正确。depth/finance 的既有测试因 mock 用了 full_code 而通过，掩盖了契约漂移。

### 修复

新增 `bridge/live_sources.py::_symbol_of(obj)` 统一解析（优先 `full_code`，回退 `exchange+code`），替换 6 处符号读取：`instruments()` / `realtime()` / `market_snapshot()`（两处）/ `depth()` / `finance_snapshot()`。

### 新增契约测试

`tests/test_eltdx_adapter_contract.py`（**15 用例**）：introspect 已安装 eltdx，断言 TSP 依赖的每个方法 / 返回字段真实存在，并用**真实形状记录（无 full_code）**驱动 `LiveSources`，捕获 mock 掩盖的契约漂移。首跑 23 passed / 1 failed（`test_bar_record_fields` 误 import `eltdx.models.minute.KlineBar`，实际在 `eltdx.models.kline`），修正后全绿。

### 验收证据

- `pytest tests` **334 passed**（319 → +15 契约测试），无回归。
- `test_live_sources.py` + 契约测试共 24 passed（契约 15 + live_sources 9）。

### 仍关闭 / 未做

- eltdx 适配修复只覆盖「符号解析」这一契约面；真实盘中验收 E01、历史 PIT、A05 准入切换仍按前文 fail-closed。
- ref-doc 源码树未替换已安装 eltdx 3.3.2（红线：不升级/不改 upstream），仅作 API 形状核查来源。
- 全程未动 `upstream/`、v0.3.29 digest、偏好开关、`data-local/` 既有数据。

## fuyao 历史 PIT 数据应用（2026-11-05 晚间，用户确认方案 B）

用户指出 fuyao 能取到历史 PIT 数据并质问"你应用了吗"。核查结论：**此前完全没接**——PIT 三件套（C03/C06/C07）对 fuyao 零引用，数据一直以 `pit_verified=False` 候选形态躺在 `data-local/fuyao/`，PIT 全关。但实测 fuyao 并非"无历史 PIT 原件"：**近期(2026)披露日是真的**（三表交叉验证、滞后 24–114 天在法定窗口内），只是更早(2025 及更早)被按季度回填(滞后 389–479 天)或三表冲突，**不是真 PIT**。因此之前"历史 PIT 证据缺失"的结论对近期是错的——近期数据有，但被我和盘托出成候选、连近期真数据也一起关了（过度保守、误伤可用数据）。

### 用户选定方案 B（近期真实披露日接入 PIT + 2024–2025 财务数值作观察值）

新增/改动：

| 项 | 文件 | 内容 |
| --- | --- | --- |
| 桥接 | `bridge/fuyao_pit.py`（新） | `load_fuyao_pit()`：只读 `financial_announce_candidates.parquet`，**仅** `report_date_quality==ANNOUNCE_DATE_CANDIDATE`（16,716 行）喂入 `AnnouncementLedger` 与 `PITStore(financial)`，`available_at`=真实披露日；回填/冲突/缺失行一律排除。`fuyao_pit_summary()` 供 `/status`。 |
| 路由 | `bridge/router.py` | 新增 `pit` 属性（惰性建桥）+ `query_financial_pit(symbol, decision_at, table)` 真实 PIT 入口：近期决策 `ALLOW`（按披露日选定 period_end 并回带 fuyao 观察值），历史决策 `BLOCK_NO_PIT_EVIDENCE`；`financial` metadata 增 `pit_recent_evidence_total` / `pit_coverage='RECENT_2026_ONLY_HISTORICAL_OBSERVED_NOT_DATED'`。 |
| 状态 | `bridge/server.py` `/status` | `fuyao_pit` 由 `DISABLED_REPORT_DATE_MS...` 改为 `fuyao_pit_summary()`（ENABLED_RECENT_ONLY + 计数）；`financial_pit` 改为 `PARTIAL_RECENT_2026_VERIFIED`；`financial` 链路标注 `+FUYAO_OBSERVED`；`note` 如实写清近期 PIT 可用、历史观察值不定日。 |
| 策略 | `overrides/pit_policy.py` | `attach()` 现默认加载 fuyao 喂出的 store，使 C07 对近期决策 ALLOW、历史 BLOCK（上游无 PIT 入口仍为 no-op，但策略已就绪）。 |
| 测试 | `tests/test_fuyao_pit.py`（新，7 用例） | 验证仅候选行入 PIT、近期决策解析到披露日、决策早于披露日/历史决策被 BLOCK、router 与 policy 一致。 |

### 实测验收（真实 parquet）

- `fuyao_pit_summary`：`state=ENABLED_RECENT_ONLY`，`verified_recent_count=16716`，`excluded_not_pit_count=28071`（冲突 22,149 + 回填 5,900 + 缺失 17 + 窗口外 5）。
- ledger：`total=16716, ann_date_verified=16716, ann_date_unknown=0`（只装了候选）。
- `query_financial_pit('000001.SZ','2026-05-01')` → `ALLOW` / `served_available_at=2026-04-25` / `period_end=2026-03-31` / `value_present=True`。
- `query_financial_pit('000001.SZ','2025-06-01')` → `BLOCK_NO_PIT_EVIDENCE`（历史不伪造）。

### 仍诚实保留的边界

- **历史(2025 及更早)披露日仍 fail-closed**：fuyao 那些行是回填/冲突，未进入 PIT；深度历史 PIT 回测仍被拒。
- **2024–2025 财务数值作观察值开放但非 PIT 定日**：可用于财务研究/筛股，但不用于"在某决策日已可得"的定日回测（其 `pit_verified=False`）。
- **字段映射未独立验证**：fuyao 三表字段映射继承自 upstream provider，`field_mapping_verified=False`，数值可信度需后续独立核对。
- 红线：未动 `upstream/`、v0.3.29 digest、偏好开关、`data-local/` 既有数据；fuyao Key 仍在宿主机 `runtime/fuyao.env`，容器域名仍阻断。
- 全量 `pytest` **341 passed**（334 → +7 fuyao_pit 用例），无回归。
