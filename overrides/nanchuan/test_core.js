/* 南川内核逐条对照测试（Node 下运行，真实 API 数据）
 * 用法：node overrides/nanchuan/test_core.js [symbol] [date]
 */
const fs = require('fs')
const path = require('path')
const http = require('http')
const core = require(path.join(__dirname, 'core.js'))

const symbol = process.argv[2] || '002474.SZ'
const date = process.argv[3] || ''
const url = `http://127.0.0.1:3018/api/kline/minute?symbol=${encodeURIComponent(symbol)}&live=true${date ? '&date=' + date : ''}`

function fetchJson(u) {
  return new Promise((resolve, reject) => {
    http.get(u, { headers: { 'Accept': 'application/json' } }, (res) => {
      let buf = ''
      res.setEncoding('utf8')
      res.on('data', (c) => (buf += c))
      res.on('end', () => { try { resolve(JSON.parse(buf)) } catch (e) { reject(new Error('bad json: ' + buf.slice(0, 120))) } })
    }).on('error', reject)
  })
}

function assert(cond, msg) { if (!cond) throw new Error('ASSERT FAIL: ' + msg) }
function count(arr) { return arr.reduce((s, v) => s + (v ? 1 : 0), 0) }

;(async () => {
  const payload = await fetchJson(url)
  assert(Array.isArray(payload.rows) && payload.rows.length >= 3, `数据不足: ${JSON.stringify(payload).slice(0, 160)}`)
  const rows = payload.rows
  const r = core.compute(rows)
  const a = r.a
  const n = rows.length

  console.log('=== 数据源 ===')
  console.log(`symbol=${payload.symbol} name=${payload.name} date=${payload.date} rows=${n} prev_close=${payload.prev_close}`)
  console.log(`first=${rows[0].datetime} close=${rows[0].close} | last=${rows[n - 1].datetime} close=${rows[n - 1].close}`)

  console.log('\n=== 逐条数组长度一致性（应为 ' + n + '）===')
  for (const k of Object.keys(a)) assert(a[k].length === n, `${k}.length=${a[k].length} != ${n}`)
  console.log(`a1..a33 共 ${Object.keys(a).length} 条，全部长度=${n} ✓`)

  console.log('\n=== 均价线 a9 ===')
  console.log(`a9[0]=${a.a9[0].toFixed(4)} a9[mid]=${a.a9[n >> 1].toFixed(4)} a9[last]=${a.a9[n - 1].toFixed(4)}`)
  assert(a.a9.every((v) => isFinite(v) && v > 0), 'a9 存在非正/NaN')
  console.log('a9 全为正且有限 ✓')

  console.log('\n=== 阈值 a10/a11（前一根 ATR / *1.3）===')
  console.log(`a10[0]=${a.a10[0].toFixed(4)} (REF 越界取首值) a10[last]=${a.a10[n - 1].toFixed(4)}`)
  console.log(`a11[last]=${a.a11[n - 1].toFixed(4)} = a10*1.3? ${(Math.abs(a.a11[n - 1] - a.a10[n - 1] * 1.3) < 1e-9)}`)

  console.log('\n=== 信号触发次数（首根无前收、ATR 未成型，早期信号少属正常）===')
  const sig = ['a12', 'a13', 'a14', 'a15', 'a16', 'a17', 'a22', 'a23', 'a24', 'a25']
  for (const k of sig) console.log(`  ${k}: ${count(a[k])}`)
  console.log(`  水平线 lines: ${r.overlays.lines.length} | 文字标注 labels: ${r.overlays.labels.length}`)

  console.log('\n=== DRAWLINE 锚定价正确性（a19 应 = 卖信号前一根 C，信号后保持不变）===')
  const idx16 = a.a16.map((v, i) => (v ? i : -1)).filter((i) => i >= 0)
  if (idx16.length) {
    const j = idx16[0]
    const expect = rows[j - 1] ? rows[j - 1].close : rows[0].close
    let stable = true
    for (let i = j; i < Math.min(n, j + 5); i++) if (Math.abs(a.a19[i] - expect) > 1e-9) stable = false
    console.log(`  首个卖信号 idx=${j} a19=${a.a19[j].toFixed(4)} 期望 C[j-1]=${expect.toFixed(4)} 匹配=${Math.abs(a.a19[j] - expect) < 1e-9}`)
    console.log(`  信号后 5 根锚定价保持稳定=${stable}`)
    assert(Math.abs(a.a19[j] - expect) < 1e-9, 'a19 锚定价不符')
  } else {
    console.log('  本标的当日无 a16 卖信号（属正常业务结果，非计算错误）')
  }

  console.log('\n=== 元素抽样（末根）===')
  const last = n - 1
  console.log(`  C=${a.a9[last] && rows[last].close} a9=${a.a9[last].toFixed(4)} C/a9=${(rows[last].close / a.a9[last]).toFixed(4)} a7=${a.a7[last]}`)
  console.log('\nALL CORE TESTS PASSED ✓')
})().catch((e) => { console.error('TEST FAILED:', e.message); process.exit(1) })
