# TSP 本地部署 · 数据情况总览

> 生成时间：2026-11-04 19:30（GMT+8）｜部署形态：固定镜像 + 本地三层覆盖（不改上游源码）
> 访问入口：主面板 `http://127.0.0.1:3018/`｜本地数据源面板 `http://127.0.0.1:3018/local-sources`
> 桥接（数据供给）：`127.0.0.1:7818`（宿主机独立进程）｜free_stockdb：`127.0.0.1:7899`

---

## 0. 架构一句话

```
固定镜像 ghcr.io/shy3130/tick-stock-panel@sha256:c52e...0755d  (只读参考 upstream/)
   └─ 挂载 ./overrides        (只读, 来源政策/启动钩子/板块修正)
   └─ 挂载 ./plugins/local_quant (只读, 本地数据源 provider)
   └─ 挂载 ./data-local       (读写, 落盘数据)
        └─ 桥接 ./bridge      (宿主机进程, 适配 eltdx / 通达信本地文件 / free_stockdb)
```

**不变量**：上游源码与固定镜像 digest 一律不改；所有修复落在 `bridge/`、`plugins/local_quant/`、`overrides/`、`scripts/`、`tests/`。

---

## 1. 来源政策（硬约束）

| 规则 | 说明 |
|---|---|
| 实时只用 `eltdx` 或显式 `AxData` | 其他供应商域名 egress 在容器内被 `overrides/source_policy.py` 阻断 |
| vendor egress 全阻断 | `tickflow`、`fuyao.aicubes.cn` 等域名 TCP 连接被拒，运行日志有 `SOURCE_POLICY_ACTIVE` |
| 缺失显式报错 | 不补零、不静默回退、不伪造 `announce_date` |
| 本地源只读 | `free_stockdb`、通达信 `vipdoc`/`T0002/export` 只解析不写 |
| 财务 PIT 保守 | `announce_date` 恒为空，不宣称 PIT 达标、不用于回测财务因子 |

---

## 2. 数据来源清单

| 来源 | 位置 | 类型 | 提供内容 |
|---|---|---|---|
| **free_stockdb** | `127.0.0.1:7899` | 本机数据库（SDK） | 股票代码、日K、分钟K、复权事件、申万板块、基础行情、板块列表 |
| **通达信本地文件** | `~/Library/.../tdx-new/` | 本机二进制/文本 | `vipdoc` 日/分钟K、导出前复权K、`T0002/export/*板块.txt`、`cw/gpcw*` 财务 |
| **eltdx** | 实时网络（TCP） | 实时行情服务 | 全市场实时快照、五档盘口（0x0547）、财务快照（`finance_batch`） |
| **上游镜像内置** | 固定镜像 | 固化 | 板块定义、指标计算、回测引擎、策略框架 |

---

## 3. 各数据集状态

### 3.1 行情类

| 数据集 | 来源 | 状态 | 备注 |
|---|---|---|---|
| `daily` 日K | free_stockdb + tdx 合并 | ✅ | raw 价格基准，单位已校验；冲突保留双方 |
| `minute` 分钟K | free_stockdb(≥2025) + tdx 5min(≤2024) + 本地 parquet | ✅ | 1m/5m；2025 起走 SDK，历史走本地 |
| `adj_factor` 复权 | free_stockdb 复权事件 | ✅ | mult 校验，<=0 报错 |
| `realtime` 实时 | eltdx `market_snapshot` | ✅（交易时段） | 盘后 `stale=True` 为预期 fail-closed |
| `depth5` 五档盘口 | eltdx `quotes.get_depth` 原生 0x0547 | ✅ | 买/卖各 5 档齐全，`levels_complete`；盘后 `stale` |
| ETF 实时快照 | — | ❌ 未接入 | 已知限制 |

### 3.2 财务类

