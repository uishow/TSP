# TSP 本机部署

- [x] 检查并启动 Docker；引擎 29.6.1 / aarch64，镜像下载中。
- [x] 创建 compose.yaml 和 .env：绑定 127.0.0.1:3018，持久化 ./data，不挂载 Codex 凭据。
- [x] 拉取并启动官方镜像，验证容器与健康接口。
- [x] 初始浏览器页面已验证；本地版HTTP/API已验证，新一轮浏览器自动操作被Work设置禁用。

## Review

已核验镜像、健康接口、HTTP页面、真实数据链路和启停；本地版视觉验收受Work浏览器设置限制。详见data-source-review.md。

## 下载故障与调整

Docker 原生 pull 遇到 TLS timeout / blob EOF。改用主机从官方 GHCR 下载同一 ARM64 manifest（sha256:f9609f4411d8429e282cdffed72aa23afafb4001162644635b73e17877cd2206），校验压缩层 digest、解压层 diff_id 后导入 Docker；不修改全局网络设置。

# 数据源接入计划（2026-11-04，用户已 go 批准）

## 已确认与运行状态

- [x] 官方镜像已完成 19 层摘要与解压层校验，导入后的文件系统和启动配置与官方一致。
- [x] TSP v0.3.27 容器曾达到 healthy，/health 返回 ok，浏览器看板可正常显示。
- [x] 收到指定来源要求后停止 tsp-local，终止 TickFlow 免费取数；已有下载与任务证据保留，待接入时隔离标识。
- [x] 只读核查本地指南、SDK、统一查询层及 TSP 插件契约；7899 服务可达。

## 架构与不变量

本机只读桥接服务（TSP/bridge/，独立虚拟环境）复用本机 SDK 读取 free-stockdb 及 Parquet，补充读取已授权通达信 export/vipdoc；实时网络适配 eltdx，AxData 提供可配置的白名单替代能力。TSP 使用官方 Python provider 插件接桥接服务，沿用现有存储、指标和页面，不复制或修改上游数据库。桥接只提供固定数据查询接口，不接受任意文件路径/任意 URL；鉴权并限制访问范围，容器只持有桥接访问配置。

实时/当日任务按交易日、行情时间和数据完整性决定是否请求最新数据；历史研究按截止时间与来源版本读取，qfq 记录复权基准，不能声称现今复权历史天然满足 PIT。所有价格、成交量（股/手）、成交额、时区、财务公告日明确转换；缺失或来源失败必须显式返回，不补零、不回退到未允许的远程源。

已发现统一查询层 query.py 两项需在 TSP 适配层规避：get_5min 的 adjust 没有传入 2025+ SDK 段；8 位 end 日期右补 0 会截到当日 00:00。不得直接当作跨期原始价接口复用。

## /decompose：依赖顺序与原子实施项

以下每项最多涉及两个主要实现文件；任何范围扩大先更新计划。

