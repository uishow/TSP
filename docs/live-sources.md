# 实时取数

默认eltdx 3.3.2。`.env`中设置`TSP_LIVE_BACKEND=axdata`后重启桥接可显式选择AxData 0.1.4；不因单次错误自动换源。AxData只允许固定的TDX快照接口，bar接口仍由eltdx模式提供；选择AxData不代表支持其全部插件。

eltdx：`helpers.full_quotes`返回快照与盘口，`bars.get(adjust='none')`返回原始日/分钟K。成交量为手、成交额为元。上证指数快照使用sh999999别名，输出还原000001.SH。

当前实测服务器上`bar_time='start'`保留正确右端时刻：1m末根15:00、5m首根09:35末根15:00；`end`会再次平移至15:01/15:05，故适配锁为start。版本变更或更换服务器后需要重验，不盲从名称推断时刻。

快照time_raw没有可核验的交易日期，timestamp/event_time保持null，stale=true，观测时间单列。页面不能把此类样本当作已验证当日实时价格。实测600031收盘18.84；SDK日K成交额2042960000元，eltdx精确成交额2042962944元，来源精度差异保留。

全市场实时轮询由 TSP 原生 quote_service 驱动（插件声明 realtime 后自动生效），桥接不自行轮询。适配具有请求限频、串行连接访问和有限重试，失败明确返回不可用。可选TSP_ELTDX_HOST锁定已验证的通达信服务器，默认由eltdx选择；不改变系统代理或其他应用。

## 全市场实时行情（2026-11-04 接入）

- 上游 `quote_service` 的自定义源分支由 `provider_has_dataset('local_quant','realtime')` 判定。此前未声明 realtime，每轮都回退到被来源政策置 None 的 `get_paid_realtime_client()`，只报「未配置付费服务器 API Key」而不刷新。插件声明后走 `provider.get_realtime()` / `get_realtime_indices()`。
- 桥接 `live_sources.market_snapshot()` 用 `helpers.realtime_rank(category='沪深A股', count=6000)` 一次取回约 5570 行（4–10s），上游实测 60s 间隔连续多轮成功。`full_quotes` 批量接口对缺失代码会抛 `MissingCodesError`，因此只用于观察页单只与显式指数快照，不用于全市场。排名接口分页会重叠返回同一代码，必须按 symbol 去重后出数，否则当日 `kline_daily` 会出现重复 (date,symbol) 行、导致回测矩阵预热报 `MarketDataMatrix requires unique date/symbol rows`。
- 时间证据：`session.handshake()` 提供 `server_datetime` / `server_date_1` / `server_date_2`（实测 2026-11-04 14:36:38，武汉电信主站1）。逐标的 `raw.server_time_raw` 是 8 位编码，部分值秒位 >59，故只取 `//10000` 的 HHMM 层做新鲜度门槛：领先会话时刻 >2 分钟或落后 >10 分钟即排除。无成交 / 无有效价 / 无时钟记录一律不返回。
- 单位：`change_pct` 上游是百分数，转小数制；`volume` 手、`amount` 元；`timestamp` 北京时间毫秒 epoch，映射为上游 `quote_ts`（原先 null 会被 `_build_daily` 用 `cn_today()` 落成当日 K 线，这是旧版关闭实时的原因）。
- 指数：`000001.SH → sh999999`，4 只核心指数实测成功。ETF 实时快照未接入，当前轮询 0 只 ETF。
- 保留：观察页单只 `realtime()` 仍是 `timestamp=None / stale=True / SOURCE_CLOCK_UNKNOWN`。单标的秒级行情时刻未独立验证，不要当作 PIT 或逐笔时间证明。

## 五档盘口（2026-11-04 接入，原生 0x0547）

`bridge/live_sources.py::depth()` 走 `client.quotes.get_depth(codes)`（eltdx 3.3.2 原生 0x0547，单次最多 100 代码），不再由 `realtime()` / `full_quotes` 派生伪盘口。每条 `QuoteRefreshRecord` 的 `buy_levels` / `sell_levels` 各 5 档，输出 `bids` / `asks` / `bid_prices` / `ask_prices` / `bid_volumes` / `ask_volumes`，以及 `last_price` / `prev_close` / `source_time_raw`。

- 时间证据：`session.handshake()` 的 `server_date_1` 作交易日期，逐标的 `update_time_raw`（HHMMSS）合成 `event_time` 与毫秒 `timestamp`；无时钟、无有效价、无盘口或缺失代码一律显式失败。
- 不补零：不足 5 档时保留实际观测并置 `levels_complete=false`；`coverage=OBSERVED_LEVELS_ONLY`。
- fail-closed 陈旧判定：`event_time` 相对握手 `server_datetime` 落后超过 `max_lag_minutes=10` 时 `stale=true`、`freshness_reason=AFTER_HOURS_FINAL_BOOK`。盘后样本因此是「收盘最终盘口观察」，**不是盘中连续五档回放**。
- 上游契约：`depth_service` 要求 `provider_has_dataset(name,'depth5')` 与 `get_depth_batch(symbols)`，落盘 `data/depth5/date=xxx/part.parquet`；plugin.yaml 与 provider 已声明 `depth5`，provider 按 100 只分片并要求桥接返回 dict，结构异常直接报错、不回退。

## 财务观察层（2026-11-04 接入）

eltdx **提供** `client.corporate.finance_batch(codes, on_missing='skip')`（`FinanceRecord` 含 `updated_date`、`ipo_date`、`eps_raw`、股本、总资产、净利润、收入等；`total_shares` / `circulating_shares` 为万股 ×10000，`total_assets_yuan` / `net_profit_yuan` 为千元 ×1000）。交接文档早期「eltdx 不提供财务」的结论已更正。

- `bridge/finance.py`：`period_end` 与 `eps_observation` / `bps_observation` 来自本地 `gpcw*.dat/zip` 报告期头，最新命名快照来自 eltdx；`announce_date` / `ann_date` 恒为 `None`，`source_updated_date` 单列保存 TDX 财务文件更新日。
- 明确标注 `pit_verified=false`、`announce_date_verified=false`、`field_mapping_verified=false`、`coverage=OBSERVATION_ONLY_NOT_PIT`；历史报告期不填最新快照字段，缺失保持 null、不补零。
- 批量 recover 预算只有 32 次请求（`eltdx/api/_batch.py::_RECOVERY_REQUESTS`），100 只会耗尽。适配按 20 只分片，失败时递归二分，单只缺失返回 `[]`。
- 因 `announce_date` 为空，`app/backtest/fundamentals.py` 的 PIT 财务因子仍不可用，这是刻意保守，不宣称完整三大报表或历史 PIT。
