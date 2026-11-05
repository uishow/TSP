# 阶段1 交接文档（2026-11-04）

> 交接范围：阶段1 = 「接手系统并使其正常运行」+「实时行情真实接入」+「本轮三个问题的只读定位」。
> 阶段2 = 本轮三个问题的**实施**，**已于 2026-11-04 盘后完成并验收**，详见本文 §9。
> 阶段3 = 「行业页伪 TDX 大类修复」+「用户拿到 fuyao Key 后的离线增强接入」，**已于 2026-11-04 晚间完成并验收**，详见本文 §10。
> ⚠️ 本文 §2 运行状态、§4 待办、§7 限制项均为**阶段1 时点的历史快照**，不代表当前状态；§4.2(b)「eltdx 不提供财务」的结论已被实测推翻（见 §9.2），§9.3 的「`TDX/` 前缀标注来源」做法也已在阶段3 撤销（见 §10.1）。

---

## 0. 一句话状态

系统**已恢复运行且实时行情在真实刷新**；但本轮用户提出的 3 个问题（自选股重复 / 五档盘口与财务 / 板块 fuyao 报错）**仅完成只读定位，未改动任何代码**。
另发现一条**当日 15:01 收盘后进入休盘态**的正常行为（非故障），以及一条**遗留数据脏状态需阶段2 修复**（`kline_daily_enriched` 当日分区含 303 个重复 symbol）。

---

## 1. 阶段1 已交付并验收的工作

### 1.1 系统恢复运行（3 处最小修复，未动取数逻辑）

| 位置 | 症状 | 修法 |
|---|---|---|
| `scripts/manage.py`（runtime 目录创建） | 一运行就抛 `FileExistsError`，桥接无法启动 | 目录已存在则不创建 |
| `bridge/server.py`（审计写入目录） | 同上，但会让**每一次 `/query` 失败** | 同上 |
| `scripts/manage.py stop` | 依赖外部 `ps`，沙盒内 `PermissionError`，无法停服 | 改用 `os.kill(pid,0)` 探测 + 桥接健康身份校验 |

根因背景：当前执行环境的路径代理层对**已存在**目录调用 `Path.mkdir(exist_ok=True)` 会抛 EEXIST；`ps` 在本环境被禁用。

### 1.2 实时行情真实接入（用户追问项）

**根因**：上游 `quote_service` 用 `provider_has_dataset(name,'realtime')` 分流；插件未声明 `realtime` → 每轮回退到 `get_paid_realtime_client()`（已被来源政策置 `None`）→ 每分钟只留一句「未配置付费服务器 API Key」，**行情从未刷新**。eltdx 能取到价，但没有路径把它送到行情。

**实现**（与实时取数链路同构，未改上游代码）：
- `bridge/live_sources.py` 新增 `market_snapshot()`：握手 `server_date` 做日期权威 → `helpers.realtime_rank(category='沪深A股', count=6000)` 全市场 → 逐标的 HHMM 新鲜度门槛 → 无成交/无价/无时钟记录 fail-closed 排除 → `change_pct` 百分数转小数 → 输出毫秒 `timestamp`。
- `bridge/router.py`：`symbols` 为空时路由全市场。
- `plugins/local_quant/provider.py` + `plugin.yaml`：声明并实现 `realtime`。
- **带 symbols 的单只观察路径完全未动**（否则会破坏已有验收脚本 `verify_sources.py`）。
- 同步更新 `bridge/server.py` `/status`、`overrides/source_panel.py` 页面文案、`README.local.md`、`docs/live-sources.md`，不再声称实时关闭。

**验收证据**：
- 能力路由显示「实时行情 ← 本地量化 · eltdx/AxData 可用」；
- 连续刷新记录：14:38:48 / 14:39:53 / 14:40:59 / 14:41:51 / 14:42:56 / 14:44:01 / … 每轮 `5575 只股票, 0 只ETF, 4 只指数`，单轮 4.0–5.2s（上游轮询间隔 60s，可容纳）；
- 容器内 enriched 缓存 `latest_date=2026-11-04`、5631 行，600031.SH `close=18.68`（盘中价，非昨日静态日K）；
- 回归 92 项全通过；`verify_sources.py` 8 项仍 PASS；启停闭环 `stop → stopped → start → healthy` 通过，重启后**首个请求直接查板块**返回 2008 条（复验「SDK 初始化顺序」历史坑未复发）。

### 1.3 阶段1 自身引入并已修复的问题