- [x] 1. 固化读取契约与样本验收基线（docs/data-source-contract.md、tests/test_source_contract.py）：股票/指数/ETF标识、raw/qfq、日期闭区间、单位、最新判断与来源字段；验证跨 2024/2025 边界。
- [x] 2. 本地存储适配（bridge/local_store.py、bridge/schemas.py）：free-stockdb 原始日K/分钟K、历史5分钟Parquet、股票清单和板块；仅按请求窗口读取，留存缺失与源日期。
- [x] 3. 通达信适配（bridge/tdx_local.py、tests/test_tdx_local.py）：export、day/lc1/lc5、专业财务及板块映射；按格式核对价格/量额/复权，缺公告日期不伪造 PIT。
- [x] 4. 实时适配（bridge/live_sources.py、tests/test_live_sources.py）：eltdx 主路径、AxData 明确配置的替代路径，锁版本、限频、重试、最新时间/陈旧状态；禁止隐式其他源回退。
- [x] 5. 路由与新鲜度（bridge/router.py、tests/test_routing.py）：本地覆盖且满足用途则直接读取，否则在允许范围内补充；同键冲突保留来源与取舍证据，历史截止约束及失败传播测试。
- [x] 6. 只读桥接入口（bridge/server.py、bridge/requirements.txt）：固定接口、批量查询、范围上限、认证、健康/来源状态，配置本机SDK独立环境，不修改全局Python。
- [x] 7. TSP Python数据源插件（plugins/local_quant/provider.py、plugins/local_quant/plugin.yaml）：适配 daily/minute/realtime/depth/adj_factor/financial，能力只声明已验证项；板块/扩展表消费现有契约。
- [x] 8. 严格来源约束（overrides/source_policy.py、overrides/bootstrap.py）：封闭默认TickFlow及fuyao网络回退、指数/ETF/日历等旁路；插件缺失或桥接断开必须报明确不可用，保留失败记录。
- [x] 9. 部署集成（compose.yaml、scripts/start-local.sh）：本机桥接启停、容器挂载插件与覆盖层；启动前验证来源政策；旧TickFlow缓存保留在独立位置，新的运行数据使用独立目录。
- [x] 10. 端到端核验（tests/test_tsp_integration.py、tasks/data-source-review.md）：API/浏览器/策略扫描与短窗口回测真实数据链路，断桥/缺源/过期/联网白名单与跨期口径测试，记录全量能力覆盖和未支持项。
- [x] 11. 运维交付（README.local.md、tasks/todo.md）：访问地址、启停、来源优先级、覆盖区间、故障与限制、回滚到备份的方法；无 Key 依赖、无自动下单。

## Review：待验收

真实本地样本与上游读取结果逐条对账；raw/qfq隔离、跨期日期末日完整、分钟聚合、股/手转换、财务可用日、源冲突/陈旧、禁用源零调用、断源失败提示、容器重启和持久化、浏览器可见来源状态。部署成功不代表历史数据完整、PIT合格或策略盈利验证通过。

## 实施补充与复核

- 新增来源状态页面 /local-sources，沿用原SPA布局入口；override处理原SPA catch-all路由顺序，测试覆盖。
- 新增local_extensions.py复用扩展表契约，按采集日/内容hash保留概念行业证据；没有改动主数据库或上游源码。
- 表单/桥接日期兼容YYYYMMDD和YYYYMMDDhhmmss，规范化后比较，防止紧凑日期静默返回空结果。
- 财务接入完成至原始观察层；完整PIT财务与三大报表映射未完成、不开放能力。AxData只支持显式TDX快照路径，eltdx负责日/分钟K。
- 原11项的实现与验收工作已执行；以上语义未验证项保留限制，不视为盈利、PIT或完整财务达标。
- 真实初始化 c5e246f696 成功；1318965是指标行数，241是交易日数，不能互换。
- 真实扫描和带费用滑点回测、跨期分钟、禁用源阻断、实际断桥503及恢复通过；证据见data-source-review.md。

- 最终回归75项通过，语句覆盖约84%；本地分类扩充至2008（含通达信地区/风格/指数/自定义）。
- 重启后板块成为首个请求时的SDK导入顺序问题已复现并根治，新增回归防止依赖之前的日K请求初始化。

## 已批准范围的续验（2026-11-04）

- [x] 修正全量分钟请求超出桥接200只上限，拆成20只一批；205只回归不再越界。
- [x] 日K当前窗口显式请求新鲜度，历史固定窗口不触发最新联网。
- [x] 原生TSP会丢弃stale并保留null时间行情：快照/五档改为仅来源观察页，不声明原生实时监控可用，不允许当日实时落盘。
- [x] 复核指数/ETF真实价格与代码映射、服务恢复和更新后的回归结果。
- [x] 沪深ETF日线价格缩放修正；成交量逐条通过金额/价格区间约束判定，无法证明保持null；指数+沪深ETF真实样本对账通过。
- [x] 带时区时间转北京时间墙钟；日线日期与datetime起点混比导致的首日遗漏已测试修正。
- [x] 首日补导与指标重算完成；归档旧版本，已有原日线hash未变；242个交易日/1324389行，85项测试通过。