| 表 | 来源 | 行数 / 标的 | 状态 |
|---|---|---|---|
| `raw` / `observation` | 本地 `gpcw` 原始观察 | — | ✅ 编号列观察，公告日非语义 |
| `metrics` | gpcw 报告期 + eltdx 快照 | ~43920 / 5490 | ✅ 观察层，`announce_date` 空 |
| `income` | 同上 | ~43920 / 5490 | ✅ 同上 |
| `balance_sheet` | 同上 | ~43920 / 5490 | ✅ 同上 |
| `cash_flow` | 同上 | ~43920 / 5490 | ✅ 同上 |
| `shares` | 同上 | ~43920 / 5490 | ✅ 本轮修复限流后补齐 |
| fuyao 官方 `income` | 宿主机离线导入同花顺 | 44640 / 5580 | ✅ 独立表，canonical 列名沿用上游 provider（映射未验证） |
| fuyao 官方 `balance_sheet` | 同上 | 44639 / 5580 | ✅ 同上 |
| fuyao 官方 `cash_flow` | 同上 | 44640 / 5580 | ✅ 同上 |
| fuyao 候选公告日 | 三表日期交叉校验 | 44787 键 | ⚠️ 候选 16716 / 冲突 22149 / 回填疑似 5900，非 PIT |
| **PIT 三表 / 公告日** | — | — | ❌ 未开放（`announce_date=None`） |

> 财务"原始观察层"、"官方三表数值"与"完整 PIT 三表"必须分开表述。
> 现有 5 张上游表只增加 `fuyao_*` 交叉标注列：`announce_date` 仍为空、`pit_verified=false`。
> 实测 fuyao 的 `report_date_ms` 对历史期按季度回填且与三表冲突，**不是可验证的披露日**，
> 因此只保存候选日 + 质量标签。详见 `docs/fuyao-offline.md`。

### 3.3 板块 / 概念 / 行业类

| 表 | 内容 | 行数 | 模式 | 备注 |
|---|---|---|---|---|
| `ext_gn_ths` 扩展概念 | free_stockdb 概念（同花顺体系） | 5492 | snapshot | ✅ 已去除 TDX 污染；**板块页已切换为官方分类，此表保留作回滚** |
| `ext_hy_ths` 扩展行业 | 申万一/二/三级 | 5130 | snapshot | ✅ 已去除 TDX 污染；**板块页已切换为官方分类，此表保留作回滚** |
| `fuyao_ths_concept` | **同花顺官方概念** | 5580 | snapshot | ✅ **板块页当前生效表**；390 板块 / 70601 条成分 |
| `fuyao_ths_industry` | **同花顺官方行业** | 5578 | snapshot | ✅ **板块页当前生效表**；320 板块 / 10287 条成分；扁平无层级 |
| `local_concepts` | free_stockdb 概念快照 | 5492 | timeseries | 本地归属证据 |
| `local_industries` | 申万行业快照 | 5130 | timeseries | 本地归属证据 |
| `local_tdx_concept` | 通达信概念 | 5382 | timeseries | 独立表，不污染行业页 |
| `local_tdx_industry` | 通达信行业 | 5506 | timeseries | 独立表，不污染行业页 |
| `local_region` | 通达信地区 | 5506 | timeseries | |
| `local_style` | 通达信风格 | 5283 | timeseries | |
| `local_index_membership` | 通达信指数成分 | 3330 | timeseries | |
| `local_custom_membership` | 通达信自定义 | 5197 | timeseries | |

> **TDX 含义**：通达信（TongDaXin）本地板块分类。因其与申万/同花顺分类体系不同，单独放在 `local_tdx_*` 表，避免污染"同花顺行业"字段（行业/概念页按 `/` 前缀聚合大类，曾因此误生成伪 "TDX" 大类，已于本轮修复）。

### 3.4 其他

| 数据 | 状态 | 备注 |
|---|---|---|
| 自选股 `watchlist` | ✅ 2 只（`002474.SZ`、`001219.SZ`） | 修复重复显示；enriched 按 symbol 去重 |
| `enriched` 缓存 | ✅ symbol 唯一 | `overrides/source_policy.py` 读/写双路径去重 |
| 监控中心 / 市场主线 / 复盘 | ✅ | 基于上述数据；主线成分无历史版本（回看漂移） |
| 能力矩阵 | ✅ 7 项 `usable=true / effective=local_quant` | 含 `depth5`、`financial` |

---

## 4. 本轮修复记录

