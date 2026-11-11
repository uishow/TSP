/**
 * seal-sampler.mjs —— 封单/盘口采样器（只读，本地记录）
 *
 * 目的：单次快照分不清「封单被吃掉」还是「主动撤单」，需要时间序列。
 * 做法：盘中每 N 秒对「自选池 + 当日接近/已涨停」的票采一次五档，
 *       落盘 封单/YYYY-MM-DD.ndjson（一轮一行 JSON，行内是这批票的买一/封单/成交额）。
 *
 * 数据来源（全部本机、只读、不烧任何模型/TSP 积分）：
 *   · 候选池 + 流通股本/成交额：TSP GET /api/screener/market-snapshot、/api/watchlist
 *   · 五档盘口：ELTDX adapter POST http://127.0.0.1:3021/depth5
 *
 * 用法：
 *   node seal-sampler.mjs            常驻（09:15–15:05，收盘自动退出）
 *   node seal-sampler.mjs --once     只采一轮（盘后联调）
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PKG_ROOT, config, getJson } from './lib/tsp-http.mjs'

const CFG = config()
const S = CFG.seal || {}
const INTERVAL = S.intervalSeconds || 10
const START = toMin(S.startTime || CFG.alert?.startTime || '09:15')
const EXIT = toMin(S.exitTime || '15:05')
const OUT_DIR = join(PKG_ROOT, '封单')
const STATE_FILE = join(PKG_ROOT, 'state', 'seal-sampler.json')
const ADAPTER = process.env.XIAOJIU_ELTDX_ADAPTER || 'http://127.0.0.1:3021'
const NEAR_LIMIT_PCT = S.nearLimitPct ?? 2.0 // 距涨停 2 个点以内都算候选
const MAX_SYMBOLS = S.maxSymbols || 150

const ONCE = process.argv.includes('--once')

for (const d of [OUT_DIR, join(PKG_ROOT, 'state')]) if (!existsSync(d)) mkdirSync(d, { recursive: true })

function toMin(text) {
  const [h, m] = String(text).split(':').map(Number)
  return h * 60 + m
}
function minutesOf(d = new Date()) {
  return d.getHours() * 60 + d.getMinutes()
}
function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function isWeekday(d = new Date()) {
  const w = d.getDay()
  return w >= 1 && w <= 5
}
function log(...a) {
  console.log(`[${new Date().toLocaleString('zh-CN', { hour12: false })}]`, ...a)
}
function sleep(sec) {
  return new Promise((r) => setTimeout(r, sec * 1000))
}

function limitPctOf(symbol, name) {
  const code = String(symbol || '').split('.')[0]
  if (/ST|退/.test(name || '')) return 5
  if (/^(688|300|301)/.test(code)) return 20
  if (/^(4|8|92)/.test(code)) return 30
  return 10
}

async function postJson(url, body, timeoutMs = 20000) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }
  return { ok: res.ok, status: res.status, body: json }
}

/** 候选池：自选池 ∪ 当日涨幅距涨停 ≤ NEAR_LIMIT_PCT 的票（含已在涨停的） */
async function candidates() {
  const [snapRes, wlRes] = await Promise.all([getJson('/api/screener/market-snapshot'), getJson('/api/watchlist')])
  const rows = Array.isArray(snapRes.body?.rows) ? snapRes.body.rows : []
  const watch = new Set((wlRes.body?.symbols || []).map((s) => s.symbol))
  const picked = []
  for (const r of rows) {
    const pct = typeof r.change_pct === 'number' ? (Math.abs(r.change_pct) < 1 ? r.change_pct * 100 : r.change_pct) : null
    if (pct === null) continue
    const lim = limitPctOf(r.symbol, r.name)
    const near = pct >= lim - NEAR_LIMIT_PCT
    const hot = (r.consecutive_limit_ups || 0) > 0
    if (near || hot || watch.has(r.symbol)) picked.push(r)
  }
  picked.sort((a, b) => (b.change_pct || 0) - (a.change_pct || 0))
  return picked.slice(0, MAX_SYMBOLS)
}

async function sampleOnce() {
  const list = await candidates()
  if (!list.length) return { n: 0, symbols: 0 }
  const symbols = list.map((r) => r.symbol)
  const depth = new Map()
  // adapter /depth5 单次最多 100 只，分批
  for (let i = 0; i < symbols.length; i += 100) {
    const chunk = symbols.slice(i, i + 100)
    const r = await postJson(`${ADAPTER}/depth5`, { symbols: chunk })
    for (const row of r.body?.data || []) if (row.symbol) depth.set(row.symbol, row)
  }
  const now = new Date()
  const rows = []
  for (const meta of list) {
    const d = depth.get(meta.symbol)
    const bid1 = Array.isArray(d?.bids) && d.bids[0] ? d.bids[0] : null
    const ask1 = Array.isArray(d?.asks) && d.asks[0] ? d.asks[0] : null
    const pct = typeof meta.change_pct === 'number' ? (Math.abs(meta.change_pct) < 1 ? meta.change_pct * 100 : meta.change_pct) : null
    const lim = limitPctOf(meta.symbol, meta.name)
    const bidLots = bid1 ? Number(bid1[1]) || 0 : 0
    const bidPrice = bid1 ? Number(bid1[0]) || 0 : 0
    rows.push({
      s: meta.symbol,
      n: meta.name,
      p: meta.close, // 最新价
      pc: pct, // 涨跌幅 %
      lp: lim, // 涨跌停幅度
      b1p: bidPrice,
      b1v: bidLots, // 买一手数
      a1v: ask1 ? Number(ask1[1]) || 0 : 0, // 卖一手数
      seal: Math.round(bidPrice * bidLots * 100), // 买一挂单金额（元）
      amt: meta.amount, // 当日累计成交额（元）
      fs: meta.float_shares, // 流通股本（股）
      up: (meta.consecutive_limit_ups || 0) > 0 ? 1 : 0,
    })
  }
  const line = JSON.stringify({ ts: now.toISOString(), t: now.toTimeString().slice(0, 8), rows })
  appendFileSync(join(OUT_DIR, `${today()}.ndjson`), line + '\n', 'utf8')
  writeFileSync(STATE_FILE, JSON.stringify({ lastAt: now.toISOString(), count: rows.length }, null, 1), 'utf8')
  return { n: rows.length, symbols: list.length }
}

async function main() {
  log(`封单采样启动｜间隔 ${INTERVAL}s｜窗口 ${S.startTime || CFG.alert?.startTime || '09:15'}–${S.exitTime || '15:05'}｜候选上限 ${MAX_SYMBOLS} 只`)
  for (;;) {
    const now = new Date()
    const m = minutesOf(now)
    if (!ONCE) {
      if (m > EXIT) {
        log('已过收盘窗口，退出')
        break
      }
      if (!isWeekday(now)) {
        log('非交易日（周末），退出')
        break
      }
      if (m < START) {
        await sleep(60)
        continue
      }
    }
    try {
      const r = await sampleOnce()
      log(`采样 ${r.n} 条（候选 ${r.symbols} 只）→ 封单\\${today()}.ndjson`)
    } catch (e) {
      log('采样失败：', e.message || e)
    }
    if (ONCE) break
    await sleep(INTERVAL)
  }
}

main().catch((e) => {
  log('致命错误：', e.message || e)
  process.exit(1)
})