## P0/P1 全项推进（2026-11-04）

- [x] 按未完成清单重新核对现实现并并行只读排查，保持现系统运行。
- [x] 具体原子步骤、文件范围、并行依赖和真实完成标准已写 tasks/p0-p1-plan.md。
- [x] 浏览器访问已恢复，本轮实际读取看板及来源页，不再沿用“浏览器禁用”的旧阻塞状态。
- [ ] 等待用户确认新增P0/P1具体计划；确认后按完整范围连续执行，不逐项重复请求批准。
- [ ] 完成P0/P1实现与逐项实际验收，更新 tasks/p0-p1-review.md；不可把缺失历史证据或未发生实时窗口勾完。

## 本轮接手：系统恢复运行（2026-11-04 盘中）

- [x] 诊断：容器 healthy、7899 在线，但桥接 7818 进程已退出，页面可开而数据查询不可用；启动脚本在已存在 runtime 目录上抛 `FileExistsError`。
- [x] 修复 3 处路径 / 进程兼容问题（`scripts/manage.py` 两处、`bridge/server.py` 一处），未改动取数逻辑、上游代码与源数据。
- [x] 恢复并验证：桥接 healthy、TSP 3018 healthy；真实查询覆盖日K、跨期5分钟、5510 只清单、2008 分类、复权因子、指数与ETF。
- [x] 验收：85 项回归、`verify_sources.py` 8 项 PASS、容器内 `verify_tsp.py` 端到端通过、`stop → start` 闭环通过，重启后首个请求查板块 2008 条成功。
- [x] 新鲜度对账：源末日 2026-11-03 = TSP 缓存 as_of 2026-11-03；盘中日K不补数、分钟按需补 eltdx，逻辑实测符合预期。
- [ ] 16:00 后本地同步 11-04 数据，同步完成后在 TSP 数据页手动执行盘后管道；盘中不执行。
- [ ] `tasks/p0-p1-plan.md` 的 P0/P1 仍待用户确认，本轮未执行；完整财务/PIT 限制维持关闭。

## 用户追问「实时行情为什么没有刷新」后的修复（2026-11-04）

- [x] 定位根因：插件未声明 realtime → 上游每轮回退到被置 None 的付费客户端，只留警告不刷新；eltdx 能取数但没有路径送到行情。
- [x] 实测取证：eltdx `session.handshake()` 提供可核验 server_datetime/server_date；`realtime_rank(count=6000)` 一次返回 5580 行约 3.5s；`full_quotes` 批量会抛 MissingCodesError，不适合全市场。
- [x] 实现：`bridge/live_sources.py` 新增 `market_snapshot()`（日期校验 + HHMM 新鲜度门槛 + 停牌/无成交过滤 + 百分数转小数 + 毫秒时间戳）；`bridge/router.py` 空 symbols 路由全市场；`plugins/local_quant/provider.py` 与 `plugin.yaml` 声明并实现 realtime；带 symbols 的单只观察路径不变。
- [x] 状态与文案同步：`bridge/server.py` /status、`overrides/source_panel.py` 页面说明、README 与 docs/live-sources.md 不再声称实时关闭。
- [x] 验收：91 项回归通过；`verify_sources.py` 8 项仍 PASS；重启后能力路由显示实时可用，14:38:48 / 14:39:53 连续两轮「行情刷新: 5575 只股票, 0 只ETF, 4 只指数」；enriched 缓存 latest_date=2026-11-04、5631 行，600031.SH 为盘中价 18.68。
- [ ] 未做且需明确：ETF 实时快照、五档定版、单标的秒级行情时刻独立验证；P0/P1 其余项仍待批准。

## 阶段1 收口与交接（2026-11-04 15:40）

