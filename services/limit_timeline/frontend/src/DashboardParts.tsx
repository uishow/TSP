/* 看板纯展示子组件 — 从 tdxTSP frontend/src/pages/Dashboard.tsx 逐字复制
 * （工具函数 + SectionTitle/KpiCell/IndexTicker/BreadthBar/DistributionBars/
 * EmotionRadar/LadderMini/MiniMetric）。唯一改动：IndexTicker 里的 <Link to>
 * 改为普通 div（扩展页无 react-router），其余渲染与配色完全不动。
 * MonitorWidget 依赖 tdxTSP 专有 hook，改由 NewDashboard.tsx 用简版实现。 */
import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, BarChart3, Flame, LineChart, Sparkles, Target, Activity } from 'lucide-react'
import { cn } from './cn'
import type { OverviewMarket } from './api'

function n(v: number | null | undefined) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function scoreColor(v: number) {
  if (v >= 70) return '#F04438'
  if (v >= 55) return '#FB923C'
  if (v >= 45) return '#F59E0B'
  if (v >= 30) return '#84CC16'
  return '#12B76A'
}

function fmtPrice(v: number | null | undefined, digits = 2) {
  const x = n(v)
  return x == null ? '—' : x.toFixed(digits)
}

function fmtIndexPct(v: number | null | undefined) {
  const x = n(v)
  if (x == null) return '—'
  return `${x >= 0 ? '+' : ''}${x.toFixed(2)}%`
}

function fmtStockPct(v: number | null | undefined) {
  const x = n(v)
  if (x == null) return '—'
  return `${x >= 0 ? '+' : ''}${(x * 100).toFixed(2)}%`
}

function pctClass(v: number | null | undefined) {
  const x = n(v)
  if (x == null || x === 0) return 'text-muted'
  return x > 0 ? 'text-bull' : 'text-bear'
}

function compactCount(v: number | null | undefined) {
  const x = n(v)
  if (x == null) return '—'
  if (x >= 1000) return `${(x / 1000).toFixed(1)}k`
  return x.toFixed(0)
}

export function fmtBigNum(v: number | null | undefined) {
  const x = n(v)
  if (x == null) return '—'
  if (x >= 1e12) return `${(x / 1e12).toFixed(2)}万亿`
  if (x >= 1e8) return `${(x / 1e8).toFixed(2)}亿`
  if (x >= 1e4) return `${(x / 1e4).toFixed(1)}万`
  return x.toFixed(0)
}

export function SectionTitle({ icon: Icon, title, hint }: { icon: typeof Activity; title: string; hint?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <span className="h-3 w-0.5 rounded-full bg-gradient-to-b from-accent to-accent/30" />
        <Icon className="h-3.5 w-3.5 text-accent" />
        <h2 className="text-xs font-semibold text-foreground">{title}</h2>
      </div>
      {hint && <span className="font-mono text-[10px] text-muted">{hint}</span>}
    </div>
  )
}

export function KpiCell({ label, value, sub, tone = 'neutral' }: { label: ReactNode; value: ReactNode; sub?: string; tone?: 'bull' | 'bear' | 'accent' | 'neutral' }) {
  const isPlain = typeof value === 'string' || typeof value === 'number'
  const color = tone === 'bull' ? 'text-bull' : tone === 'bear' ? 'text-bear' : tone === 'accent' ? 'text-accent' : 'text-foreground'
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface/80 px-2 py-1 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm transition-all hover:border-accent/30 hover:shadow-[0_2px_8px_hsl(var(--accent)/0.15)]">
      <div className="flex items-center gap-1 text-[11px] text-muted">{label}</div>
      <div className={`mt-1 truncate font-mono text-lg font-semibold leading-none tabular-nums ${isPlain ? color : 'text-foreground'}`}>{value}</div>
      {sub && <div className="mt-1 truncate text-[10px] text-muted">{sub}</div>}
    </div>
  )
}

