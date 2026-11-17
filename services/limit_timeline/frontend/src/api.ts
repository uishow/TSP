/* 时间轴组件原样依赖 `@/lib/api` 的 api.limitPoolTimeline 与类型。
 * 本适配层只做两件事：
 *   1) 时间轴 → 宿主 3023（东财涨跌停池，带 2.5s 服务端缓存）
 *   2) 看板其余块 → 3018 主站同源 /api/overview/market（字段与 tdxTSP 逐字段一致）
 * 不做任何数据加工、不编造数据；失败如实抛出，由组件空态处理。 */

export interface LimitPoolEvent {
  name: string
  code: string
  symbol: string
  reason: string
  price: number
  change_pct: number
  amount: number
  turnover_rate: number
  time: number
  type: 'zt' | 'zb' | 'dt'
  boards: number
  tier: string
  is_sec: boolean
  tag: string
  row: number
}

export interface LimitPoolTimeline {
  date: string
  trade_date: string
  is_today: boolean
  in_session: boolean
  server_time: string
  fetched_at: number
  stale: boolean
  source: string
  errors: string[]
  counts: { zt: number; zb: number; dt: number; total: number }
  rows: { zt: number; bt: number }
  events: LimitPoolEvent[]
  sectors: { name: string; zt: number; zb: number; dt: number; total: number }[]
  periods: { id: string; label: string; t0: number; t1: number; count: number }[]
  session: { t0: number; t1: number }
}

export interface OverviewMarket {
  as_of: string | null
  indices: { symbol: string; name: string; last_price: number; change_pct: number; change_amount: number }[]
  breadth: { total: number; up: number; down: number; flat: number; up_pct: number; down_pct: number; avg_pct: number; median_pct: number; strong_up: number; strong_down: number }
  amount: { total: number; avg: number }
  limit: { limit_up: number; limit_down: number; broken: number; failed: number; max_boards: number; seal_rate: number; tiers: { boards: number; count: number; stocks: { symbol: string; name: string }[] }[]; sealed_ready?: boolean; fake_up?: number; fake_down?: number }
  distribution: { label: string; count: number; pct: number }[]
  trend: { above_ma5: number; above_ma20: number; above_ma60: number; above_ma5_pct: number; above_ma20_pct: number; above_ma60_pct: number; new_high: number; new_low: number }
  activity: { avg_turnover: number; high_turnover: number; high_vol_ratio: number; vol_ratio: number }
  radar: { key: string; label: string; value: number }[]
  emotion: { score: number; label: string }
}

// 时间轴数据服务（宿主旁路，直连东财）
const TIMELINE_BASE = 'http://127.0.0.1:3023'

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const api = {
  limitPoolTimeline: (day?: string, refresh = false): Promise<LimitPoolTimeline> => {
    const qs = new URLSearchParams()
    if (day) qs.set('date', day)
    if (refresh) qs.set('refresh', '1')
    const s = qs.toString()
    return getJson<LimitPoolTimeline>(`${TIMELINE_BASE}/api/limit-pool/timeline${s ? `?${s}` : ''}`)
  },
  overviewMarket: (): Promise<OverviewMarket> =>
    getJson<OverviewMarket>('/api/overview/market?market=cn'),
}