- [x] 阶段1 交接文档成文：`tasks/phase1-handover.md`（含运行状态、不变量、阶段2 三个问题的只读定位结论与可执行路径、踩坑教训、复现验证清单、限制项）。
- [x] 阶段2 三问题完成只读定位，**未改动任何代码**：
  - [ ] 问题1 自选股重复：根因为 `kline_daily_enriched/date=2026-11-04` 含 303 个重复 symbol → 内存 enriched 缓存重复 → `api/watchlist.py:500` 的 join 放大。修复需「防御性去重 + 重建 enriched 分区」两处。
  - [ ] 问题2 五档盘口/财务：五档已实测 eltdx `client.quotes.get_depth()` 可取（买卖各5档 + 委比 + 内外盘）；财务 eltdx 不提供，须走通达信 `vipdoc/cw` 或 free-stockdb，且无公告日只能声明原始观察层。
  - [ ] 问题3 板块 fuyao 报错：源于 ext_data 预设 `ext_gn_ths`/`ext_hy_ths` 指向 fuyao，而来源政策已阻断 fuyao 域名 → 本机架构下不可能成功；应改消费本地 `boards`（2008 条）。
- [x] 澄清一条非故障：15:01:05「收盘 最终行情同步完成 (快照时间戳已达边界), 进入休盘态」——收盘后无 `行情刷新` 属设计如此，不是停摆。
- [ ] 遗留脏数据：`data-local/kline_daily_enriched/date=2026-11-04` 3391 行 / 2362 唯一（303 重复），随问题1 一并清理。

> **历史快照消歧（2026-11-05 补注）**：上面 3 个 `[ ]` 与「遗留脏数据」是阶段1 暂停当时的真实状态，**不是当前未完成项**。三者已在阶段2 全部实施并验收（见下方「阶段2」段）：自选股去重、五档/财务接入、板块改本地来源；`kline_daily_enriched` 重复已由 `scripts/repair_enriched_duplicates.py` 原子重建清零。另：问题2 当时的「eltdx 不提供财务」结论已被阶段2 推翻（eltdx 有 `corporate.finance_batch`）。原文保留不改，以免篡改历史记录。

## 阶段2：三个用户可见问题全部实施并验收（2026-11-04 盘后）

- [x] 问题1 自选股重复：`scripts/repair_enriched_duplicates.py` 备份并原子重建 enriched 当日分区（3391 行 / 1029 重复 → 2362 行 / 0 重复）；`overrides/source_policy.py::install_enriched_integrity()` 在 KlineRepository 四处读写路径按 symbol 去重，防止增量递归复发。验收 `/api/watchlist/enriched` → `count=2`，`['002474.SZ','001219.SZ']`。
- [x] 问题2 五档：`bridge/live_sources.py::depth()` 改走 eltdx 原生 `quotes.get_depth()` (0x0547)，握手日期 + 逐标的 HHMMSS 构造时间，无时钟/无价/无盘口/缺代码显式失败，不足 5 档不补零；实测 600031.SH / 002474.SZ / 001219.SZ 均返回完整买卖 5 档。`plugin.yaml` + provider 声明 `depth5`，实现 `get_depth_batch()`。
- [x] 问题2 财务：更正交接文档旧结论——eltdx **提供** `corporate.finance_batch()`。新增 `bridge/finance.py` 观察层（本地 gpcw 报告期 + eltdx 最新命名快照 → 上游 5 张表），`announce_date` 恒空、PIT 标记全 false；20 只分片 + 失败二分绕过 32 次 recover 预算。provider 声明 `financial` 并实现 `get_financials()`；能力矩阵与 `/api/financials/status` 已可用。
- [x] 限流韧性：全量财务同步末尾曾因桥接 240 次/分限流导致 `shares` 表为空；桥接限流改为 `TSP_BRIDGE_RATE_PER_MIN`（默认 600）可配置，provider 对 429 仅做有界退避重试，503 fail-closed 立即上报。
- [x] 问题3 板块：`overrides/local_extensions.py` 把 `ext_gn_ths` / `ext_hy_ths` 的 fuyao URL / `fuyao_api_key` / fanout / error 状态全部清除，写入本地 boards 真实数据（5506 / 5507 行）；`install_local_presets()` 在 app.main 导入前替换 `ensure_builtin_presets`，重启不复活 fuyao；`monitor_ext_fields` 指回出厂表并修正上游拼写。10 张扩展表全部有数据。
- [x] 文档与回归：`README.local.md`、`docs/live-sources.md`、`tasks/phase1-handover.md` 同步；`pytest` 113 项通过；重启后三条启动钩子日志齐全，扩展表配置中 `fuyao` 零残留。
- [ ] 仍关闭（不勾完成）：ETF 实时快照；单标的秒级行情时刻独立验证；盘中连续五档回放；完整财务三大报表 / 公告日 / 历史 PIT 财务因子；P0/P1 清单待用户批准。