eltdx `realtime_rank` **分页会重叠返回同一代码**（实测 2000 行仅 1991 个唯一代码）。首次接入未去重 → 当日 `kline_daily` 出现 237–254 个重复 `(date,symbol)` → 容器启动报 `matrix cache prewarm failed: MarketDataMatrix requires unique date/symbol rows`。
修法：`market_snapshot()` 按 symbol 去重后再出数 + 补回归测试；后续刷新覆盖当日分区，重复归零；重启后预热错误消失。

---

## 2. 当前运行状态（交接时实测）

| 项 | 状态 |
|---|---|
| 桥接 7818 | healthy，PID **57222**（`runtime/bridge.pid`） |
| TSP 容器 3018 | `tsp-local` Up，healthy |
| free-stockdb 7899 | 在线。**无参数探测返回 HTTP 400 `invalid request` 是它的正常健康响应，不是故障** |
| 当日 `kline_daily/date=2026-11-04` | 2362 行 / 2362 唯一 / **0 重复**（已干净） |
| 当日 `kline_daily_enriched/date=2026-11-04` | 3391 行 / 2362 唯一 / **303 个 symbol 重复**（脏，需阶段2 修） |
| 内存 enriched 缓存 | 含重复（`002474.SZ` × 4）→ 自选股重复的直接来源 |
| 实时轮询 | 15:01:05 起进入**休盘态**（见 §5.3），非故障 |

**本轮（15:21 后）未改动任何文件**，仅只读排查 + 建任务（任务 #8/#9/#10）。

---

## 3. 不可破坏的不变量（沿用既有约定）

1. 本机只读桥接（`bridge/`）+ TSP Python provider 插件（`plugins/local_quant/`）+ 固定版本覆盖层（`overrides/`）。**不改上游源码**，只改 TSP 目录。
2. 实时联网**只用 eltdx 或显式 AxData**；容器内 TickFlow/fuyao 域名 egress 被 `overrides/source_policy.py` 明确阻断。
3. 缺失或来源失败必须**显式返回**，不补零、不静默回退到未允许的远程源。
4. 断源报错要保留失败记录；插件缺失或桥接断开必须报明确不可用。
5. 本地数据库、通达信源文件**只读**；已生成缓存变更前留版本。
6. 不下单。扫描与回测只是数据链路证明，**不代表策略盈利**。
7. 财务「原始观察层」与「完整 PIT 三表」必须分开表述，**无公告日不得宣称 PIT 达标**。

---

## 4. 阶段2 待办（本轮仅定位，附可执行结论）

### 4.1 【问题1】自选股重复显示

**现象**（用户截图）：`002474.SZ 榕基软件` 显示 **4 次**，`001219.SZ` 1 次；头部「5/5 只」，分组页签「全部 2」。无报错弹窗。

**排查结论（已逐层排除）**：
- ❌ 不是后端重复插入：`data-local/user_data/watchlist.parquet` 实测**仅 2 行、symbol 唯一**；`upstream/app/services/watchlist.py:205-219` 的 `add_batch` 按 symbol 去重后再前置，语义正确。
- ❌ 不是前端问题。
- ✅ **真因在渲染层的 JOIN 放大**：页面走 `GET /api/watchlist/enriched`，该端点 `upstream/app/api/watchlist.py:500` 执行
  `watchlist_df.join(df_e, on="symbol", how="left")`。当 `df_e`（内存 enriched 缓存）含重复 symbol 时，自选每一行被**成倍放大**。
- ✅ **重复的原始出处**：`data-local/kline_daily_enriched/date=2026-11-04/part.parquet` 3391 行 / 2362 唯一 → **303 个 symbol 重复**（如 `300197.SZ` × 16、`000558.SZ` × 4）。

**成因链（已用日志实证）**：
1. 阶段1 首次接入 realtime 时未去重 → `kline_daily` 当日分区带重复 `(date,symbol)`；
2. 重复随之传播进 `kline_daily_enriched` 当日分区；
3. 阶段1 的桥接去重修复只让**新写入的 `kline_daily`** 变干净，**派生分区 `kline_daily_enriched` 未随之重算**；
4. 上游 `quote_service` 的 `enriched 增量` 路径（`upstream/app/services/quote_service.py:1935` `_flush_live_enriched`）对同一日期是**合入而非替换**——日志实证：15:01:04 本轮快照只有 **2362 只**，但同秒 `enriched 增量: 3391 只`（3391 > 2362，说明保留了当日早前 5575 只写入的旧行）；
5. 15:04 的 `enriched refresh` 从该脏分区重建内存缓存 → 重复进入内存 → 自选页被放大。

