/**
 * 涨跌停板池时间轴 (看板)。
 *
 * 业务口径沿用原型《梯队时间轴》: 只渲染**有事件的时间点**, 时间列倒序(最左最新);
 * 涨停按连板高度分行堆叠, 炸板 / 跌停共用同一条时间轴的下方分区; 题材内按高度与
 * 封板时间打标(秒顶一 / 顶板 / 龙头 / 卡位 / 加强 / 后排)。
 *
 * 数据源: ``/api/limit-pool/timeline`` (后端代理东财涨停/炸板/跌停池)。
 * 展示端 3s 轮询一次; 服务端另有 2.5s 短缓存, 多个标签页不会把上游打爆。
 *
 * 配色遵循 A 股惯例: 涨停=红, 跌停=绿; 标签色沿用原型的固定色板。
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Flame, Loader2, Pause, Play, RotateCcw, Timer, X } from 'lucide-react'
import { api, type LimitPoolEvent } from '@/lib/api'
import { cn } from '@/lib/cn'

const POLL_MS = 3000

/** 标签固定色 (原型 CSS 的 l-* 色板) */
const TAG_STYLE: Record<string, { bg: string; fg: string }> = {
  秒顶一: { bg: '#ffeb3b', fg: '#000' },
  龙头: { bg: '#f44336', fg: '#fff' },
  加强: { bg: '#ff5722', fg: '#fff' },
  弹性: { bg: '#ff9800', fg: '#000' },
  后排: { bg: '#9e9e9e', fg: '#fff' },
  顶板: { bg: '#e040fb', fg: '#fff' },
  卡位: { bg: '#4fc3f7', fg: '#000' },
  炸: { bg: '#4682b4', fg: '#fff' },
  跌停: { bg: '#4caf50', fg: '#fff' },
}

const TYPE_STYLE: Record<LimitPoolEvent['type'], string> = {
  zt: 'border-bull/30 bg-bull/10',
  zb: 'border-warning/35 bg-warning/10',
  dt: 'border-bear/30 bg-bear/10',
}

const TYPE_LABEL: Record<LimitPoolEvent['type'], string> = {
  zt: '涨停',
  zb: '炸板',
  dt: '跌停',
}

/** chip 的稳定 key: 同一标的同一类型在时间轴上只出现一次 */
const chipKey = (e: LimitPoolEvent) => `${e.symbol}-${e.type}`

function fmtTime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function fmtAmount(v?: number | null) {
  if (!v || !Number.isFinite(v)) return '—'
  if (v >= 1e8) return `${(v / 1e8).toFixed(2)}亿`
  if (v >= 1e4) return `${(v / 1e4).toFixed(0)}万`
  return v.toFixed(0)
}

interface TipState {
  /** 被悬浮标的的稳定标识: 同一标的只出现一次, 用它反查最新事件, 轮询刷新后提示框不会变旧 */
  key: string
  /** 悬浮瞬间锚点(股票名 chip)的视口矩形; 提示框据此定位, 不跟鼠标走 */
  anchor: DOMRect
}

