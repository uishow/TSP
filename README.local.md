# TSP 本地量化数据版

访问：[量化工作台](http://127.0.0.1:3018/) · [本地数据源与样本核对](http://127.0.0.1:3018/local-sources)

上游：https://github.com/shy3130/tick-stock-panel 。当前固定 **v0.3.29** 镜像（`sha256:c1e8ca1939a4ffed538394f799a75a1a309c191b20e99e0c02c6f82edd39d739`，2026-11-05 08:45 由用户批准升级）；升级前备份与验收记录见 `tasks/handover-phase3-summary.md` §12。v0.3.27 的来源摘要与导入校验保留在 `tasks/image-provenance.json`（历史证据）。`scripts/doctor.py::PINNED_DIGEST` 已同步为新 digest。

## 启停

Docker Desktop运行后，在终端执行：

```sh
cd /Users/beryllewis/private/stock/codex/TSP
./scripts/start-local.sh
# 查看状态
docker compose ps
.venv/bin/python scripts/manage.py status
# 停止
./scripts/stop-local.sh
```

桥接仅监听127.0.0.1:7818，Docker Desktop可通过host.docker.internal访问；服务端令牌保存在权限600的.env，浏览器不接触令牌。TSP仅发布127.0.0.1:3018。桥接不修改上游数据库，不触发free-stockdb同步。

本配置不修改macOS登录启动项。Docker可恢复容器，但本机重启后需运行start-local.sh恢复桥接；桥接未恢复时数据源明确不可用。

## 数据

- `data-local/`：当前本地来源的TSP缓存、指标、策略、配置和日志。
- `data/`：早先TickFlow初始化的留存数据，已与当前运行隔离。
- `runtime/source-audit.jsonl`：桥接请求的来源、内容hash、实际覆盖与冲突元数据。
- `data-local/local_source_evidence/`：板块采集日与内容版本证据。
- `data-local/fuyao/`：同花顺官方分类与财务三表的**宿主机离线导入产物**（只读，无 Key）。
- `runtime/fuyao.env` / `runtime/fuyao-cache/`：fuyao Key 与导入中间缓存，宿主机专有，不挂载进容器。
- `upstream/`：本次适配时从固定镜像复制的后端参考代码，不覆盖容器上游。

本地数据优先，通达信原始文件补缺；日K/分钟K按需读取，不复制全部长期分钟档。历史固定窗口不盲目拉最新行情，当前分钟需求检查已观测时间。实时仅eltdx或显式AxData；容器内TickFlow/fuyao及其他网络回退被来源政策阻断。

每日原有盘后管道先更新本地概念/行业/地区/风格等扩展表，并把同一份本地板块归属写入出厂的「扩展概念」「扩展行业」表，再处理日K和除权指标。可在TSP数据页手动启动。全市场实时行情由 eltdx 分类行情接入，交易日期取自 TDX 握手、逐标的 HHMM 校验新鲜度；单标的秒级时刻未独立验证。五档盘口已接入 eltdx 原生 0x0547，财务已接入 eltdx `corporate.finance_batch` + 本地 gpcw 报告期的观察层。AI没有Key则不可用；容器侧无需填写 TickFlow/fuyao Key。fuyao Key 只放在宿主机 `runtime/fuyao.env`（0600、不挂载进容器），用于离线增强导入，详见 `docs/fuyao-offline.md`。

## 已验证与限制

初始化5510只股票，最近一年242个交易日、1324389行指标；数据末日2026-11-03。其他范围通过桥接读取。实际证据见tasks/data-source-review.md。

财务除 658 列原始编号观察外，已提供上游 5 张表（metrics/income/balance_sheet/cash_flow/shares）的观察层：`period_end` 来自本地 gpcw 报告期头，最新命名快照来自 eltdx `corporate.finance_batch`。`announce_date` 恒为空，`updated_date` 只是财务文件更新日而非公告日，因此 `pit_verified=false`、PIT 财务因子与完整三大报表历史仍不开放；`*_raw` 保留 TDX 原始单位、`*_observation` 保留编号列，字段语义未权威映射。观察页单只实时快照因源时钟不可核验仍标记 stale。历史成员/股本和复权基准仍有PIT限制。扫描和回测验收只是数据链路证明，没有验证策略盈利，更没有实盘下单。

另有**宿主机旁路离线导入**的同花顺 fuyao 官方三表（`data-local/fuyao/`，5,580 只 / 各约 4.46 万行）与官方概念/行业分类（独立表 `fuyao_ths_concept` / `fuyao_ths_industry`）。现有 5 张上游财务表只增加 `fuyao_*` 候选公告日交叉标注列，**`announce_date` 仍为空、`pit_verified=false`**：实测 `report_date_ms` 对历史期按季度回填且与三表冲突，不是可验证的披露日。Key 只在宿主机 `runtime/fuyao.env`（0600、不挂载进容器）使用，容器零外联、能力矩阵与固定镜像均未变。详见 `docs/fuyao-offline.md` 与 `docs/data-inventory.md`。

## 检查与排障

```sh
docker compose logs --tail=100 app
tail -n 100 runtime/bridge.log
# pytest 必须用全新 basetemp，否则已存在目录会抛 EEXIST
.venv/bin/python -m pytest tests -q --basetemp="/tmp/tsp-pytest-$(date +%s%N)"
# 有限真实样本验证；实时部分仅用eltdx/AxData
.venv/bin/python scripts/verify_sources.py
# 容器内端到端（含 fuyao 域名阻断断言）
docker exec -i -w /app tsp-local /app/.venv/bin/python - < scripts/verify_tsp.py
# fuyao 离线增强（宿主机侧执行，Key 不进容器）
.venv/bin/python scripts/import_fuyao.py --probe
.venv/bin/python scripts/import_fuyao.py --boards
.venv/bin/python scripts/import_fuyao.py --financial
curl -s -X POST http://127.0.0.1:3018/api/local-sources/fuyao/publish
```

## 运维体检与日志归档（2026-11-04 接管后）

```sh
.venv/bin/python scripts/doctor.py          # 只读体检：固定镜像/来源政策/密钥边界/PIT/离线产物/日志磁盘/服务
.venv/bin/python scripts/doctor.py --json   # 结构化输出；--strict 让 WARN 也返回非 0
.venv/bin/python scripts/rotate_logs.py    # 审计日志 + 证据链归档 dry-run（超过 16MB 才需要处理）
.venv/bin/python scripts/rotate_logs.py --apply
# bridge.log 由桥接进程持有 fd，仅在 manage.py stop 后用 --bridge-log --apply 归档
# 证据链完整性（内容寻址 / 链式哈希 / 崩溃半行 / 篡改检测）
.venv/bin/python -c "from bridge.evidence import EvidenceLog; import json; print(json.dumps(EvidenceLog().verify(), ensure_ascii=False, indent=2))"
```

`rotate_logs.py` 同时轮转 `runtime/source-audit.jsonl` 与 `runtime/evidence.jsonl`；`evidence-*.jsonl.gz` 是独立的完整哈希链段，**不会被 `--prune` 删除**。

`doctor.py` 的密钥检查用真实值精确比对（不回显），不要用 `grep -r FUYAO_API_KEY | wc -l` 判泄漏——变量名引用会误报。体检共 17 项，其中 `evidence_chain` 会校验 `runtime/evidence.jsonl` 的内容哈希链、`seq` 连续性与损坏行，篡改或缺行直接 FAIL；`log_hygiene` 同时监控审计日志与证据日志大小。`mainline_history` 的一项 WARN 是已知设计性提示：历史主线仍为切换分类口径前生成、未重算，API 文案已如实标注，不得伪造历史成分版本。

## 指数涨跌幅显示 "-" 时

`pipeline_pull_index=false` 时 `kline_index_daily` 只有当日实时分区，看板指数卡片因缺前一日收盘价而显示 "-"。用本地只读源回填缺失交易日（`doctor.py` 的 `index_daily_history` 会告警）：

```sh
.venv/bin/python scripts/backfill_index_daily.py          # dry-run
.venv/bin/python scripts/backfill_index_daily.py --apply  # 只写缺失分区，不覆盖已有分区
```

盘后重跑管道时，若本地日线已含当日数据，桥接会跳过空的实时刷新并在 metadata 留 `latest_refresh=SKIPPED_AFTER_HOURS_LOCAL_DAILY_COVERS_SESSION`；本地确实缺当日数据时仍 fail-closed 报错，不会网络回退或零填充。

独立环境为Python3.14 macOS arm64，依赖锁在bridge/requirements.txt；free-stockdb的本机原生SDK由授权路径读取。缺环境时在项目内创建venv并安装锁定依赖，不修改全局Python。

## 备份与回滚

先运行stop-local.sh，再完整备份data-local/、.env、compose.yaml、bridge/、plugins/、overrides/和scripts/。`runtime/fuyao.env` 含 API Key，需单独加密保管、不要与 `data-local/` 一起外发；`runtime/fuyao-cache/` 只是可重建的中间缓存，可不备份。保留data/及来源证据。

升级应先备份，重新校验上游插件契约与数据单位、运行测试及真实样本，再更新镜像引用。当前digest来自已校验的本机导入镜像，pull_policy=never，不是通用的在线安装引用。

需要恢复配置时先停止服务，恢复备份后start-local.sh；不要删除源数据目录或使用git clean -fdx处理数据问题。旧TickFlow模式不满足当前来源政策，不能作为自动回退。

续验已修复全量分钟请求上限、ETF日线单位和首日起点过滤；旧指标归档后补导首日，原日线分区hash未变。量的单位不能验证时保持null；详见验收报告的续验记录。

## 本轮接手恢复（2026-11-04 盘中）

当前状态：容器 `tsp-local` healthy（127.0.0.1:3018），桥接 7818 已恢复（PID 见 `runtime/bridge.pid`），free-stockdb 7899 在线，本地通达信 export/vipdoc 可读且已参与实际查询。

修复（共 3 处，未改动任何取数逻辑）：`scripts/manage.py` 的 runtime 目录创建改为先判存在；`manage.py stop` 改用信号探测 + 桥接健康校验，去掉对外部 `ps` 命令的依赖；`bridge/server.py` 审计日志目录创建改为先判存在，避免每次 `/query` 在同一处失败。原故障表现为桥接进程已退出、页面能开但数据查询 502，且启动脚本在已存在目录上抛 `FileExistsError`。

验证：85 项回归通过；`verify_sources.py` 8 项 PASS（含 eltdx 取到 2026-11-03 的 48 根 5 分钟线、快照 18.68）；容器内 `verify_tsp.py` 扫描 100 只、回测 84 净值点 / 21 笔（仅数据链路，非盈利验证）、跨期分钟 96 根双来源、外部付费域名全部阻断；`stop → start` 闭环通过，重启后首个请求直接查板块返回 2008 条。

数据新鲜度：本地日K / 分钟K 末日 2026-11-03，与 TSP 缓存 `as_of` 2026-11-03 一致。按 `needs_refresh`，盘中（15:30 前）日K 不联网补数、分钟线按当前窗口补 eltdx；15:30 后才判定需要当日日K。今日 16:00 后 free-stockdb 自动同步 11-04，同步完成后在 TSP 数据页手动执行盘后管道即可纳新；盘中不要执行，避免未收盘日K入库。

## 全市场实时行情接入（2026-11-04，用户指出实时未刷新后修复）

原故障：上游 `quote_service` 每轮通过 `provider_has_dataset('local_quant','realtime')` 判断自定义源能力，插件未声明 realtime，于是每轮掉进 `get_paid_realtime_client()`（被来源政策置 None），只留下「未配置付费服务器 API Key」警告，行情从不刷新。eltdx 此前虽能取到快照，却没有任何路径把它送到实时行情。

修复：`plugin.yaml` 与 provider 声明 realtime；`provider.get_realtime()` 走桥接全市场，`get_realtime_indices()` 走显式 eltdx 指数快照；桥接新增 `live_sources.market_snapshot()`，用 `helpers.realtime_rank(category='沪深A股', count=6000)` 一次取回约 5570 行，约 4–10s；`router` 在不带 symbols 时路由到该全市场方法，带 symbols 的单只观察路径保持原样不变。

时间证据与单位：日期取自 `session.handshake()` 的 `server_datetime` / `server_date_1`（实测 2026-11-04，武汉电信主站1），逐标的 `raw.server_time_raw` 只取 HHMM 层做新鲜度门槛（落后超 10 分钟或超前于会话时刻即排除）；无成交、无有效价、无时钟的记录一律不返回，避免停牌旧价写成当日 K 线。`change_pct` 由百分数转小数制，volume 手、amount 元，timestamp 为北京时间毫秒 epoch（映射成上游 `quote_ts`）。

实际验收：重启后能力路由显示「实时行情 ← 本地量化 · eltdx/AxData 可用」；连续多轮「行情刷新: 5575 只股票, 0 只ETF, 4 只指数」（约 60s 间隔，单轮 4–10s）；容器内 enriched 缓存 `latest_date=2026-11-04`、5631 行，600031.SH 为盘中 `close=18.68`；92 项回归通过；原有 `verify_sources.py` 8 项仍 PASS。排名接口分页重叠导致的重复代码已按 symbol 去重，当日 `kline_daily` 分区 (date,symbol) 唯一，回测矩阵预热恢复正常。

已知限制（维持）：单标的秒级行情时刻未独立验证（`server_time_raw` 部分值秒位 >59，仅取 HHMM 层）；ETF 实时快照未接入；观察页单只快照保持 stale。五档盘口虽已接入原生 0x0547，但盘后样本的 `event_time` 与握手时刻间隔超过 10 分钟，按 fail-closed 语义标记 `stale=true`，不得当作盘中连续五档回放。完整财务三表 / 公告日、历史 PIT 仍未开放。`tasks/p0-p1-plan.md` 的 P0/P1 清单尚未获批准、未执行，不把未验证项记为完成。

## 阶段2：三个用户可见问题的实施与验收（2026-11-04 盘后）

全部通过 `bridge/`、`plugins/local_quant/`、`overrides/` 实现，`upstream/` 仅作参考、未改动；固定镜像 digest 未变。

**1. 自选股重复**：`watchlist.parquet` 本身只有 2 行且唯一，重复来自 `GET /api/watchlist/enriched` 的 `watchlist_df.join(df_e, ...)` 被脏的 enriched 缓存放大。`scripts/repair_enriched_duplicates.py` 备份并原子重建 `kline_daily_enriched/date=2026-11-04`（3391 行 / 1029 重复 → 2362 行 / 0 重复）；`overrides/source_policy.py::install_enriched_integrity()` 在 `KlineRepository` 的 `get_enriched_latest` / `get_enriched_latest_asset` / `flush_live_enriched_asset` / `merge_live_enriched_asset` 四处读写路径按 symbol 去重，防止增量递归再次污染。验收：`/api/watchlist/enriched` 返回 `count=2`、`['002474.SZ','001219.SZ']`。

**2. 五档与财务**：
- 五档改为 `client.quotes.get_depth(codes)` 原生 0x0547（原 `realtime()` 派生路径废弃），买卖各 5 档 + 逐档量 + `update_time_raw`；时间用 TDX 握手日期 + 逐标的 HHMMSS 构造，无时钟/无价/无盘口/缺代码显式失败，不足 5 档只标 `levels_complete=false`、不补零。实测 600031.SH / 002474.SZ / 001219.SZ 均可返回完整 5 档。
- 财务确认 eltdx **提供** `corporate.finance_batch()`（交接文档旧结论「eltdx 无财务」不准确）。新增 `bridge/finance.py` 观察层：本地 gpcw 报告期 + eltdx 最新命名快照 → 上游 5 张表。批量接口有 32 次 recover 预算上限，故按 20 只分片 + 失败递归二分 + 单只缺失返回空，绝不静默补零。
- `plugin.yaml` / provider 声明 `depth5`、`financial`，实现 `get_depth_batch()` 与 `get_financials()`；能力矩阵与 `/api/financials/status` 已显示可用。
- 全量同步曾因桥接 240 次/分限流使最后一张 `shares` 表失败：桥接限流改为可配置（默认 600/分，`TSP_BRIDGE_RATE_PER_MIN`），provider 对 **429 且仅 429** 做有界退避重试；503 作为 fail-closed 错误立即上报，不重试、不伪造。

**3. 板块 fuyao 报错**：出厂 `ext_gn_ths` / `ext_hy_ths` 配方指向 fuyao 且要求 `fuyao_api_key`，而来源政策已阻断该域名，本机架构下不可能成功。`overrides/local_extensions.py` 保留上游字段名契约，把配方替换为「无 URL / 无鉴权 / 无 fanout / disabled」的本地配置并清除 `last_status=error` 与报错文案；同一份 boards 归属写入 `part.parquet`（当时为扩展概念 5506 行、扩展行业 5507 行；secondary 通达信分类曾加 `TDX/` 前缀，后续因页面按 `/` 聚合出伪大类已撤销，见「阶段3」）。`install_local_presets()` 在 `app.main` 导入前替换 `ext_presets.ensure_builtin_presets`，**重启不会复活 fuyao 配方**；启动钩子在表为空时自动补数。`monitor_ext_fields` 指回出厂表并修正上游拼写错误。全部 10 张扩展表均有真实数据。

**验收汇总（阶段2 时点）**：`pytest` 113 项通过；`verify_sources.py` 有界真实源检查；`verify_tsp.py` 容器内端到端；能力矩阵全项 `usable=true`；重启后 `LOCAL_PRESETS_ACTIVE` / `ENRICHED_INTEGRITY_ACTIVE` / `SOURCE_POLICY_ACTIVE` 三条钩子日志齐全，扩展表配置中 `fuyao` 零残留。后续全量回归已增至 139 项，见下节。

## 阶段3：fuyao Key 可用的离线增强（2026-11-04 晚间）

用户拿到同花顺 fuyao API Key 后，评估结论是**不把它设为主数据源**：固定镜像、`source_policy.py` 的容器零外联白名单、`install_app_policy()` 的 provider 锁定、能力矩阵（7 项仍 `usable=true / effective=local_quant`）与 `verify_tsp.py` 的阻断断言全部不动；`app/plugins/fuyao` 不启用，容器里不放 Key。fuyao 的净增量只有「官方财务三表数值 + 披露日线索」和「同花顺官方概念/行业分类」，因此采用**宿主机旁路离线导入**：

- Key 只写 `runtime/fuyao.env`（0600，`runtime/` 不挂载、已在 `.gitignore`）；不写 `.env`（compose `env_file` 会注入容器）、不写 `data-local/user_data/secrets.json`（挂载进容器）。manifest 只记 Key 来源标签，实测全仓零泄漏。
- `scripts/import_fuyao.py` 在宿主机拉数，中间缓存 `runtime/fuyao-cache/`，成品写 `data-local/fuyao/`；支持 `--probe` / `--boards` / `--financial` / `--all`、断点续跑、原子写、失败标签化，不补零。
- `bridge/fuyao_offline.py::FuyaoStore` 提供只读 dataset `fuyao`（status / 三表 / announce_candidates / concept / industry），响应 metadata 固定 `no_network_access=true`、`key_in_container=false`、`pit_verified=false`。`/local-sources` 页面可直接核对并一键发布官方分类。
- `overrides/local_extensions.py::publish_official_boards()` 发布两张**独立新表** `fuyao_ths_concept`（5,580 行）/ `fuyao_ths_industry`（5,578 行），不覆盖 `ext_gn_ths` / `ext_hy_ths`，`monitor_ext_fields` 不自动切换；板块名中的 `/`、`;` 替换为全角，避免再生成伪大类。

**语义核验（关键）**：探活 4 只 × 3 表 × 8 期共 96 行，发现 `report_date_ms` 在最近约 4 期像真实披露日，但更早历史期按季度类型回填（滞后 389–479 天），且 16 个 `(symbol, period_end)` 三表日期冲突；上游 provider 直接把它映射成 `announce_date` 的做法不成立。因此导入只写 `report_date` + `announce_date_candidate` + `report_date_quality`，**绝不写 `announce_date`**，PIT 财务因子与回测继续关闭。全市场 44,787 个候选键中仅 16,716 个合格候选、22,149 个三表冲突、5,900 个疑似回填。证据 `tasks/fuyao-probe.json`，详见 `docs/fuyao-offline.md`。

**实测产物**：官方分类 390 概念板块 / 70,601 成分、320 行业板块 / 10,287 成分，零失败；财务三表 5,580 只零错误（income 44,640 / balance_sheet 44,639 / cash_flow 44,640 行）。

**验收**：`pytest` 139 项全通过；`verify_sources.py` 8 项 PASS；容器内 `verify_tsp.py` 的 `network_blocks.fuyao.aicubes.cn=true`（阻断未被放开）；`/local-sources` HTTP 200；桥接 `/status` 的 `fuyao_offline.available=true`、`fuyao_pit=DISABLED_REPORT_DATE_MS_NOT_A_VERIFIED_DISCLOSURE_DATE`。官方分类表发布成功且含 `/` 的值 0 条。

**仍关闭**：PIT 财务因子/回测、法定公告日、官方三表字段映射的独立验证（`field_mapping_verified=false`）、板块成分历史版本、离线产物自动定时刷新。

## 阶段4：P0/P1 第一阶段「证据与确定性基础」（2026-11-05）

用户批准「1 盘后管道 / 2 升级 v0.3.29 / 3 启动 P0/P1」后启动。本阶段只改 `bridge/`、`scripts/`、`tests/`，**未动 `upstream/`、v0.3.29 digest、偏好开关与任何 `data-local/` 既有数据**。逐项清单与证据见 `tasks/p0-p1-plan.md`。

- **A01 证据链**：新增 `runtime/evidence.jsonl`，单行追加、内容寻址（`payload_sha256`）+ 链式哈希（`prev_sha256`）+ `seq`；记录 `SUCCESS/FAILED/MISSING/CONFLICT/NOTE`；崩溃半行保留原字节并在 `verify()` 报 DAMAGED；进程重启从磁盘尾恢复链；篡改/注入可检测。`bridge/evidence.py`。
- **A02 冲突与读失败**：冲突不再被内存 `[-20:]` 截断，完整记录双方值、源版本、逐字段精度、单位口径、选择理由；新增 `conflict_class`：`PRECISION_ROUNDING_ONLY`（TDX float32 舍入，容差 1e-5）与 `MATERIAL_VALUE_DISAGREEMENT`（实质分歧）。响应 metadata 增 `degraded_local_read` / `local_read_failures_delta`，本地读降级时标 `PARTIAL_OBSERVED_ROWS_ONLY`，**部分结果不再伪装成成功空表**。
- **A03 全量请求 outcome**：成功、业务失败、鉴权/限流失败、请求校验失败一律入证据链。`Query` 新增 `as_of`（截止时点、北京墙钟、拒绝 `as_of < end_time` 的未来窗口）与 `purpose`（有界枚举），并记录 `scope`（标的数量上限、窗口、固定数据集、禁止任意 SQL/路径/URL）。二者在调用 router 前剔除，**固定取数契约与 `source-audit.jsonl` 原格式不变**；`/status` 增 `evidence` 健康。
- **A04 交易日历**：`bridge/calendar.py` 只从本地通达信指数日线 `vipdoc/sh/lday/sh000001.day` 读已观测交易日并保留文件哈希；**有 bar 才承认是交易日**，覆盖内无 bar 一律 UNKNOWN（休市与缺柱不可区分），未来日期无开市权威，绝不用「工作日即交易日」兜底。
- **A05 新鲜度（观察层）**：逐标的边界覆盖、停牌候选、联网返回二次验证已写入 metadata（`freshness_assessment` / `remote_freshness`）。`freshness_gate=ADVISORY_NOT_ENFORCED`——**未改变已验收的刷新准入与盘后跳过逻辑**；改为强制门控需真实盘中窗口验收，因此该项在计划中保持未勾选。

**验收**：`pytest` **227 passed**；`verify_sources.py` 8 PASS；`doctor.py` 16 PASS / 1 WARN / 0 FAIL；容器内 `verify_tsp.py` 三域名全阻断；桥接 `stop → start → healthy`；真实请求证据链 317 条 / 647,044 字节 `valid=317, damaged=0, chain_ok=true, seq_ok=true`。

**真实发现（只记录、未擅自对账）**：跨期 5 分钟查询中，`tdx_local_lc5` 与 `local_parquet_5min_raw` 对 2024-12-31 的 `600031.SH` 存在 49 条实质分歧（`low` 16.62 vs 16.64、`amount` 约差 2 万）；另有 49 条仅为 float32 舍入。根因对账属 D01/D02，本阶段保持原数据不变、不宣称解决。

**仍关闭**：B01–B05 实时质量门控、C01–C08 财务/PIT、D01–D05 全史与跨资产、E01–E05 真实窗口与浏览器验收；PIT 财务因子、法定公告日、历史成分版本、ETF 实时快照、单标的秒级时刻、`pipeline_pull_index` / `pipeline_regime_enabled`、离线自动刷新、桥接守护/自启、历史主线重算均保持关闭。C03/C04/C06/C07/C08 与 E01 缺真实证据，按 fail-closed 不伪造完成。

## 阶段4 续：P0/P1 第二阶段「运行缺陷与用户可见故障」（2026-11-05 午间）

完整故障链、实现表与验收数字见 `tasks/p0-p1-plan.md`「第二阶段实施记录」。本阶段仍**未动** `upstream/`、v0.3.29 digest、偏好开关与 `data-local/` 既有数据。

### `/api/kline/minute` 的「请求超时（30s）」

不是网络慢，是**桥接拒绝并发引发的退避风暴**：旧桥接只有 2 个并发槽且 `acquire(blocking=False)`，并发轮询立即 429；provider 旧退避 `(1,2,4,8,16,20)` 累计约 31 秒，正好撞破前端 `AbortController` 的 30 秒上限。

- 桥接改为有界排队：`TSP_BRIDGE_MAX_CONCURRENCY`（默认 8，钳制 2–16）、`TSP_BRIDGE_QUEUE_WAIT`（默认 8s，钳制 0–12s），`work.acquire(timeout=...)`；排不上仍 fail-closed 429 并写 `BRIDGE_BUSY` 证据，绝不静默放行。`/status` 新增 `admission` 可直接核对。
- provider 退避预算改为 `RETRY_DELAYS=(0.15,0.3,0.6,1.2,2.4,3.0)`（合计约 7.65s），仍**只对 429 重试**，503 立即上报。
- 实测：6 路并发全 200、最大 1.97s；12 路并发（超上限走排队）全 200、最大 4.05s；证据链中 `BRIDGE_BUSY` / `RATE_LIMITED` 为 0。

### 证据链大记录与日志膨胀

第一阶段的 `evidence.py::_tail()` 固定读尾部 64KB，而真实日志有 22 条 >64KB（17 条 >1MB，最大 4.56MB），窗口落在记录内部 → 找不到链头、`seq` 从 1 重开、哈希链分叉（`chain_ok=false, seq_ok=false`）。

- `_tail()` 改为从 EOF 以 ×4 指数扩大窗口（上限 16MB）直到读到完整可解析记录；在 92MB 真实文件上正确恢复链头 `seq=420`。
- `store_large_payload()` + `_bounded_metadata()`：超过 8 条的 `conflicts` 按内容哈希幂等写入 `runtime/evidence-parts/`；`source-audit.jsonl` 与 `evidence.jsonl` 只留地址、计数、样本。**HTTP 响应仍返回完整 metadata，不改上游契约**。
- 11:49 停机窗口执行 `rotate_logs.py --apply --bridge-log`：`source-audit.jsonl` 80.8MB → 7.94MB gzip、`evidence.jsonl` 92.2MB → 9.49MB gzip，活动文件归零并从 GENESIS 起新链。归档证据不参与 `--prune`。
- `doctor.py` 从 **14 PASS / 2 WARN / 1 FAIL** 恢复到 **16 PASS / 1 WARN / 0 FAIL**；新证据链 `chain_ok=true / seq_ok=true / damaged=0 / write_failures=0`。

### 午休 / 收盘后实时行情归零

`market_snapshot()` 原来拿 TDX 握手墙钟比逐标的 HHMM。11:30 后交易所停止发布，午休时 20 分钟滞后必然超过 `max_lag_minutes=10`，全市场被判过期 → 503 `no date-verified rows`。新增 `quote_session_state()`，新鲜度门槛锚定**最后一个时段边界**（午休 11:30 / 收盘 15:00），同时保留停牌、无时钟、时钟超前、日期不一致的 fail-closed 排除；`timestamp` 仍用握手会话时钟（上游 `quote_service` 依赖它做当日归属与 final 定版确认），逐标的时刻另记 `source_event_hhmm`。定版快照如实标 `stale=true` / `wall_clock_lag_minutes` / `freshness_reason=LUNCH_BREAK_FINAL_SNAPSHOT`（收盘后为 `AFTER_HOURS_FINAL_SNAPSHOT`）。实测午休从 0 行恢复为 **5,569 行**，桥接 `/query?dataset=realtime` 200 / 5.88s。

> 注意：这是「最后一份定版快照」而非连续实时流；13:00 开盘后自动回到 `MORNING/AFTERNOON_SESSION` 的 `IN_SESSION` 判定。

### fuyao API Key 是否落地

**已配置且已落地，但落在宿主机旁路、不进容器**：`runtime/fuyao.env`（0600，56 B，`FUYAO_API_KEY`，非空、长度 41）；根目录 `.env`、`data-local/user_data/secrets.json`、`compose.yaml` 均无该 Key 或 `runtime/` 挂载；`data-local/fuyao/manifest.json` 记 `key_present_in_this_file=false`、`imported_at=2026-11-04T21:16:19+08:00`、`pit_enabled=false`。容器只能读离线 parquet，`fuyao.aicubes.cn` 仍被阻断，`verify_tsp.py` 的 `network_blocks` 保持 true。**设置页里若再提示 `fuyao_api_key` 缺失，说明是出厂配方/预设被写回，不是 Key 没配**；当前 `install_local_presets()` 已在 `app.main` 导入前替换出厂配方。

### 运维变更

- 新增 `pytest.ini`：`testpaths=tests`、`norecursedirs=runtime data-local upstream .venv .git`。升级备份 `runtime/backup-pre-upgrade-*/tests/` 与 `tests/` 模块同名，裸跑 `pytest` 会 18 个 `import file mismatch`；现在直接 `.venv/bin/python -m pytest -q --basetemp="/tmp/tsp-pytest-$(date +%s%N)"` 即可。
- `scripts/rotate_logs.py::_gzip_into()` 先判 `is_dir()` 再建目录，规避沙盒 `mkdir(exist_ok=True)` 的 `FileExistsError`。
- 体检、测试、脚本一律用项目 `.venv/bin/python`；`verify_tsp.py` 必须在容器内跑：`docker exec -i -w /app tsp-local /app/.venv/bin/python - < scripts/verify_tsp.py`。

### 当前验收基线

`pytest` **242 passed**；`verify_sources.py` **8 PASS**；`doctor.py` **16 PASS / 1 WARN / 0 FAIL**（唯一 WARN 为历史主线未重算的设计性提示）；容器内 `verify_tsp.py` 三域名全阻断、跨期分钟 96 根；桥接 `stop → start → healthy`、容器 `tsp-local` healthy。B/C/D/E 共 23 项与今日收盘后盘后管道仍未完成，见 `tasks/p0-p1-plan.md`。