**待实施（两处都要，建议先做防御再修根因）**：
- **防御（直接消除页面重复）**：`upstream/app/api/watchlist.py` `watchlist_enriched()` 中，在 join 之前对 `df_e` 按 symbol 去重（`df_e.unique(subset=["symbol"], keep="last")`）。任何 enriched 缓存脏数据都不应让自选页出现重复行。
- **根因**：`kline_daily_enriched` 当日分区去重重建（重跑 enriched 生成/盘后管道），并确认 `_flush_live_enriched` 写盘对 `(date, symbol)` 是**替换语义**或写前显式去重，避免复发。
- **验证**：容器内 `repo.get_enriched_latest(symbols=['002474.SZ'])` 应返回 **1 行**（当前返回 4 行）；页面 `002474.SZ` 只出现 1 次。

### 4.2 【问题2】五档盘口与财务数据（用户要求「马上实现」）

#### (a) 五档盘口 —— **eltdx 已确认可取，实测通过**

- `eltdx.helpers.core.py:375` 文档串明确：`full_quotes` = **`0x054c` 快照 + `0x0547` depth 合并**。
- **专用接口**：`client.quotes.get_depth(codes)` → `QuoteRefreshPage`，`records[i]` 含：
  - `buy_levels` / `sell_levels`：各 **5 档** `QuoteLevel(price, volume, price_delta_raw)`
  - `open_amount_raw` / `open_amount_yuan`（委比/委差）、`inside_dish` / `outer_disc`（内盘/外盘）、`update_time_raw`、`total_hand`、`amount`、`last_close_price`
- **实测样本**（600031.SH，15:3x）：buy `18.69/18.68/18.67/18.66/18.65`，sell `18.70/18.71/18.72/18.73/18.74`，`last=18.69` / `prev_close=18.84`；单只首次 1.48s（含握手），`full_quotes` 缓存后 0.08s。
- ⚠️ **批量陷阱**：`helpers.full_quotes` **批量**会抛 `MissingCodesError`（阶段1 已实测），批量取五档需分片或改走 `get_depth` 分批；`realtime_rank` 只是行情排名接口，不含五档。

#### (b) 财务数据 —— **eltdx 不提供**，应走本地源

- eltdx helpers 仅有行情类（`realtime_rank` / `full_quotes` / `board_*` / `auction_data` / `today_fund_flow` / `shortline_indicators` 等），**无 financial 接口**；命令层只有行情类命令。
- 本地可用源（已核实存在）：
  - 通达信 `vipdoc/cw/`：`gpcw*.dat`（板块财务）、`gpsh*.dat` / `gpbj*.dat`（逐股专业财务），另有 `gpcw19920930.zip`；
  - 通达信 `T0002/export/`：逐股 txt 导出（含 `BJ#*.txt` 等）；
  - free-stockdb `stockdb_unified/`（财务表**尚未核实**，阶段2 需确认）。
- ⚠️ 通达信专业财务文件**不含公告日** → 只能声明为「无 PIT 证明的原始观察」，不得宣称 PIT 达标。

#### (c) 落地路径（与阶段1 realtime 完全同构）

1. `bridge/live_sources.py`：新增 `depth_snapshot(codes)`（eltdx `get_depth` → 归一为上游契约字段）与财务读取（本地文件解析）；
2. `bridge/router.py`：新增 `depth5` / `financial` 数据集路由；
3. `plugins/local_quant/provider.py` + `plugin.yaml`：声明 `depth5` 与 `financial`，实现 `get_depth_batch(symbols)` 与 `get_financials(table, symbols, latest_only=...)`；
4. 把上游偏好指向 local_quant（`preferences.get_depth5_data_provider()` / `get_financial_provider()`）。

**已读代码确认的上游契约**：
- 五档：`upstream/app/services/depth_service.py:303-330` → `preferences.get_depth5_data_provider()` → `custom_sources.provider_has_dataset(name,'depth5')` → `provider.get_depth_batch(symbols)`；落盘 `data/depth5/date=xxx/part.parquet`。
- 财务：`upstream/app/services/financial_sync.py:46-101` → `preferences.get_financial_provider()` → `provider_has_dataset(name,'financial')` → `provider.get_financials(table, symbols, latest_only=...)`；表为 `metrics` / `income` / `balance_sheet` / `cash_flow` / `shares`；落盘 `data/financials/<table>/`。

**未决问题（阶段2 需先定）**：财务开放到什么程度算完成。三表 PIT 需公告日，本地源不具备 → 建议本期只做「原始观察层」并如实标注。