## 阶段3：fuyao Key 可用的离线增强（2026-11-04 晚间）

用户已提供同花顺 fuyao API Key，选择实施范围「财务 + 官方分类」。结论：**不做主数据源**，只做宿主机旁路离线导入。

- [x] Key 只写 `runtime/fuyao.env`（0600，不挂载进容器、已在 `.gitignore`）；不写 `.env`（compose `env_file` 会注入容器）与 `data-local/user_data/secrets.json`（挂载进容器）。实测全仓零 Key 泄漏。
- [x] 探活与语义核验：fuyao HTTPS 可达、无 Key 返回 `Missing X-api-key`；`thscode` 与本地 `symbol` 同构；4 只 × 3 表 × 8 期 = 96 行证据见 `tasks/fuyao-probe.json`。
- [x] **关键结论**：`report_date_ms` 不是可验证的 PIT 公告日（历史期按季度回填 389–479 天、16 个键三表冲突），上游 provider 直接映射 `announce_date` 不成立；导入绝不写 `announce_date`，只写候选日 + 质量标签，`pit_verified=false`。
- [x] 新增 `bridge/fuyao_offline.py` + `scripts/import_fuyao.py`：宿主机离线导入、断点续跑、原子写、失败标签化；中间缓存 `runtime/fuyao-cache/`，成品 `data-local/fuyao/`。
- [x] 全市场财务三表：5,580 只零错误，income 44,640 / balance_sheet 44,639 / cash_flow 44,640 行；候选公告日 44,787 键（候选 16,716 / 冲突 22,149 / 回填疑似 5,900 / 缺失 17 / 窗口外 5）。
- [x] 官方分类：概念 390 板块 / 70,601 成分、行业 320 板块 / 10,287 成分，零失败；发布为独立新表 `fuyao_ths_concept`（5,580 行）/ `fuyao_ths_industry`（5,578 行），不覆盖 `ext_gn_ths` / `ext_hy_ths`，`monitor_ext_fields` 不自动切换。
- [x] 容器侧只读接入：`bridge/router.py` 新增 dataset `fuyao`、`bridge/server.py` `/status` 增加 `fuyao_offline` / `fuyao_pit`；metadata 固定 `no_network_access=true` / `key_in_container=false` / `pit_verified=false`。
- [x] `bridge/finance.py` 观察层只增加 `fuyao_*` 交叉标注列，`announce_date` 仍为空、PIT 仍关闭。
- [x] `/local-sources` 页面新增 fuyao 下拉项与官方分类发布按钮（`POST /api/local-sources/fuyao/publish`）；只有导入完整才发布，不写半成品。
- [x] 不变量复核：固定镜像、`upstream/`、容器零外联白名单、provider 锁定、能力矩阵（7 项 `effective=local_quant`）、`verify_tsp.py` 阻断断言全部未改；`network_blocks.fuyao.aicubes.cn=true`。
- [x] 验收：`pytest` 139 项通过；`verify_sources.py` 8 项 PASS；容器内 `verify_tsp.py` 通过；`/local-sources` HTTP 200；官方分类表含 `/` 的值 0 条。
- [x] 文档：`docs/fuyao-offline.md`（新）、`docs/data-inventory.md`、`README.local.md` 阶段3 章节、`tasks/phase1-handover.md` §10。
- [ ] 仍关闭：PIT 财务因子 / 回测、法定公告日、官方三表字段映射独立验证、板块成分历史版本、离线产物自动定时刷新；ETF 实时快照、单标的秒级验证、盘中连续五档回放、P0/P1 清单（待批准）。

