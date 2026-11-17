/* 新看板 —— tdxTSP「市场看板」的忠实复刻 + 涨跌停时间轴插在中间。
 *
 * 布局（自上而下）：
 *   标题栏 → 指数条 → KPI 六宫格 → ★涨跌停时间轴★ → 主区（涨跌分布/情绪雷达/趋势强度）
 *   → 涨停梯队/监控中心
 * 与 tdxTSP 原看板唯一差异：时间轴从「最底部」移到「KPI 六宫格下方、主区上方」（用户要求）。
 * 展示子组件从 Dashboard.tsx 逐字复制；数据全部来自真实接口，无任何模拟数据。 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BellRing, Gauge, Timer, RefreshCw, LineChart } from 'lucide-react'
import { api, type OverviewMarket } from './api'
import { LimitPoolTimeline } from './LimitPoolTimeline'
import {
  IndexTicker, KpiCell, BreadthBar, DistributionBars, EmotionRadar,
  LadderMini, MiniMetric, SectionTitle, fmtBigNum, PartIcons,
} from './DashboardParts'

const { BarChart3, Sparkles, Flame, Target, Activity } = PartIcons

interface AlertEvent {
  symbol?: string
  name?: string
  source: string
  severity?: string
  message?: string
  price?: number
  change_pct?: number
  ts?: number
  signals?: string[]
}

function MonitorWidget() {
  const alerts = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api_alerts(),
    refetchInterval: 10_000,
  })
  const events: AlertEvent[] = alerts.data ?? []
  if (events.length === 0) return <div className="mt-1 py-6 text-center text-[11px] text-muted">暂无触发记录</div>
  return (
    <div className="mt-1 max-h-[15rem] space-y-1.5 overflow-y-auto pr-0.5">
      {events.map((ev, i) => {
        const pct = ev.change_pct ?? 0
        return (
          <div key={`${ev.ts}-${i}`} className="relative overflow-hidden rounded-md border border-border/40 bg-surface/60 pl-2.5 pr-2 py-1.5">
            <div className={`absolute left-0 top-0 h-full w-0.5 ${ev.severity === 'critical' ? 'bg-danger' : ev.severity === 'warn' ? 'bg-warning' : 'bg-accent/40'}`} />
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-medium text-foreground/80">{ev.symbol?.replace(/\.(SH|SZ|BJ)$/, '')}</span>
              {ev.name && <span className="text-[10px] text-secondary truncate max-w-[6rem]">{ev.name}</span>}
              <span className="flex-1" />
              {ev.price != null && <span className="text-[10px] font-mono text-foreground/60">{ev.price.toFixed(2)}</span>}
              {ev.change_pct != null && (
                <span className={`text-[10px] font-mono font-medium w-12 text-right ${pct >= 0 ? 'text-bull' : 'text-bear'}`}>
                  {pct >= 0 ? '+' : ''}{(pct * 100).toFixed(2)}%
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="shrink-0 rounded bg-accent/10 px-1 py-px text-[8px] font-medium text-accent">{ev.source}</span>
              {ev.message && <span className="text-[9px] text-muted truncate flex-1">{ev.message}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

async function api_alerts(): Promise<AlertEvent[]> {
  const res = await fetch('/api/alerts?days=7&limit=10', { headers: { Accept: 'application/json' } })
  if (!res.ok) return []
  const j = await res.json()
  return j.alerts ?? []
}

export function NewDashboard() {
  const [refreshing, setRefreshing] = useState(false)
  const overview = useQuery({
    queryKey: ['overview-market'],
    queryFn: () => api.overviewMarket(),
    staleTime: 5_000,
    placeholderData: (prev) => prev,
    refetchInterval: 60_000,
  })
  const data = overview.data
  const score = data?.emotion?.score ?? 0

  const handleRefresh = async () => {
    setRefreshing(true)
    try { await overview.refetch() } finally { setRefreshing(false) }
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        {overview.isError ? '看板数据加载失败，请点「重载」重试' : '正在加载看板数据…'}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-2 as-root-body">
      {/* 标题栏 */}
      <div className="relative mb-1.5 flex flex-wrap items-center justify-between gap-2 overflow-hidden rounded-card border border-border bg-gradient-to-r from-surface/90 to-surface/70 px-3 py-1.5 shadow-[0_1px_3px_hsl(var(--border)/0.4)] backdrop-blur-sm">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-accent to-accent/20" aria-hidden />
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-accent" />
          <h1 className="text-base font-semibold text-foreground">新看板</h1>
          <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium" style={{ color: scoreColor(score), borderColor: `${scoreColor(score)}40`, background: `${scoreColor(score)}14` }}>
            {data.emotion.label} · {score}
          </span>
          <span className="hidden items-center gap-1 whitespace-nowrap text-[10px] text-muted lg:inline-flex"><Timer className="h-3 w-3" />涨跌停时间轴 · 东财三池</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted">
          <span className="font-mono text-secondary">{data.as_of ?? '—'}</span>
          <button onClick={handleRefresh} disabled={refreshing || overview.isFetching}
            className="inline-flex items-center gap-1 rounded-btn border border-border bg-elevated px-2 py-1 text-[11px] text-secondary transition-colors hover:text-foreground disabled:opacity-50">
            <RefreshCw className={`h-3 w-3 ${(refreshing || overview.isFetching) ? 'animate-spin' : ''}`} />重载
          </button>
        </div>
      </div>

      {/* 指数条 */}
      <div className="mb-1.5 grid grid-cols-4 gap-1">
        {data.indices.map(item => <IndexTicker key={item.symbol} item={item} />)}
      </div>

      {/* KPI 六宫格 */}
      <div className="mb-1.5 grid grid-cols-6 gap-1">
        <KpiCell label="个股涨 / 平 / 跌" value={<><span className="text-bull">{data.breadth.up}</span><span className="text-muted">/</span><span className="text-muted">{data.breadth.flat}</span><span className="text-muted">/</span><span className="text-bear">{data.breadth.down}</span></>} sub={`上涨率 ${data.breadth.up_pct.toFixed(1)}%`} />
        <KpiCell label="强势 / 弱势" value={<><span className="text-bull">{data.breadth.strong_up}</span><span className="text-muted">/</span><span className="text-bear">{data.breadth.strong_down}</span></>} sub="涨跌 ≥3%" />
        <KpiCell label="涨停 / 跌停" value={<><span className="text-bull">{data.limit.limit_up}</span><span className="text-muted">/</span><span className="text-bear">{data.limit.limit_down}</span></>} sub={`封板率 ${(data.limit.seal_rate ?? 0).toFixed(0)}%`} />
        <KpiCell label="最高连板" value={`${data.limit.max_boards || 0}板`} sub={`梯队 ${data.limit.tiers.length}`} tone="accent" />
        <KpiCell label="成交额" value={fmtBigNum(data.amount.total)} sub={`均额 ${fmtBigNum(data.amount.avg)}`} />
        <KpiCell label="换手 / 量比" value={`${data.activity.avg_turnover.toFixed(1)}% / ${data.activity.vol_ratio.toFixed(2)}`} sub={`高换手 ${data.activity.high_turnover} · 放量占比 ${data.activity.high_vol_ratio.toFixed(1)}%`} tone="accent" />
      </div>

      {/* ★ 涨跌停时间轴 —— 插在 KPI 六宫格下方、主区上方（用户要求的"中间"） */}
      <div className="mb-1.5 min-h-0 max-h-[34rem]">
        <LimitPoolTimeline />
      </div>

      {/* 主区：涨跌分布 / 情绪雷达 / 趋势强度 + 涨停梯队 / 监控中心 */}
      <div className="shrink-0 grid grid-cols-1 gap-1.5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="min-w-0">
          <div className="grid h-full grid-cols-1 gap-1.5 lg:grid-cols-3">
            <section className="flex flex-col rounded-card border border-border bg-surface/80 p-1.5 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm">
              <SectionTitle icon={BarChart3} title="涨跌分布 / 广度" hint={`${data.breadth.total}只`} />
              <DistributionBars rows={data.distribution} />
              <div className="mt-auto"><BreadthBar data={data.breadth} /></div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <MiniMetric label="平均涨跌" value={fmtStockPct(data.breadth.avg_pct)} cls={pctClass(data.breadth.avg_pct)} />
                <MiniMetric label="中位涨跌" value={fmtStockPct(data.breadth.median_pct)} cls={pctClass(data.breadth.median_pct)} />
              </div>
            </section>
            <section className="flex flex-col rounded-card border bg-surface/80 p-1.5 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm" style={{ borderColor: `${scoreColor(score)}40` }}>
              <SectionTitle icon={Sparkles} title="情绪雷达" hint={`情绪评分 ${score}`} />
              <EmotionRadar radar={data.radar} score={score} />
            </section>
            <section className="flex flex-col gap-2 rounded-card border border-border bg-surface/80 p-1.5 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm">
              <div className="flex min-h-0 flex-1 flex-col">
                <SectionTitle icon={LineChart} title="趋势强度" hint="均线/新高低" />
                <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-3 gap-1.5">
                  <MiniMetric label="站上MA5" value={`${data.trend.above_ma5_pct.toFixed(0)}%`} cls="text-accent" />
                  <MiniMetric label="站上MA20" value={`${data.trend.above_ma20_pct.toFixed(0)}%`} cls="text-accent" />
                  <MiniMetric label="站上MA60" value={`${data.trend.above_ma60_pct.toFixed(0)}%`} cls="text-accent" />
                  <MiniMetric label="60日新高" value={compactCount(data.trend.new_high)} cls="text-bull" />
                  <MiniMetric label="60日新低" value={compactCount(data.trend.new_low)} cls="text-bear" />
                  <MiniMetric label="高低比" value={`${data.trend.new_high + data.trend.new_low > 0 ? Math.round(data.trend.new_high / (data.trend.new_high + data.trend.new_low) * 100) : 50}%`} cls={data.trend.new_high >= data.trend.new_low ? 'text-bull' : 'text-bear'} />
                </div>
              </div>
              <div className="flex min-h-0 flex-1 flex-col border-t border-border pt-1.5">
                <SectionTitle icon={Target} title="实用监控" hint="盘中观察" />
                <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-3 gap-1.5">
                  <MiniMetric label="炸板" value={`${data.limit.broken ?? 0}`} cls="text-warning" />
                  <MiniMetric label="跌停" value={`${data.limit.limit_down ?? 0}`} cls="text-bear" />
                  <MiniMetric label="站上MA60" value={`${data.trend.above_ma60_pct.toFixed(0)}%`} cls="text-accent" />
                  <MiniMetric label="新高/新低" value={`${compactCount(data.trend.new_high)}/${compactCount(data.trend.new_low)}`} cls={data.trend.new_high >= data.trend.new_low ? 'text-bull' : 'text-bear'} />
                  <MiniMetric label="高换手数" value={`${data.activity.high_turnover}`} cls="text-accent" />
                  <MiniMetric label="放量占比" value={`${data.activity.high_vol_ratio.toFixed(1)}%`} cls="text-accent" />
                </div>
              </div>
            </section>
          </div>
        </main>
        <aside className="min-w-0 space-y-1.5">
          <section className="rounded-card border border-border bg-surface/80 p-1.5 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm">
            <SectionTitle icon={Flame} title="涨停梯队" hint={`涨停 ${data.limit.limit_up}`} />
            <LadderMini limit={data.limit} />
          </section>
          <section className="rounded-card border border-border bg-surface/80 p-1.5 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <BellRing className="h-3.5 w-3.5 text-accent" />
                <h2 className="text-xs font-semibold text-foreground">监控中心</h2>
                <span className="font-mono text-[10px] text-muted">实时信号</span>
              </div>
            </div>
            <MonitorWidget />
          </section>
        </aside>
      </div>
    </div>
  )
}

function scoreColor(v: number) {
  if (v >= 70) return '#F04438'
  if (v >= 55) return '#FB923C'
  if (v >= 45) return '#F59E0B'
  if (v >= 30) return '#84CC16'
  return '#12B76A'
}
function fmtStockPct(v: number | null | undefined) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—'
  return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(2)}%`
}
function pctClass(v: number | null | undefined) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v === 0) return 'text-muted'
  return v > 0 ? 'text-bull' : 'text-bear'
}
function compactCount(v: number | null | undefined) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—'
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)
}