### 4.3 【问题3】板块（概念/行业等）fuyao 报错

**现象**：概念、行业等板块无数据，报「拉取失败: 已配置鉴权但未找到凭据 fuyao_api_key — 请在 设置 → 数据源 配置对应 API Key」。

**定位结论**：
- 报错源头：`upstream/app/services/ext_pull.py:256`（凭据缺失分支）。
- 涉及预设：`ext_gn_ths`（同花顺概念）、`ext_hy_ths`（同花顺行业），配置见 `data-local/ext_data/ext_gn_ths/config.json`、`ext_hy_ths/config.json`；URL 指向 `https://fuyao.aicubes.cn/api/a-share-index/...`，`auth.key_ref = "fuyao_api_key"`。
- 预设定义在 `upstream/app/services/ext_presets.py`（`_FUYAO_BASE` / `_FUYAO_KEY_REF` / `_fuyao_auth()`）。
- ⚠️ **关键矛盾**：`overrides/source_policy.py` 已封闭 fuyao 域名（容器内 egress 阻断）→ **即使配了 key 也拉不到**。这条预设在本机架构下**本就不可能成功**，属于上游遗留的付费源预设。
- ✅ **已有替代**：桥接 `boards` 数据集本地可取 **2008 条**分类（`free_stockdb` + `tdx_export_membership`），含概念/行业/地区/风格/指数/自定义。

**待实施**：
- 把板块类 ext_data 预设改为消费本地来源，复用 `overrides/local_extensions.py` 的扩展表契约（按采集日/内容 hash 保留证据），去掉 fuyao URL 与 `key_ref`；
- ⚠️ ext_data 的 pull 配方是 **HTTP 请求型**，改本地源不是换 URL 就能了事，需先确认 `local_extensions.py` 的复用方式；
- **验证**：板块页有数据、错误提示消失、板块成分股可查。

---

## 5. 踩坑与教训

### 5.1 `/health` 返回 200 ≠ 系统可用
容器 healthy、页面能开，但数据查询全断——因为 TSP 把取数全交给 7818 桥接，桥接进程退出即「门面开着、供血管断了」。**排查应先验证数据链路的最慢一环，而不是最外层健康接口。**

### 5.2 「源能取数」≠「数据已接入业务路径」
阶段1 曾验证 eltdx 能取到 18.68，却没检查这条数据**有没有被送到实时行情路径**，还把每分钟的失败警告当噪音。**应把「数据源可用」和「数据已进入业务链路」当两个独立验收项。**

### 5.3 收盘后进入休盘态是正常行为
15:01:05 日志 `收盘 最终行情同步完成 (快照时间戳已达边界), 进入休盘态`，此后无 `行情刷新` 属**设计如此**（市场 15:00 收盘）。判定实时是否停摆，要先看是否已过收盘边界，不要误判为故障。15:02 的 `_depth_finalize` 定时任务 `executed successfully`。

### 5.4 按代码分页的全市场接口必须先验唯一性
`realtime_rank` 分页重叠返回同一代码（2000 行仅 1991 唯一）。**任何按代码分页的接口，先验唯一性再写日K。**

### 5.5 修了上游分区 ≠ 修了派生分区和内存缓存
阶段1 只让 `kline_daily` 变干净，`kline_daily_enriched` 与内存 enriched 缓存仍带重复 → 自选页依旧重复。**分区、派生分区、内存缓存三者必须一起重建。**

### 5.6 沙盒环境两个固定坑
- 路径代理层对已存在目录 `mkdir(exist_ok=True)` 抛 EEXIST；
- `ps` 被禁用 → 进程探活改用 `os.kill(pid,0)`；
- pytest 必须在**全新 basetemp** 下跑（`--basetemp="/tmp/tsp-pytest-$(date +%s%N)"`），否则 pytest 根目录已存在触发同样的 EEXIST。

### 5.7 命令行 grep 在本环境不可靠
多次 Bash `grep` 返回空（而 Grep 工具正常）。**排查文件内容统一用 Grep 工具**，避免把「grep 失灵」误判为「文件里没有这段代码」。

---

## 6. 复现与验证清单（交接后可直接执行）

