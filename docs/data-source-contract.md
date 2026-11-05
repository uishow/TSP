# TSP 本地数据契约

适用版本：本机固定的 TSP v0.3.27 / macOS arm64 / Python 3.14。

## 路径与用途

- 本地数据主目录：`/Users/beryllewis/private/stock/数据汇总/本地量化数据`。
- free-stockdb 程序与 SDK：`/Users/beryllewis/private/stock/数据汇总/free-stockdb`，本机数据库服务 `127.0.0.1:7899`。TSP 不运行其同步脚本。
- `parquet_5min/<year>/<code>.parquet`：按请求窗口读取 2000—2024 历史原始 5 分钟价；2025 起读取 SDK 原始分钟价。
- 通达信 `vipdoc`：补充 day/lc1/lc5 原始价、指数/ETF清单和 gpcw 专业财务原始观察。
- 通达信 `T0002/export`：单独提供前复权观察，不混入原始价入库。
- 实时联网：eltdx 3.3.2；显式选择 AxData 0.1.4 的固定 `stock_realtime_snapshot_tdx` 接口。AxData 使用 local 模式，不能由环境变量自动切到别的 API 服务。

## 标准化

标识为 `600031.SH` / `000001.SZ` / `920001.BJ`。价格元、成交额元、成交量手；SDK 和 vipdoc 股票/分钟的股数除以100（ETF日线见续验修正），历史Parquet的volume_lots不再换算。缺项保留null。日K日期ISO，分钟为北京时间无时区墙钟ISO；8位结束日期包含全天。SDK `fq=None` 显式锁原始价，事件 `mult` 映射为TSP单事件 `ex_factor`，不使用累计cum替代事件值。

日K管道仍由TSP基于原始价和事件因子生成前复权指标。当前复权基准可能随新事件变化，不能因此声称历史PIT合格。

现有 stockdb_unified/query.py 没有把 adjust 传入2025后SDK段，且8位end补到00:00；本接入直接调用SDK并修正日期边界，不修改该上游文件。

## 新鲜度与失败

历史固定窗口不自动联系实时接口。当前分钟窗口按北京交易时段、午休/收盘和每个标的已观测时间判断是否需要eltdx补充。日期判断的交易日历为保守工作日/时段推断，节假日权威性未证明；返回实际事件时间而非伪造“今日完整”。

实时快照未提供可核验的日期时，timestamp/event_time=null、stale=true，采集时间单列observed_at。不得把采集时间当行情时间。

本地同键差异按主量化源优先，补充文件只补缺，冲突计数和近期例证留在来源状态。原始来源文件不修改。桥接响应带内容hash、实际覆盖时间和来源；它不证明多个文件是同一瞬间快照。

## 板块与财务边界

本地板块共1337个（此次读取），包括概念及申万一/二/三级。TSP扩展表为local_concepts/local_industries，按采集日保留数据，并额外按内容hash保存证据。当前成员回看历史存在归属漂移，pit_verified=false。

专业财务 gpcw 已解析编号字段 col1…，报告期不冒充公告日。此次600031样本为2026-09-30、658列；未来空占位报告跳过。完整指标语义/公告日未通过核验，因此financial能力不在TSP可用候选中；原始观察可在本地数据源页面查询，不能用于已验证的财务回测。

最新股票名称/股本来自本地近日K并保留metadata_date。上游TSP缺历史股本时可能使用最新股本计算历史换手率，这种研究仍有时点风险，本次数据接入不构成消除此类风险的证明。

## 验收

以tasks/actual-source-checks.json、tasks/tsp-integration-result.json和tasks/disconnect-check.json为实际证据。缺少的历史分钟范围不填零，不将全量2000年以来数据全部复制到TSP。TSP初始化缓存为最近约一年；长历史通过桥接按请求读取。

补充：通达信export的地区/风格/指数/行业/概念/自定义成分已逐类读取并接入独立扩展表，保留source_file和mtime。free-stockdb与通达信两类合计2008个分类记录；不同分类体系不宣称同一历史口径。

## 续验修正（2026-11-04）

- ETF日线价格用千分之一元还原；日线成交量编码不能按“ETF一律股/手”统一假设。对每条记录核验两个单位候选所隐含的成交均价是否落在原始低高价区间（容差0.5%），仅唯一候选可用时输出手数并记录raw_volume、volume_scale_to_hand、volume_quality；否则volume=null。ETF分钟线仍按实测原格式读取，不套日线规则。
- TSP原生实时流程会丢弃stale标记，并可能将null行情时间的旧快照落为当日K线，因此实时快照/五档仅在来源观察页可查，原生realtime/depth5能力不再声明可用。真实行情日期能够核验后才可重新开放。
- 当前日K查询请求最新检查；历史固定窗口不自动联网。全量分钟提供方法将股票池拆成20只一批，避免超过桥接200只上限。
- provider中的带时区datetime先转北京时间无时区墙钟，再发送；日线和事件因子的日期比较使用日期精度，避免首个交易日被datetime字符串误排除。