export function IndexTicker({ item }: { item: OverviewMarket['indices'][number] }) {
  const pct = item.change_pct
  const isUp = (n(pct) ?? 0) >= 0
  return (
    <div className="grid min-w-0 grid-cols-[1fr_auto] items-center gap-x-2 gap-y-0.5 rounded-lg border border-border bg-elevated/45 px-1.5 py-1 shadow-[0_1px_1px_hsl(var(--border)/0.3)] backdrop-blur-sm transition-all hover:border-accent/40 hover:bg-elevated hover:shadow-[0_2px_6px_hsl(var(--accent)/0.15)]">
      <div className="truncate text-xs font-medium text-foreground">{item.name || item.symbol}</div>
      <div className={`font-mono text-xs font-semibold ${pctClass(pct)}`}>{fmtIndexPct(pct)}</div>
      <div className="font-mono text-[10px] text-muted">{item.symbol}</div>
      <div className={`flex items-center gap-1 font-mono text-[11px] ${pctClass(pct)}`}>
        {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {fmtPrice(item.last_price)}
      </div>
    </div>
  )
}

export function BreadthBar({ data }: { data: OverviewMarket['breadth'] }) {
  const denom = Math.max(data.total, 1)
  const upW = data.up / denom * 100
  const downW = data.down / denom * 100
  const flatW = Math.max(0, 100 - upW - downW)
  return (
    <div className="space-y-2">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-elevated">
        <div className="bg-bull/85" style={{ width: `${upW}%` }} />
        <div className="bg-muted/45" style={{ width: `${flatW}%` }} />
        <div className="bg-bear/85" style={{ width: `${downW}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-[11px]">
        <div className="rounded bg-bull/8 px-2 py-1 text-bull">涨 <span className="font-mono">{data.up}</span></div>
        <div className="rounded bg-elevated/70 px-2 py-1 text-muted">平 <span className="font-mono">{data.flat}</span></div>
        <div className="rounded bg-bear/8 px-2 py-1 text-bear">跌 <span className="font-mono">{data.down}</span></div>
      </div>
    </div>
  )
}

export function DistributionBars({ rows }: { rows: OverviewMarket['distribution'] }) {
  const maxCount = Math.max(...rows.map(r => r.count), 1)
  return (
    <div className="grid min-h-[5.5rem] flex-1 grid-cols-8 items-end gap-1 pt-1">
      {rows.map((r, i) => {
        const positive = i >= 4
        return (
          <div key={r.label} className="flex h-full min-w-0 flex-col items-center justify-end gap-0.5">
            <div className="font-mono text-[9px] text-muted">{r.count || ''}</div>
            <div
              className={`w-2 rounded-full ${positive ? 'bg-gradient-to-t from-bull/45 to-bull/90' : 'bg-gradient-to-t from-bear/45 to-bear/90'}`}
              style={{ height: `${Math.max(4, r.count / maxCount * 86)}%` }}
              title={`${r.label}: ${r.count}只`}
            />
            <div className="truncate text-[9px] text-muted">{r.label}</div>
          </div>
        )
      })}
    </div>
  )
}

export function EmotionRadar({ radar, score }: { radar: OverviewMarket['radar']; score: number }) {
  const size = 240
  const cx = size / 2
  const cy = size / 2
  const maxR = 78
  const color = scoreColor(score)
  if (!radar.length) return <div className="flex flex-1 items-center justify-center text-xs text-muted">暂无雷达数据</div>
  const points = radar.map((r, i) => {
    const angle = -Math.PI / 2 + i * 2 * Math.PI / radar.length
    const radius = maxR * Math.max(0, Math.min(100, r.value)) / 100
    return {
      ...r,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      lx: cx + Math.cos(angle) * (maxR + 27),
      ly: cy + Math.sin(angle) * (maxR + 27),
      gx: cx + Math.cos(angle) * maxR,
      gy: cy + Math.sin(angle) * maxR,
    }
  })
  const polygon = points.map(p => `${p.x},${p.y}`).join(' ')
  const gridPolygons = [1, 0.66, 0.33].map((level, idx) => ({
    level,
    idx,
    points: radar.map((_, i) => {
      const angle = -Math.PI / 2 + i * 2 * Math.PI / radar.length
      return `${cx + Math.cos(angle) * maxR * level},${cy + Math.sin(angle) * maxR * level}`
    }).join(' '),
  }))
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full max-h-[22rem] w-full">
        <defs>
          <radialGradient id="emotionRadarFill" cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor={`${color}57`} />
            <stop offset="100%" stopColor={`${color}1f`} />
          </radialGradient>
          <radialGradient id="emotionRadarCenter" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="hsl(var(--surface) / 0.92)" />
            <stop offset="68%" stopColor="hsl(var(--surface) / 0.70)" />
            <stop offset="100%" stopColor="hsl(var(--surface) / 0)" />
          </radialGradient>
        </defs>
        {gridPolygons.map(g => (
          <polygon
            key={g.level}
            points={g.points}
            fill={g.idx % 2 === 0 ? 'hsl(var(--elevated) / 0.55)' : 'hsl(var(--elevated) / 0.3)'}
            stroke={g.level === 1 ? 'hsl(var(--border) / 0.9)' : 'hsl(var(--border) / 0.5)'}
            strokeWidth={g.level === 1 ? 1.2 : 0.8}
          />
        ))}
        {points.map(p => <line key={p.key} x1={cx} y1={cy} x2={p.gx} y2={p.gy} stroke="hsl(var(--border) / 0.4)" />)}
        <polygon points={polygon} fill="url(#emotionRadarFill)" stroke={color} strokeWidth="2" />
        {points.map(p => <circle key={p.key} cx={p.x} cy={p.y} r="2.8" fill={color} stroke="hsl(var(--surface) / 0.9)" strokeWidth="1" />)}
        <circle cx={cx} cy={cy} r="29" fill="url(#emotionRadarCenter)" />
        <text x={cx} y={cy + 7} textAnchor="middle" className="fill-foreground font-mono text-[24px] font-bold">{score}</text>
        {points.map(p => (
          <text key={`${p.key}-label`} x={p.lx} y={p.ly + 4} textAnchor="middle" className="fill-secondary text-[10px] font-medium">{p.label}</text>
        ))}
      </svg>
    </div>
  )
}

export function LadderMini({ limit }: { limit: OverviewMarket['limit'] }) {
  const tiers = limit.tiers.filter(t => t.boards >= 2).slice(0, 6)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between rounded bg-elevated/55 px-2 py-1.5 text-[11px]">
        <span className="text-muted">封板率</span>
        <span className="font-mono text-accent">{(limit.seal_rate ?? 0).toFixed(0)}%</span>
      </div>
      {tiers.length === 0 && <div className="rounded border border-dashed border-border py-5 text-center text-xs text-muted">暂无 2 板以上</div>}
      {tiers.map(t => {
        const stocks = t.stocks ?? []
        const showStocks = stocks.length > 0 && stocks.length <= 3
        return (
          <div key={t.boards} className="rounded bg-elevated/35 px-2 py-1.5">
            <div className="grid grid-cols-[42px_1fr_auto] items-center gap-2">
              <span className={`font-mono text-sm font-bold ${t.boards >= 5 ? 'text-bull' : t.boards >= 3 ? 'text-accent' : 'text-secondary'}`}>{t.boards}板</span>
              <div className="h-1.5 overflow-hidden rounded-full bg-base">
                <div className="h-full rounded-full bg-bull/70" style={{ width: `${Math.min(100, t.count * 12)}%` }} />
              </div>
              <span className="font-mono text-xs text-foreground">{t.count}</span>
            </div>
            {showStocks && (
              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 pl-[50px]">
                {stocks.map(s => (
                  <span key={s.symbol} className="inline-flex items-center gap-0.5 text-[9px] text-secondary">
                    {s.name || s.symbol}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function MiniMetric({ label, value, cls = 'text-foreground' }: { label: string; value: string; cls?: string }) {
  return (
    <div className="flex flex-col justify-center rounded-md bg-elevated/45 px-2 py-1.5 border border-border/40">
      <div className="text-[10px] text-muted">{label}</div>
      <div className={`mt-0.5 font-mono text-xs font-semibold ${cls}`}>{value}</div>
    </div>
  )
}

export const PartIcons = { BarChart3, Flame, LineChart, Sparkles, Target, Activity }