```bash
cd /Users/beryllewis/private/stock/codex/TSP

# 启停（桥接 7818）
.venv/bin/python scripts/manage.py status
.venv/bin/python scripts/manage.py stop && .venv/bin/python scripts/manage.py start

# 回归（必须用全新 basetemp）
.venv/bin/python -m pytest tests -q --basetemp="/tmp/tsp-pytest-$(date +%s%N)"

# 真实数据源验收（8 项）
.venv/bin/python scripts/verify_sources.py

# 容器内端到端（扫描/回测/断源阻断/跨期分钟）
docker exec -i -w /app tsp-local /app/.venv/bin/python - < scripts/verify_tsp.py

# 实时刷新是否在跑（注意先确认是否已收盘）
docker compose logs --since 10m app 2>&1 | grep '行情刷新'

# enriched 缓存是否含重复（自选股问题的判据）
docker exec -i -w /app tsp-local /app/.venv/bin/python -c "
from app.tickflow.repository import DataStore,KlineRepository
df,d=KlineRepository(DataStore()).get_enriched_latest()
import polars as pl; print(df.height, df['symbol'].n_unique())"
```

**日常操作提醒**：16:00 后 free-stockdb 自动同步当日数据，同步完成后在 TSP 数据页**手动**执行盘后管道；**盘中不要执行**，会导入未收盘日K。本机重启后桥接不自启，需手动 `./scripts/start-local.sh`。

---

## 7. 限制与未完成项（保持关闭，不得勾为完成）

- **ETF 实时快照未接入**（当前轮询 0 只 ETF）——`沪深A股` 分类不含 ETF，需另找分类行情或批量接口。
- **五档定版未开放**：`depth5` 数据集尚未在任何 provider 声明（阶段2 §4.2）。
- **完整财务三表 / 公告日、历史 PIT** 仍未开放；财务仅到「原始观察层」。
- **单标的秒级行情时刻未独立验证**（`server_time_raw` 部分值秒位 >59，只取 HHMM 层）；观察页单只快照保持 `stale`。
- `tasks/p0-p1-plan.md` 的 **P0/P1 清单仍未获用户批准**，阶段1 未执行。
- 上游 `quote_service` 的「未配置付费服务器 API Key」警告是原生轮询噪音；实时已改走 eltdx，该警告不应再作为故障依据，但也不需改上游代码。

---

## 8. 阶段2 建议执行顺序

1. **问题1 自选股重复**（数据脏 → 用户可见 bug，改动面最小、见效最快）：先加防御性去重，再重建 enriched 分区。
2. **问题3 板块 fuyao 报错**（纯本地改造，与 `boards` 现成数据对接即可）。
3. **问题2 五档盘口**（eltdx 已验证可取，沿用 realtime 同构路径）。
4. **问题2 财务数据**（需先定开放范围：原始观察层 vs PIT 三表）。

每项完成后：跑 §6 全量验证 → 更新本文件与 `tasks/todo.md` → 记录实际验收结果，**未验证项不得勾为完成**。

---

*文档生成时间：2026-11-04 15:40（GMT+8）。阶段1 运行时点：桥接 PID 57222 / 容器 healthy / 实时已进入收盘休盘态。*

---

## 9. 阶段2 完成记录（2026-11-04 盘后）

原则：全部改动落在 `bridge/`、`plugins/local_quant/`、`overrides/`、`scripts/`、`tests/`；`upstream/` 保持只读参考，固定镜像 digest 未变。三个用户可见问题全部关闭，未验证项继续明确关闭。

### 9.1 问题1 — 自选股重复（已修复并验收）

- **实际修法**（与 §4.1 建议等价但不动上游 API 文件）：`scripts/repair_enriched_duplicates.py` 先备份再原子重建脏分区。`data-local/kline_daily_enriched/date=2026-11-04/part.parquet` 实测由 **3391 行 / 1029 条重复** 变为 **2362 行 / 0 重复**，备份落在 `_backup/date=2026-11-04-20261104-155956.parquet`。`kline_index_enriched` 当日分区 4 行 / 0 重复，无需改。
- **运行时防御**：`overrides/source_policy.py::install_enriched_integrity()`（由 `overrides/bootstrap.py` 调用）包装 `KlineRepository` 的 `get_enriched_latest` / `get_enriched_latest_asset` / `flush_live_enriched_asset` / `merge_live_enriched_asset`，读写两侧均 `unique(subset=['symbol'], keep='last', maintain_order=True)`，切断「合入旧行 → 重复放大 → 再写回」的递归。容器日志 `ENRICHED_INTEGRITY_ACTIVE` 确认生效。
- **验收**：`/api/watchlist/enriched` → `count=2`、`symbols=['002474.SZ','001219.SZ']`，页面不再重复。

### 9.2 问题2 — 五档盘口与财务（已实现并验收）