## 阶段4：接收阶段2/3 交接并复验接管（2026-11-05 08:20 盘前，只读）

- [x] 接收两份入口文档：`tasks/handover-phase3-summary.md`（阶段3 唯一入口）、`tasks/handover-phase2-summary.md`（含 §10 接管基线、§11 盘后管道故障处置原始记录）。
- [x] 按阶段3 §8 SOP 第一步执行只读体检：`scripts/doctor.py` → **15 PASS / 1 WARN / 0 FAIL**（唯一 WARN 为 `mainline_history` 设计性提示）。
- [x] 跨夜复验：容器 `tsp-local` healthy（Up 10h）、7818/3018 均 200；`pytest` **181 passed**；`verify_sources.py` 8 项 PASS；容器内 `verify_tsp.py` 三域名 `free-api.tickflow.org` / `fuyao.aicubes.cn` / `1.1.1.1` 全阻断。
- [x] 三项原始用户问题逐项实测（不凭文档勾完成）：`/api/watchlist/enriched` 2 行 `['001219.SZ','002474.SZ']`；能力矩阵 `realtime/depth5/financial` 均 `usable=true / effective=local_quant`；`/api/financials/status available=true`；板块 `concept_count=390` / `industry=320`；桥接 `financial` 查询返回 `600031.SH` 观察层记录（`announce_date=null`）。任务 #8/#9/#10 据此关闭。
- [x] 新发现并澄清（已补入 phase3 §6.4 告警表）：**盘前 `depth5` 503** 源于 TDX 握手 `server_datetime=2026-11-05` 与 `server_date_1/2=2026-11-04` 不一致，`bridge/live_sources.py:301-303` 按 fail-closed 拒绝；开盘后自动恢复，非故障。`data-local/depth5/` 空目录是全部快照 `stale` 时不写无效数据的正确行为。另纠正一次统计口径误判（审计记录字段是 `metadata.source` 单数，按 `sources` 复数统计会误报「0 条成功」）。
- [x] 台账消歧：阶段1 段落的 3 个 `[ ]` 与「遗留脏数据」加补注，明确为暂停当时的历史快照、非当前未完成项；保留原文不篡改。
- [ ] **今日（11-05）收盘后**：先确认 free_stockdb 已同步 11-05 日K（含 `pre_close`/`change_pct`），再 `POST /api/pipeline/run` 并轮询到 succeeded，随后跑 `doctor.py` 与 `pytest`。盘前/盘中不得执行（fail-closed 会拒绝）。
- [ ] 待用户批准方可动：离线产物自动刷新、桥接守护/自启、历史主线重算。本轮**仅更新文档台账**，未动代码/配置/数据。

### 用户随后批准「1 盘后管道 / 2 升级 v0.3.29 / 3 启动 P0/P1」三项，逐项推进

- [x] **升级 v0.3.29 完成并全量验收**（详见 `tasks/handover-phase3-summary.md` §12）：
  - 升级前只读兼容性核对：取新镜像 `/app/app` 源码（285 py，Python 3.11.18 / polars 1.44.1 / fastapi 0.136.1），19 个上游模块 + 20 余个内部符号全在；AST 比对 `KlineRepository` 4 个被 patch 方法签名一致；两处「不兼容」经复核均为排查口径误判（`get_paid_realtime_client` 定义在 `app/tickflow/client.py`；`validate_preferences` 定义在覆盖层自身）。
  - 备份 `runtime/backup-pre-upgrade-20261105-084434/`（472MB / 27511 文件 + `ROLLBACK.md`），digest `c52e95144…` → `c1e8ca19…`，`docker compose up -d --force-recreate app`；启动日志 `08:45:11 Tick Stock Panel v0.3.29 starting`、五条钩子齐全零异常。
  - 同步 `scripts/doctor.py::PINNED_DIGEST`（升级后首次体检的 1 个 FAIL 是工具基线未跟上，不是系统故障）；`README.local.md` 首段同步；v0.3.27 历史证据文件保留不改。
  - 验收：`doctor` 15 PASS/1 WARN/0 FAIL、`pytest` 181 passed、`verify_sources` 8 PASS、`verify_tsp` 三域名阻断；设置页保存 200 且偏好 hash 幂等；看板 `breadth=2611/454/2431`、板块 390/320、自选 2 行、财务 available=true、7 项能力 usable=true。升级后首次 eltdx/axdata 瞬时超时，多轮探测恢复、重跑全 PASS（非故障）。