export function LimitPoolTimeline({
  day,
  onStockClick,
}: {
  /** 指定日期(YYYY-MM-DD); 不传 = 今天 */
  day?: string
  onStockClick?: (symbol: string, name: string) => void
}) {
  const [paused, setPaused] = useState(false)
  const [activePeriod, setActivePeriod] = useState('all')
  const [activeSector, setActiveSector] = useState<string | null>(null)
  const [tip, setTip] = useState<TipState | null>(null)
  // ===== 回放: 按事件时间点逐个揭示, 收盘后可复盘当日涨停/炸板/跌停 =====
  // revealCount = 已揭示的时间点数量; null = 未回放(显示全天)
  const [revealCount, setRevealCount] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(2)
  const replaying = revealCount != null
  const tableWrapRef = useRef<HTMLDivElement>(null)

  const { data, isError, refetch, isFetching } = useQuery({
    queryKey: ['limit-pool-timeline', day ?? 'today'],
    queryFn: () => api.limitPoolTimeline(day),
    // 非盘中(收盘后 / 历史日期)页面停留久了没必要 3s 打一次, 交给服务端 30s 缓存兜底。
    // 回放期间必须停轮询: 数据一变时间点数量就变, 进度/画面会跳。
    refetchInterval: paused || playing || replaying ? false : POLL_MS,
    staleTime: 0,
    placeholderData: (prev) => prev,
    retry: 1,
  })

  // 回放只在**收盘后**提供: 盘中时间轴本身就在实时生长, 回放没有意义还会打断盯盘。
  // 后端 in_session = 「今天 + 交易日 + 处于交易时段」, 历史日期 / 非交易日 / 盘后均为 false。
  const showReplay = data ? !data.in_session : false

  const events = data?.events ?? []
  /** 悬浮提示的内容始终从最新一批事件里反查, 3s 轮询更新价格后提示框不会停在旧值 */
  const tipEvent = useMemo(
    () => (tip ? events.find((e) => chipKey(e) === tip.key) ?? null : null),
    [tip, events],
  )
  /** 全天事件时间点(正序), 回放以此为单位推进 —— 同一分钟一起封板的股票会同时出现 */
  const allTimesAsc = useMemo(() => {
    const set = new Set<number>()
    for (const e of events) set.add(e.time)
    return Array.from(set).sort((a, b) => a - b)
  }, [events])
  /** 已揭示的事件(按时间点截断); 未回放 = 全部 */
  const visibleEvents = useMemo(() => {
    if (revealCount == null) return events
    if (revealCount <= 0) return []
    const limit = allTimesAsc[Math.min(revealCount, allTimesAsc.length) - 1]
    return events.filter((e) => e.time <= limit)
  }, [events, revealCount, allTimesAsc])

  const uniqueTimes = useMemo(() => {
    const set = new Set<number>()
    for (const e of visibleEvents) set.add(e.time)
    const arr = Array.from(set)
    // 回放用正序(左=早, 右=晚)便于顺着看；日常查看沿用倒序(最左最新)
    return replaying ? arr.sort((a, b) => a - b) : arr.sort((a, b) => b - a)
  }, [visibleEvents, replaying])

  // 推进播放头: 每个时间点停留 900/speed ms
  useEffect(() => {
    if (!playing) return
    if (allTimesAsc.length === 0) return
    const tick = Math.max(120, Math.round(900 / speed))
    const timer = window.setInterval(() => {
      setRevealCount((cur) => Math.min((cur ?? 0) + 1, allTimesAsc.length))
    }, tick)
    return () => window.clearInterval(timer)
  }, [playing, speed, allTimesAsc.length])

  // 播到末尾自动停
  useEffect(() => {
    if (playing && revealCount != null && revealCount >= allTimesAsc.length) setPlaying(false)
  }, [playing, revealCount, allTimesAsc.length])

  // 回放时把视图滚到最新列(正序 = 右端)
  useEffect(() => {
    if (!playing) return
    const el = tableWrapRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [playing, revealCount])

  // 进入交易时段(或数据刷新为盘中口径)时强制退出回放, 避免回放残留在盘中视图上
  useEffect(() => {
    if (data?.in_session && revealCount != null) {
      setPlaying(false)
      setRevealCount(null)
    }
  }, [data?.in_session, revealCount])

  const toggleReplay = () => {
    if (allTimesAsc.length === 0) return
    if (playing) { setPlaying(false); return }
    // 未开始 / 已播完 → 从头播
    if (revealCount == null || revealCount >= allTimesAsc.length) setRevealCount(0)
    setPlaying(true)
  }
  const exitReplay = () => {
    setPlaying(false)
    setRevealCount(null)
  }
  const seek = (v: number) => {
    setPlaying(false)
    setRevealCount(v >= allTimesAsc.length ? allTimesAsc.length : v)
  }

  const rowsZt = Math.max(1, data?.rows?.zt ?? 1)
  const rowsBt = Math.max(1, data?.rows?.bt ?? 1)

  const cellMap = useMemo(() => {
    const zt = new Map<string, LimitPoolEvent[]>()
    const bt = new Map<string, LimitPoolEvent[]>()
    for (const e of visibleEvents) {
      const bucket = e.type === 'zt' ? zt : bt
      const key = `${e.time}:${e.row}`
      const list = bucket.get(key)
      if (list) list.push(e)
      else bucket.set(key, [e])
    }
    return { zt, bt }
  }, [visibleEvents])

  const period = useMemo(
    () => data?.periods.find((p) => p.id === activePeriod) ?? null,
    [data?.periods, activePeriod],
  )

  const isDim = (e: LimitPoolEvent) => {
    if (period && !(e.time >= period.t0 && e.time < period.t1)) return true
    if (activeSector && e.reason !== activeSector) return true
    return false
  }

  const periods = (data?.periods ?? []).filter((p) => p.count > 0)
  const sectors = data?.sectors ?? []
  const count = data?.counts

  const toggleSector = (name: string) => {
    setActiveSector((cur) => (cur === name ? null : name))
  }

  // 回放中显示"已揭示"的实时计数, 有逐笔累积的临场感
  const liveCounts = useMemo(() => {
    if (!replaying) return null
    let zt = 0, zb = 0, dt = 0
    for (const e of visibleEvents) {
      if (e.type === 'zt') zt++
      else if (e.type === 'zb') zb++
      else dt++
    }
    return { zt, zb, dt }
  }, [replaying, visibleEvents])

  // 播放头对应的时间 / 总时长
  const totalPoints = allTimesAsc.length
  const headIdx = revealCount == null ? totalPoints : Math.min(revealCount, totalPoints)
  const clockLabel = totalPoints === 0
    ? '--:--'
    : headIdx <= 0
      ? fmtTime(allTimesAsc[0])
      : fmtTime(allTimesAsc[headIdx - 1])

  const shownCounts = liveCounts ?? count
  // 回放态的计数是「截至播放头时刻的累计」，不是全天总数。
  // 必须在标题里写明时点，否则会被误当成全天数字去和 KPI 对比（11-17 17:4x 用户疑问）。
  const headerHint = shownCounts
    ? (replaying
        ? `回放至 ${clockLabel} · 涨停 ${shownCounts.zt} · 炸板 ${shownCounts.zb} · 跌停 ${shownCounts.dt}（当时累计）`
        : `全天 涨停 ${shownCounts.zt} · 炸板 ${shownCounts.zb} · 跌停 ${shownCounts.dt}`)
    : undefined

  // 17:8x 去掉 h-full：时间轴按内容自然高度显示，滚动条交给外层板块，表格内部不再有纵向滚动条
  return (
    <section className="flex flex-col rounded-card border border-border bg-surface/80 p-1.5 shadow-[0_1px_2px_hsl(var(--border)/0.4)] backdrop-blur-sm">
      {/* 标题行 */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 rounded-full bg-gradient-to-b from-accent to-accent/30" />
          <Timer className="h-3.5 w-3.5 text-accent" />
          <h2 className="text-xs font-semibold text-foreground">涨跌停时间轴</h2>
          <span className="font-mono text-[10px] text-muted">{headerHint}</span>
          {data?.stale && (
            <span className="inline-flex items-center gap-0.5 rounded bg-warning/10 px-1 py-px text-[9px] text-warning">
              <AlertTriangle className="h-2.5 w-2.5" />上游超时
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted">
          <span className="font-mono">{data?.date || '—'}</span>
          <span className={cn('tabular-nums', paused || replaying ? 'text-warning' : 'text-accent')}>
            {replaying
              ? (playing ? '回放中' : '回放已暂停')
              : paused ? '已暂停' : `${data?.server_time ?? '--:--:--'} · 3s`}
          </span>
          <button
            onClick={() => setPaused((v) => !v)}
            className="inline-flex h-4 w-4 items-center justify-center rounded text-muted transition-colors hover:bg-elevated hover:text-foreground"
            title={paused ? '恢复自动刷新' : '暂停自动刷新'}
          >
            {paused ? <Play className="h-2.5 w-2.5" /> : <Pause className="h-2.5 w-2.5" />}
          </button>
          <button
            onClick={() => refetch()}
            className="inline-flex h-4 w-4 items-center justify-center rounded text-muted transition-colors hover:bg-elevated hover:text-foreground"
            title="立即刷新"
          >
            <Loader2 className={cn('h-2.5 w-2.5', isFetching && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* 回放控制条: 仅收盘后显示 (盘中时间轴实时生长, 回放会打断盯盘) */}
      {showReplay && (
      <div className="mb-1 flex items-center gap-1.5 rounded border border-border/60 bg-elevated/30 px-1.5 py-1">
        <button
          onClick={toggleReplay}
          disabled={totalPoints === 0}
          className="inline-flex shrink-0 items-center gap-1 rounded-btn border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent transition-colors hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-40"
          title={playing ? '暂停回放' : revealCount == null ? '回放当日涨跌停 / 炸板' : revealCount >= totalPoints ? '从头重播' : '继续回放'}
        >
          {playing ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
          {playing ? '暂停' : revealCount == null ? '回放' : revealCount >= totalPoints ? '重播' : '继续'}
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(totalPoints, 1)}
          step={1}
          value={headIdx}
          onChange={(e) => seek(Number(e.target.value))}
          disabled={totalPoints === 0}
          title="拖动可跳到任意时刻"
          className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-border/70 disabled:cursor-not-allowed"
          style={{ accentColor: 'hsl(var(--accent))' }}
        />
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-accent">{clockLabel}</span>
        <span className="shrink-0 font-mono text-[9px] tabular-nums text-muted">{headIdx}/{totalPoints}</span>
        <button
          onClick={() => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
          className="shrink-0 rounded border border-border px-1 text-[9px] tabular-nums text-muted transition-colors hover:text-foreground"
          title="回放速度 (每个时间点停留时长)"
        >
          {speed}x
        </button>
        {replaying && (
          <button
            onClick={exitReplay}
            className="inline-flex shrink-0 items-center gap-0.5 rounded border border-border px-1 text-[9px] text-muted transition-colors hover:text-foreground"
            title="退出回放, 恢复全天视图"
          >
            <RotateCcw className="h-2.5 w-2.5" />全天
          </button>
        )}
      </div>
      )}

      {/* 时间段筛选: 只显示有事件的时段, 倒序(最新在左) */}
      {periods.length > 0 && (
        <div className="mb-1 flex flex-wrap items-center gap-1">
          <span className="mr-0.5 text-[9px] text-muted">时段</span>
          {[...periods].reverse().map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePeriod((cur) => (cur === p.id ? 'all' : p.id))}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[10px] transition-colors',
                activePeriod === p.id
                  ? 'border-accent/45 bg-accent/15 text-accent'
                  : 'border-border bg-elevated/40 text-muted hover:text-foreground',
              )}
            >
              <span className="font-mono">{p.label}</span>
              <span className="text-[9px] text-bull">{p.count}</span>
            </button>
          ))}
          <button
            onClick={() => setActivePeriod('all')}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[10px] transition-colors',
              activePeriod === 'all'
                ? 'border-accent/45 bg-accent/15 text-accent'
                : 'border-border bg-elevated/40 text-muted hover:text-foreground',
            )}
          >
            全部
            <span className="text-[9px] text-bull">{count?.total ?? 0}</span>
          </button>
        </div>
      )}

      {/* 题材筛选 */}
      {sectors.length > 0 && (
        <div className="mb-1 flex flex-wrap items-center gap-1">
          <span className="mr-0.5 text-[9px] text-muted">题材</span>
          {activeSector && (
            <button
              onClick={() => setActiveSector(null)}
              className="inline-flex items-center gap-0.5 rounded-full border border-danger/35 bg-danger/10 px-1.5 py-px text-[10px] text-danger"
            >
              <X className="h-2.5 w-2.5" />清除
            </button>
          )}
          {sectors.map((s, i) => (
            <button
              key={s.name}
              onClick={() => toggleSector(s.name)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[10px] transition-colors',
                activeSector === s.name
                  ? 'border-danger/45 bg-danger/15 text-danger'
                  : 'border-border bg-elevated/40 hover:text-foreground',
                activeSector === s.name
                  ? ''
                  : i < 3 ? 'text-danger/85' : 'text-muted',
              )}
              title={`涨停 ${s.zt} · 炸板 ${s.zb} · 跌停 ${s.dt}`}
            >
              {i < 3 && activeSector !== s.name && <Flame className="h-2.5 w-2.5" />}
              {s.name}
              <span className="text-[9px] text-bull">{s.total}</span>
            </button>
          ))}
        </div>
      )}

      {/* 表格主体 */}
      <div
        ref={tableWrapRef}
        onScroll={() => setTip(null)}
        className="relative min-h-[9rem] overflow-x-auto overflow-y-visible rounded border border-border/60 bg-base/30"
      >
        {visibleEvents.length === 0 ? (
          <div className="flex h-24 flex-col items-center justify-center gap-1 text-[11px] text-muted">
            {replaying ? (
              <span>回放已就绪 · 点「播放」或拖动进度条</span>
            ) : isError ? (
              <>
                <span className="text-danger">时间轴数据加载失败</span>
                <span className="text-[10px]">东财板池接口不可达, 稍后自动重试</span>
              </>
            ) : (
              <>
                <span>{data ? '当前日期无涨跌停数据' : '加载中…'}</span>
                {data?.errors && data.errors.length > 0 && (
                  <span className="text-[10px]">上游返回异常: {data.errors.join('/')}</span>
                )}
              </>
            )}
          </div>
        ) : (
          <table className="w-full min-w-max border-collapse text-[10px]">
            <tbody>
              {Array.from({ length: rowsZt }, (_, r) => (
                <tr key={`zt-${r}`}>
                  <th
                    className="sticky left-0 z-10 w-12 border-r border-border/60 bg-surface px-1 text-[9px] font-medium text-bull"
                    scope="row"
                  >
                    {r === 0 ? '涨停' : ''}
                  </th>
                  {uniqueTimes.map((t) => (
                    <td
                      key={`zt-${r}-${t}`}
                      className="min-w-[74px] border-r border-border/40 align-top p-0.5"
                    >
                      <div className="flex flex-col gap-0.5">
                        {(cellMap.zt.get(`${t}:${r}`) ?? []).map((e) => (
                          <Chip
                            key={chipKey(e)}
                            ev={e}
                            dim={isDim(e)}
                            onHover={(anchor) => setTip({ key: chipKey(e), anchor })}
                            onLeave={() => setTip(null)}
                            onClick={() => toggleSector(e.reason)}
                            onNameClick={() => e.symbol && onStockClick?.(e.symbol, e.name)}
                          />
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}

              {/* 时间轴 */}
              <tr>
                <th
                  className="sticky left-0 z-10 w-12 border-y border-accent/40 bg-surface px-1 text-[9px] font-medium text-accent"
                  scope="row"
                >
                  时间
                </th>
                {uniqueTimes.map((t) => (
                  <td
                    key={`t-${t}`}
                    className="border-y border-accent/40 border-r border-r-border/40 bg-elevated/50 px-0.5 py-0.5 text-center font-mono text-[10px] text-secondary"
                  >
                    {fmtTime(t)}
                  </td>
                ))}
              </tr>

              {Array.from({ length: rowsBt }, (_, r) => (
                <tr key={`bt-${r}`}>
                  <th
                    className="sticky left-0 z-10 w-12 border-r border-border/60 bg-surface px-1 text-[9px] font-medium text-warning"
                    scope="row"
                  >
                    {r === 0 ? '炸/跌' : ''}
                  </th>
                  {uniqueTimes.map((t) => (
                    <td
                      key={`bt-${r}-${t}`}
                      className="min-w-[74px] border-r border-border/40 align-top p-0.5"
                    >
                      <div className="flex flex-col gap-0.5">
                        {(cellMap.bt.get(`${t}:${r}`) ?? []).map((e) => (
                          <Chip
                            key={chipKey(e)}
                            ev={e}
                            dim={isDim(e)}
                            onHover={(anchor) => setTip({ key: chipKey(e), anchor })}
                            onLeave={() => setTip(null)}
                            onClick={() => toggleSector(e.reason)}
                            onNameClick={() => e.symbol && onStockClick?.(e.symbol, e.name)}
                          />
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between gap-2 text-[9px] text-muted">
        <span>{replaying ? `回放中 · 左=早 右=晚 · ${clockLabel}` : '左=最新 · 无事件的时段不占列'}</span>
        <span className="font-mono">
          {data ? `${uniqueTimes.length} 个时间点 / ${visibleEvents.length} 条` : ''}
        </span>
      </div>

      {tip && tipEvent && <HoverTip ev={tipEvent} anchor={tip.anchor} />}
    </section>
  )
}

function Chip({
  ev, dim, onHover, onLeave, onClick, onNameClick,
}: {
  ev: LimitPoolEvent
  dim: boolean
  /** 只在进入时上报一次锚点矩形 —— 不再跟随 mousemove, 否则每帧都要重渲染整张表 */
  onHover: (anchor: DOMRect) => void
  onLeave: () => void
  onClick: () => void
  onNameClick: () => void
}) {
  const tagStyle = ev.tag ? TAG_STYLE[ev.tag] : undefined
  return (
    <span
      className={cn(
        'inline-flex w-fit max-w-full items-center gap-0.5 overflow-hidden rounded border px-0.5 py-px transition-opacity',
        TYPE_STYLE[ev.type],
        dim && 'pointer-events-none opacity-[0.12]',
      )}
      onMouseEnter={(e) => onHover(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={onLeave}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onNameClick()
        }}
        // 不再挂 title: 全名由 HoverTip 展示。留着 title 会让浏览器在约 1s 后弹出原生 tooltip,
        // 压在自绘提示框上 (原生 tooltip 是独立弹窗, 页面重绘时它会跟着闪)。
        className="max-w-[4.5rem] truncate text-[10px] font-medium text-foreground/90 hover:text-accent"
      >
        {ev.name}
      </button>
      {ev.tag && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
          className="shrink-0 rounded px-0.5 text-[8px] font-bold leading-[1.3]"
          style={tagStyle ? { background: tagStyle.bg, color: tagStyle.fg } : undefined}
          title={`按题材「${ev.reason}」筛选`}
        >
          {ev.tag}
        </button>
      )}
    </span>
  )
}

/**
 * 悬浮明细提示框。
 *
 * 两个必须点, 否则看板会「快速闪烁」:
 *  1. **portal 到 body**: 时间轴外层 section 带 `backdrop-blur-sm`(backdrop-filter), 会让
 *     `position: fixed` 的后代改为相对该 section 定位; 视口坐标被当成区块内坐标, 提示框
 *     被推到内容区外 → 撑出 `overflow-auto` 的滚动条 → 布局位移 → chip 脱离鼠标 →
 *     onMouseLeave 卸载提示框 → 滚动条消失 → 又 hover 上 → 每帧往复 = 整页闪烁。
 *  2. **按锚点矩形定位, 不用鼠标坐标**: 提示框一旦压住 chip, 同样会触发上面那个循环。
 */
function HoverTip({ ev, anchor }: { ev: LimitPoolEvent; anchor: DOMRect }) {
  const ref = useRef<HTMLDivElement>(null)

  // 先量真实尺寸再落位: 优先在 chip 上方展开, 上方放不下改放下方, 左右夹在视口内。
  // 用 useLayoutEffect 直接写 style, 避免「先画在 0,0 再挪过去」的一帧闪动。
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const PAD = 8
    const GAP = 6
    const w = el.offsetWidth
    const h = el.offsetHeight
    let top = anchor.top - h - GAP
    if (top < PAD) top = anchor.bottom + GAP
    if (top + h > window.innerHeight - PAD) top = Math.max(PAD, window.innerHeight - h - PAD)
    let left = anchor.left
    if (left + w > window.innerWidth - PAD) left = window.innerWidth - w - PAD
    left = Math.max(PAD, left)
    el.style.top = `${Math.round(top)}px`
    el.style.left = `${Math.round(left)}px`
    el.style.visibility = 'visible'
  }, [anchor, ev])

  return createPortal(
    <div
      ref={ref}
      style={{ top: 0, left: 0, visibility: 'hidden' }}
      className="pointer-events-none fixed z-[70] min-w-[180px] rounded border border-danger/50 bg-surface/95 px-2.5 py-2 shadow-[0_4px_20px_hsl(var(--border)/0.5)] backdrop-blur"
    >
      <div className="mb-1 flex items-center gap-1">
        <span className="text-xs font-bold text-foreground">{ev.name}</span>
        <span className="font-mono text-[10px] text-muted">{ev.code}</span>
        {ev.tag && (
          <span
            className="rounded px-1 text-[9px] font-bold"
            style={TAG_STYLE[ev.tag] ? { background: TAG_STYLE[ev.tag].bg, color: TAG_STYLE[ev.tag].fg } : undefined}
          >
            {ev.tag}
          </span>
        )}
      </div>
      <TipRow label="类型" value={TYPE_LABEL[ev.type]} />
      <TipRow label="时间" value={fmtTime(ev.time)} />
      <TipRow label="题材" value={ev.reason} />
      {ev.type === 'zt' && <TipRow label="梯队" value={ev.tier} />}
      <TipRow label="价格" value={`¥${(ev.price ?? 0).toFixed(2)}`} />
      <TipRow
        label="涨跌幅"
        value={`${ev.change_pct >= 0 ? '+' : ''}${(ev.change_pct ?? 0).toFixed(2)}%`}
        tone={ev.change_pct >= 0 ? 'bull' : 'bear'}
      />
      <TipRow label="成交额" value={fmtAmount(ev.amount)} />
    </div>,
    document.body,
  )
}

function TipRow({ label, value, tone }: { label: string; value: string; tone?: 'bull' | 'bear' }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[10px] leading-4">
      <span className="text-muted">{label}</span>
      <span className={cn('font-mono', tone === 'bull' ? 'text-bull' : tone === 'bear' ? 'text-bear' : 'text-secondary')}>
        {value}
      </span>
    </div>
  )
}