- **五档**：改为 `eltdx client.quotes.get_depth(codes)` 原生 0x0547（`quotes.get_depth` → `refresh`，单次 100 代码），不再是 `realtime()` 派生。`bridge/live_sources.py` 新增 `_depth_event()`，用握手 `server_date_1` + 逐标的 `update_time_raw`(HHMMSS) 构造 `event_time` 与毫秒 `timestamp`；无时钟/无价/无盘口/缺代码显式失败，不足 5 档 `levels_complete=false` 且不补零；盘后 `lag>10min` 标 `stale=true / AFTER_HOURS_FINAL_BOOK`。
- **实测**：600031.SH `last=18.69`、买 `18.69/18.68/18.67/18.66/18.65`、卖 `18.70…18.74`、`update_time_raw=153000`；002474.SZ `last=5.49`、`153309`；001219.SZ 同样返回 5 档。
- **财务更正**：eltdx **确实提供** `client.corporate.finance_batch(codes, on_missing='skip')`（`eltdx/api/corporate.py`），`FinanceRecord` 含 `updated_date` / `ipo_date` / `eps_raw` / 股本 / 总资产 / 净利润 / 收入等。§4.2(b) 的「eltdx 不提供财务」是错误结论，已废弃。
- **观察层**：新增 `bridge/finance.py` —— `period_end` 来自本地 `gpcw*.dat/zip` 报告期头，最新命名快照来自 eltdx；`announce_date` / `ann_date` 恒 `None`，`source_updated_date` 单列，`pit_verified` / `announce_date_verified` / `field_mapping_verified` 全为 `false`，`coverage=OBSERVATION_ONLY_NOT_PIT`，历史报告期不填最新字段、缺失为 null。`bridge/router.py` 对 `raw` / `observation` 仍走本地 gpcw，上游 5 表走新观察层；`bridge/server.py` 的 `Query.table` 已纳入 `balance_sheet` / `cash_flow`。
- **批量限制**：`eltdx/api/_batch.py::_RECOVERY_REQUESTS = 32`，100 只 `on_missing='raise'` 会 `ProtocolError: finance batch recovery request budget exhausted (32)`。适配改为 20 只分片 + 失败递归二分 + 单只缺失返回 `[]`，不补零。
- **provider / 能力**：`plugin.yaml` 与 `DATASETS` 加入 `depth5`、`financial`；`get_depth_batch()` 按 100 分片并校验返回 dict；`get_financials()` 归一化 `balance` / `cashflow` 别名。`/api/settings/capability-matrix` 中 `depth5` / `financial` 均 `usable=true effective=local_quant`；`/api/financials/status` 由 `available:false` 变为 `available:true`。
- **限流韧性**：首次全量同步在最后一张 `shares` 表因桥接 240 次/分限流失败（`sync_shares custom provider failed: Bridge rate limit`）。`bridge/server.py` 限流改为可配置 `TSP_BRIDGE_RATE_PER_MIN`（默认 600，钳制在 60–2000）；`provider._request()` 对 **429 且仅 429** 做 (1,2,4,8,16,20)s 有界退避重试，503 作为 fail-closed 源错误立即上报，重试耗尽也显式报错。
- **页面**：`overrides/source_panel.py` 新增 `depth5` 数据集与「财务表」下拉（raw / observation / metrics / income / balance_sheet / cash_flow / shares），说明 PIT 仍关闭。

### 9.3 问题3 — 板块 fuyao 报错与空表（已修复并验收）

- **根因补充**：不只是「缺 key」——`overrides/source_policy.py` 已阻断 fuyao 域名，且 `ext_presets.ensure_builtin_presets()` 会在启动时把出厂 fuyao 配方重新写入已存在的两张表配置，所以仅禁用 `pull.enabled` 或手改 URL 都会在重启后复活报错。
- **修法**：`overrides/local_extensions.py` 保留上游字段名契约（`ext_gn_ths.所属概念` / `ext_hy_ths.所属同花顺行业`，监控与策略列依赖它），把配置替换为「`url=''` / `auth=None` / `fanout=None` / `enabled=False` / `last_status=None` / `last_message=None`」的本地配置；`install_local_presets()` 在 `app.main` 导入前由 `source_policy.install_app_policy()` 调用，替换 `ext_presets.ensure_builtin_presets`，启动钩子在两张表为空时自动调用 `sync_boards()` 补数。
- **数据**：同一份本地 boards 归属写入 `ext_gn_ths/part.parquet`（**5506 行**）与 `ext_hy_ths/part.parquet`（**5507 行**）；主分类为 free_stockdb 概念 / 申万行业，次级通达信分类加 `TDX/` 前缀以标注来源；标签去重、快照整表替换。`monitor_ext_fields` 指回出厂表并修正上游 `所属同话顺行业` 拼写错误。
  - ⚠️ **后续修正（阶段3）**：该 `TDX/` 前缀已被撤销。页面按字段中 `/` 第一段聚合大类，`TDX/家居用品` 会被切成伪大类 `TDX`；现改为 `builtin_rows()` 只发布 primary 分类，通达信分类移入 `local_tdx_*` 独立表。见 §10.1。