- [ ] **P0/P1 28 项**：已获批准启动，按「可实施 / 需 PIT 证据 / 明确关闭」分批推进；C03/C04/C06/C07/C08 依赖真实公告日与历史成分版本、E01 依赖真实盘中窗口，按 fail-closed 不得伪造。详见 `tasks/p0-p1-plan.md`。
- [ ] **今日收盘后盘后管道**：见上条，需等 15:00 收盘且 free-stockdb 同步完成。

## P0/P1 第一阶段实施（2026-11-05，用户批准「3」后）

完整清单、逐项证据与仍关闭项见 `tasks/p0-p1-plan.md`「第一阶段实施记录」；运维说明见 `README.local.md` 阶段4 章节。

- [x] **A01** `bridge/evidence.py` + `tests/test_evidence.py`：`runtime/evidence.jsonl` 内容寻址 + 链式哈希追加日志，成功/失败/缺失/冲突全记录，崩溃半行可恢复且报 DAMAGED，篡改可检测。
- [x] **A02** `bridge/local_store.py` + `bridge/router.py`：冲突/读失败完整入盘（双方值、源版本、精度、选择理由），`conflict_class` 区分 float32 舍入与实质分歧；router metadata 标 `degraded_local_read` / `PARTIAL_OBSERVED_ROWS_ONLY`。
- [x] **A03** `bridge/server.py` + `tests/test_bridge_api.py`：全量请求 outcome 持久化；`Query` 增 `as_of` / `purpose` / `scope`，拒绝未来窗口；固定契约与 legacy 审计日志格式不变；`/status` 增 `evidence`。
- [x] **A04** `bridge/calendar.py` + `tests/test_calendar.py`：本地通达信指数日线观测交易日日历，来源哈希/覆盖/版本留证，未来日期无开市权威、绝不「工作日即交易日」。
- [x] **A05 观察层**：逐标的边界覆盖、停牌候选、联网返回二次验证接入 metadata；`freshness_gate=ADVISORY_NOT_ENFORCED`，未改已验收的刷新准入。
- [x] **配套** `scripts/rotate_logs.py`：新增 `evidence.jsonl` 轮转，归档为独立链段且不参与 `--prune`。
- [x] **验收**：`pytest` 227 passed；`verify_sources.py` 8 PASS；`doctor.py` 16 PASS/1 WARN/0 FAIL（新增 `evidence_chain` 检查）；`verify_tsp.py` 三域名全阻断；桥接重启闭环；真实证据链 317 条 `chain_ok=true, seq_ok=true, damaged=0, write_failures=0`。
- [x] 真实发现并如实记录：49 条 float32 舍入（非冲突）+ 49 条 `tdx_local_lc5` 与 `local_parquet_5min_raw` 的实质分歧（2024-12-31 `600031.SH` 的 `low` / `amount`）。**只记录、不对账、不改数据**，根因属 D01/D02。
- [ ] **A05 准入切换未完成**：把 `freshness_gate` 改为强制需真实盘中窗口（E01）验收，计划中保持未勾选。
- [ ] B01–B05 / C01–C08 / D01–D05 / E01–E05 共 23 项尚未实现；C03/C04/C06/C07/C08 与 E01 按 fail-closed 不得伪造完成。
- [x] 本阶段未改 `upstream/`、v0.3.29 digest、偏好开关与任何 `data-local/` 既有数据；只新增 `runtime/evidence.jsonl` 追加日志。