| 问题 | 根因 | 修复 | 验收 |
|---|---|---|---|
| 自选股重复显示 | enriched 缓存含重复 symbol，JOIN 放大行数 | 去重脚本 + 运行时去重覆盖层 | `watchlist/enriched` 稳定 2 行 |
| 五档盘口空 | 上游原无本地五档 | `eltdx.quotes.get_depth` 原生 0x0547 | 实测买/卖各 5 档齐全 |
| 财务无数据 | 误判 eltdx 不提供财务 | `eltdx.corporate.finance_batch` + 本地 gpcw 观察层 | 5 表各 ~43920 行 |
| 板块 fuyao 报错 | 出厂配方指向 fuyao 且需 Key，域名被阻断 | 改为本地 boards，启动钩子防复活 | 10 张表有数据，无 fuyao 残留 |
| `shares` 表空 | 全量同步末尾触发桥接限流 429 | 限流放宽 + provider 对 429 有界退避 | 重跑后补齐 |
| **行业页伪 "TDX" 大类** | 通达信行业以 `TDX/` 前缀混入申万字段，页面按 `/` 聚合出伪大类 | `ext_*` 只保留主分类，通达信留独立表 | 大类只剩申万一/二/三级 |
| 回归中发现的旧断言 | TDX 修复后 2 个测试仍断言 `TDX/` 混入，且 `builtin_rows()` 丢了标签去重 | 更新断言为 primary-only；恢复标签去重 | 139 项全通过 |
| **fuyao Key 可用但 PIT 不可信** | `report_date_ms` 历史期被回填且与三表冲突 | 宿主机旁路离线导入；候选公告日 + 质量标签；容器零外联不变 | 三表 5580 只零错误、官方分类独立表发布、PIT 仍关闭 |

---

## 5. 已知限制 / 未开放

- ETF 实时快照未接入
- 单标的秒级行情时刻未独立验证（仅取 HHMM 层，`server_time_raw` 部分秒位 >59）
- 完整财务三表 / 公告日 / 历史 PIT 财务因子未开放：**官方三表数值已离线导入**，但 `announce_date` 恒空、`pit_verified=false`，PIT 回测仍禁止
- 板块成分 PIT 未验证（含新增的同花顺官方分类，均无历史版本，回看早期存在归属漂移）
- 离线 fuyao 产物需手动重跑 `scripts/import_fuyao.py` 更新，没有自动定时任务
- 本轮前交接文档中的 P0/P1 清单尚未获批准、未执行

---

## 6. 数据质量风险

1. **板块 membership 无历史版本**：概念/行业成分仅当期快照，主线/复盘回看早年有漂移（前端 `MEMBERSHIP_NOTE` 已声明）。
2. **财务 `announce_date` 恒空**：不可用于 PIT 回测；`updated_date` 是财务文件更新日，非公告日。
3. **free_stockdb 在线依赖**：桥接 `boards`/行情查询依赖 `7899` 端口；该服务离线时相关查询返回空（已 fail-closed 处理）。
4. **TDX 大类污染已修复**：确认 `ext_hy_ths`/`ext_gn_ths` 不再含 `TDX/` 前缀，通达信分类仅在 `local_tdx_*` 表。
5. **fuyao `report_date_ms` 语义不可信**：44,787 个键中 22,149 个三表冲突、5,900 个疑似回填；
   只能作为候选公告日展示，禁止写入 `announce_date`（证据 `tasks/fuyao-probe.json`）。
6. **官方三表字段映射沿用上游 provider，未独立验证**：如 `financial_expense` 用利息费用近似，
   `field_mapping_verified=false`。

---

## 7. 常用验证命令

```bash
# 网页与桥接健康
curl -s -o /dev/null -w "网页 HTTP %{http_code}\n" http://127.0.0.1:3018/
curl -s -o /dev/null -w "桥接 HTTP %{http_code}\n" http://127.0.0.1:7818/health

# 启动 / 停止
docker compose -f compose.yaml up -d        # 网页容器
.venv/bin/python scripts/manage.py start     # 本地桥接

# 全量回归
.venv/bin/python -m pytest -q --basetemp="/tmp/tsp-pytest-$(date +%s%N)"
.venv/bin/python scripts/verify_sources.py

# 容器内端到端（network_blocks.fuyao.aicubes.cn 必须为 true）
docker exec -i -w /app tsp-local /app/.venv/bin/python - < scripts/verify_tsp.py

# fuyao 离线增强
.venv/bin/python scripts/import_fuyao.py --probe
.venv/bin/python scripts/import_fuyao.py --boards
.venv/bin/python scripts/import_fuyao.py --financial
curl -s -X POST http://127.0.0.1:3018/api/local-sources/fuyao/publish
```