- **验收**：重启日志 `LOCAL_PRESETS_ACTIVE`、`LOCAL_PRESETS: fuyao recipe removed from ext_gn_ths,ext_hy_ths`、`built-in boards published {'ext_gn_ths': 5506, 'ext_hy_ths': 5507}`；两张表 `/rows` 返回真实数据；10 张扩展表全部有数据；`data-local/ext_data/*/config.json` 中 `fuyao` 零残留、无 `fuyao_api_key` 报错。

### 9.4 回归与仍关闭项

- `pytest` **113 项全通过**（新增 `tests/test_depth_financial.py`、`tests/test_local_presets.py`，扩展 `test_provider.py` / `test_live_sources.py` / `test_local_extensions.py` / `test_source_policy.py`）。
- 仍**关闭**：ETF 实时快照；单标的秒级行情时刻独立验证；观察页单只 `realtime()` 的 `stale=true`；盘中连续五档回放；完整财务三大报表 / 公告日 / 历史 PIT 财务因子；`tasks/p0-p1-plan.md` 的 P0/P1 清单仍未获批准。
- 五档 `stale=true` 与财务 `announce_date=None` 都是刻意的 fail-closed 语义，**不得**为了「看起来可用」而补零或伪造时间。

---

## 10. 阶段3 完成记录：fuyao Key 可用的离线增强（2026-11-04 晚间）

原则不变：固定镜像 digest、`upstream/`、容器零外联白名单、provider 锁定、能力矩阵、`verify_tsp.py` 阻断断言**全部未改**。fuyao 不设为主数据源、不注册 provider、不启用 `app/plugins/fuyao`。

### 10.1 前置修正：行业页伪 "TDX" 大类

用户截图反馈概念/行业等板块列表出现独立 `TDX` 条目（0.00%），并出现在最强行业、最大风险、资金活跃、领涨主线/领跌方向及图例中。排查排除了 fuyao 报错残留、free_stockdb 板块列表（1337 个板块 type 仅 concept/sw_1/sw_2/sw_3）、通达信导出 `行业板块.txt`（5525 行无 TDX 字样），最终定位到 §9.3 的 `TDX/` 前缀：页面按字段中 `/` 第一段聚合大类，`TDX/家居用品` 被切成伪大类。实测 `ext_hy_ths` 按 `/` 切分前缀恰为 `['TDX','申万一级','申万二级','申万三级']`，与截图吻合。

修复：`overrides/local_extensions.py::builtin_rows()` 只发布 primary 分类（free_stockdb 概念 / 申万行业），通达信分类留在 `local_tdx_*` 独立 timeseries 表；同时恢复标签去重、修正仍断言 `TDX/` 混入的旧测试。容器内重跑 `sync_boards()` 后 `ext_gn_ths` 5492 / `ext_hy_ths` 5130 行，`local_tdx_industry` 5506 / `local_tdx_concept` 5382 保留，含 `TDX/` 行数 0。新增 `docs/data-inventory.md` 作为全部数据情况总览。

### 10.2 决策与 Key 边界

| 项 | 处置 |
|---|---|
| Key 落点 | `runtime/fuyao.env`（0600）；`runtime/` 不挂载、已在 `.gitignore` |
| 刻意不写 | `.env`（compose `env_file` 会注入容器）、`data-local/user_data/secrets.json`（挂载进容器） |
| 导入方式 | 宿主机 `scripts/import_fuyao.py`；中间缓存 `runtime/fuyao-cache/`，成品 `data-local/fuyao/` |
| 容器侧 | `FuyaoStore` 只读本地 parquet/json，不打开 socket；Key 与 manifest 均不含值 |
| 不变量 | 能力矩阵 7 项仍 `usable=true / effective=local_quant`；`tickflow_tier=disabled`；容器内 `fuyao.aicubes.cn` 仍被阻断 |

实测全仓（含 `data-local/`、`docs/`、`tests/`、`scripts/`、runtime 缓存）**零 Key 泄漏**，Key 文件权限 `0600`。