## P0/P1 第二阶段实施（2026-11-05 午间，用户可见问题驱动）

完整故障链与验收数字见 `tasks/p0-p1-plan.md`「第二阶段实施记录」、运维说明见 `README.local.md` 阶段4续篇。本阶段未新增原子项完成声明，只修复运行缺陷。

- [x] **`/api/kline/minute` 30s 超时**：根因是桥接 2 槽并发立即 429 + provider 旧退避累计约 31s 撞破浏览器 30s `AbortController`。改为有界排队（`TSP_BRIDGE_MAX_CONCURRENCY=8` / `TSP_BRIDGE_QUEUE_WAIT=8s`）+ 退避预算 `RETRY_DELAYS=(0.15,0.3,0.6,1.2,2.4,3.0)` 约 7.65s，`/status` 暴露 `admission`；仅 429 重试，503 仍 fail-closed。实测 6 路并发全 200 最大 1.97s、12 路全 200 最大 4.05s、证据链中 BRIDGE_BUSY/RATE_LIMITED 为 0。
- [x] **证据链大记录断裂与日志膨胀**：`_tail()` 改指数扩窗（64KB→16MB）恢复链头；`store_large_payload()` + `_bounded_metadata()` 把 >8 条 `conflicts` 落到内容寻址 sidecar，两份持久化日志只留引用，**HTTP 响应契约不变**。
- [x] **日志轮转与重启**：11:49 停机窗口 `rotate_logs.py --apply --bridge-log`，归档 `source-audit-20261105-114954.jsonl.gz`（7.94MB）+ `evidence-20261105-114954.jsonl.gz`（9.49MB），活动文件归零从 GENESIS 起新链；桥接与容器重启后加载新代码。`doctor.py` 14 PASS/2 WARN/1 FAIL → **16 PASS/1 WARN/0 FAIL**。
- [x] **午休实时行情归零**：`quote_session_state()` 把新鲜度门槛从「握手墙钟」改为「最后一个时段边界」（午休 11:30 / 收盘 15:00），保留停牌、无时钟、时钟超前、日期不一致的 fail-closed 排除；定版快照标 `stale=true` + `session_phase` + `freshness_reason`。实测从 0 行/503 恢复为 5,569 行/200。
- [x] **fuyao Key 落地复核**：`runtime/fuyao.env` 0600 / `FUYAO_API_KEY` 非空长度 41；`.env`、`secrets.json`、`compose.yaml` 均无且 `runtime/` 未挂载；manifest `imported_at=2026-11-04T21:16:19+08:00`、`pit_enabled=false`。**Key 已落地，仅宿主机离线导入用，容器内不可见、域名仍阻断**。
- [x] **配套**：新增 `pytest.ini`（`testpaths=tests`）修复升级备份同名测试副本导致裸跑 `pytest` 的 18 个收集错误；`rotate_logs.py::_gzip_into()` 规避 `mkdir(exist_ok=True)` 的 `FileExistsError`。
- [x] **验收**：`pytest` **242 passed**；`verify_sources.py` **8 PASS**；`doctor.py` **16 PASS/1 WARN/0 FAIL**；容器内 `verify_tsp.py` 三域名全阻断、跨期分钟 96 根；桥接 `/status` admission 8/8.0s/600；证据链 `chain_ok=true, seq_ok=true, damaged=0, write_failures=0`。
- [ ] **今日收盘后盘后管道**：仍需 15:00 收盘且 free-stockdb 同步 11-05 日K 后执行；文档记载已安排 16:30 一次性自动化 `TSP 11-05 盘后管道与验收`。
- [ ] A05 准入切换、B01–B05 / C01–C08 / D01–D05 / E01–E05 共 23 项仍未做；C03/C04/C06/C07/C08 与 E01 按 fail-closed 不得伪造完成。
- [x] 未改 `upstream/`、v0.3.29 digest、偏好开关与任何 `data-local/` 既有数据。
