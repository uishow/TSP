# 封单采样器（seal-sampler.mjs）

每 10 秒把「自选池 + 今日接近/已涨停」的票的五档拍一次，落成 `封单/YYYY-MM-DD.ndjson`。
页面里的「封单质量」和小图就是读这个文件算出来的。

## 它能干什么

- 记录买一挂单量随时间的变化 → 区分「封单被吃掉」还是「主力自己撤单」
- 落到本地 ndjson，纯只读，不写任何行情库

## 依赖（两个，都是本机已有服务）

| 用途 | 接口 |
|---|---|
| 候选池 + 流通股本 + 成交额 | TSP `GET /api/screener/market-snapshot`、`GET /api/watchlist` |
| 五档盘口（买一量） | ELTDX 适配器 `POST http://127.0.0.1:3021/depth5` |

也就是说：**TSP 必须开着，且 3021 上要有能返回五档的适配器**。
如果你的环境没有 ELTDX，把 `seal-sampler.mjs` 里 `fetchDepth()` 那段（约 20 行，`postJson(${ADAPTER}/depth5)`）换成任何返回
`{bids:[{price, volume}...]}` 的接口即可，其余逻辑不用动。

## 用法

```powershell
cd sampler
copy config.example.json config.json   # 填 TSP 端口 / 采样参数
node seal-sampler.mjs --once           # 先采一轮看输出（盘后也能跑，采到的是收盘快照）
node seal-sampler.mjs                  # 常驻，09:15–15:05，收盘自动退出
```

输出：`<包根>/封单/2026-11-10.ndjson`，一行一个时间片：

```json
{"ts":"...","t":"09:31:18","rows":[{"s":"002943.SZ","n":"宇晶股份","p":33.98,
  "b1p":33.98,"b1v":58,"seal":197084,"amt":970000000,"fs":...,"up":1}]}
```

`b1v` 单位是**手**，`seal = b1p * b1v * 100`（元）。

## 挂计划任务

`run-seal.ps1` 是包装脚本（Node 路径探测 + 日志落 `logs/seal-YYYYMMDD.log`）。
计划任务设成**工作日 09:12 启动**即可，脚本自己会在 15:05 退出。

## 和页面的关系

采样器把文件写到 `封单/`，页面调 `/bigorder/seal?symbol=` 读它。两边靠目录对齐：

```
adapter/data/封单/2026-11-10.ndjson      ← 采样器写这里
```

如果不是这个路径，两个地方都要改：
- 采样器：`OUT_DIR`
- 数据服务：环境变量 `BIGORDER_SEAL_DIR`