### 10.3 语义探活：不能把 `report_date_ms` 写成 `announce_date`

证据 `tasks/fuyao-probe.json`：4 只股票 × 3 张表 × 8 期 = 96 行。最近约 4 期像真实披露日（逐股不同、滞后 Q1 25–30 天 / Q2 46–62 天 / Q3 24–31 天 / 年报 80–114 天）；更早历史期按季度类型回填成最新批次日（滞后 389–479 天）；16 个 `(symbol, period_end)` 三表日期冲突；`balance_sheets` 历史行尤为混乱。上游 `app/plugins/fuyao/provider.py` 直接 `_iso_of_ms(report_date_ms) → announce_date` 的映射**不成立**。

判定：`REPORT_DATE_MS_IS_NOT_A_VERIFIED_PIT_DISCLOSURE_DATE`，PIT 继续关闭。导入只写 `report_date` + `announce_date_candidate` + `report_date_quality`；质量标签 `ANNOUNCE_DATE_CANDIDATE` / `CROSS_TABLE_CONFLICT` / `HISTORICAL_BACKFILL_SUSPECT` / `REPORT_DATE_MISSING` / `REPORT_DATE_BEFORE_PERIOD_END` / `LAG_OUTSIDE_DISCLOSURE_WINDOW`。所有行 `pit_verified=False`、`announce_date_verified=False`、`field_mapping_verified=False`。

### 10.4 实现清单

| 文件 | 作用 |
|---|---|
| `bridge/fuyao_offline.py`（新） | Key 读取、有界重试 REST 客户端、日期分类、三表标准化、候选日交叉校验、只读 `FuyaoStore` |
| `scripts/import_fuyao.py`（新） | `--probe` / `--boards` / `--financial` / `--all`，断点续跑、原子写、失败标签化、manifest 分次运行保留 |
| `bridge/finance.py` | 观察层新增 `fuyao_*` 交叉标注列；`announce_date` 与 `pit_verified` 保持原值 |
| `bridge/router.py` / `bridge/server.py` | 只读 dataset `fuyao`；`/status` 增加 `fuyao_offline` 与 `fuyao_pit`；metadata 固定 `no_network_access` / `key_in_container=false` / `pit_verified=false` |
| `overrides/local_extensions.py` | `publish_official_boards()` 发布两张独立官方分类表；只有 `manifest.boards.complete=true` 才写 |
| `overrides/source_panel.py` | `/local-sources` 增加 fuyao 下拉项与「发布官方分类为独立表」按钮 + `POST /api/local-sources/fuyao/publish` |
| `tests/test_fuyao_offline.py`（新）、`tests/test_local_extensions.py` | 无网络、无真实 Key 的回归覆盖（Key 优先级、fail-closed、日期分类、三表冲突、交叉标注、metadata） |

### 10.5 实测产物与验收

- 官方分类：概念 390 板块 / 70,601 成分 / 5,580 只；行业 320 板块 / 10,287 成分 / 5,578 只；零失败。发布 `fuyao_ths_concept` 5,580 行、`fuyao_ths_industry` 5,578 行，含 `/` 的值 0 条（`/`、`;` 全角化防止伪大类复发）。
- 财务三表：5,580 只零错误，`income` 44,640 / `balance_sheet` 44,639 / `cash_flow` 44,640 行；候选公告日 44,787 键（候选 16,716 / 三表冲突 22,149 / 回填疑似 5,900 / 缺失 17 / 窗口外 5）。
- 回归：`pytest` **139 项全通过**；`verify_sources.py` 8 项 PASS；容器内 `verify_tsp.py` 端到端通过且 `network_blocks.fuyao.aicubes.cn=true`；`/local-sources` HTTP 200；桥接 `/status` 的 `fuyao_offline.available=true`、`fuyao_pit=DISABLED_REPORT_DATE_MS_NOT_A_VERIFIED_DISCLOSURE_DATE`。
- 文档：`docs/fuyao-offline.md`（新）、`docs/data-inventory.md`、`README.local.md`、`tasks/todo.md` 同步。

### 10.6 仍关闭（不得勾为完成）

PIT 财务因子与回测、法定公告日、官方三表字段映射独立验证（`field_mapping_verified=false`）、板块成分历史版本、离线产物自动定时刷新、ETF 实时快照、单标的秒级行情时刻验证、盘中连续五档回放、`tasks/p0-p1-plan.md` 的 P0/P1 清单。

---

*阶段3 记录时间：2026-11-04 晚间（GMT+8）。*
