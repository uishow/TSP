/* 南川三代 0801D · 分时主图覆盖层（客户端注入脚本）
 *
 * 由 overrides/nanchuan/patch.py 在 HTML </body> 前注入。
 * 前置依赖：patch.py 会把 core.js 全文拼在本文件之前，故 globalThis.NanchuanCore.compute 可用。
 *
 * 行为：
 *  - 仅当「配置项开关」开启（localStorage tsp-nanchuan=1，默认 1）且用户打开个股详情·分时视图时激活
 *  - 在 .tv-lightweight-charts 绘图区上叠加透明 canvas，画 a9 均价黄虚线 + 四条锚定线 + 文字
 *  - 任何取数失败 / 容器找不到 / 计算异常：移除覆盖层、恢复原图，绝不白屏
 *  - 右下角浮动开关可实时切换「南川ON/OFF」，状态持久化
 *
 * 【2026-11-17 性能修复】
 *  旧版每 1.5s 轮询一次 /api/kline/minute?live=true，实测该接口单次耗时 1.9~27.9s，
 *  造成覆盖层几十秒才出现、且反复重建 canvas。
 *  新版改为：DOM 检测 900ms（不取数）；数据仅首次取一次，盘中每 45s 刷新一次且不带 live 参数
 *  （实测 1.6~2.0s）；数据签名未变则不重算不重绘；覆盖层容器复用；绘制走 requestAnimationFrame。
 *  调试计数挂在 window.__TSP_NANCHUAN_DEBUG，便于端到端验证「没有重复取数」。
 */
(function () {
  'use strict'

  var KEY = 'tsp-nanchuan'
  var DOM_POLL_MS = 900          // 只做 DOM 存在性检测，不取数
  var REFRESH_MS = 45000         // 盘中数据刷新间隔；非交易时段有缓存后不再刷新
  var FETCH_TIMEOUT_MS = 8000
  var THEME_EVT = 'tf-theme-change'

  var overlay = null             // 覆盖层容器 div
  var canvas = null
  var boundCard = null           // 当前覆盖层所挂的宿主绘图区节点
  var resizeObs = null
  var fetching = false
  var lastFetchAt = 0
  var lastSymbol = ''            // 当前已激活的视图键
  var rafId = 0
  var inited = false
  // 数据缓存：同一标的 + 数据签名未变 → 直接复用，不重新计算/重绘
  var cache = { symbol: '', sig: '', payload: null, computed: null, at: 0 }

  var core = (typeof globalThis !== 'undefined' && globalThis.NanchuanCore) || (typeof NanchuanCore !== 'undefined' ? NanchuanCore : null)
  var dbg = { fetches: 0, draws: 0, cacheHits: 0, lastFetchMs: 0, lastError: '' }
  try { window.__TSP_NANCHUAN_DEBUG = dbg } catch (e) {}

  function enabled() { try { return localStorage.getItem(KEY) !== '0' } catch (e) { return true } }
  function setEnabled(v) { try { localStorage.setItem(KEY, v ? '1' : '0') } catch (e) {} }

  function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now() }

  // 盘中时段（本地时间，北京时间）：9:25-11:30 / 13:00-15:05，周末不刷新
  function isTradingNow() {
    try {
      var d = new Date()
      var wd = d.getDay()
      if (wd === 0 || wd === 6) return false
      var m = d.getHours() * 60 + d.getMinutes()
      return (m >= 925 && m <= 1130) || (m >= 1300 && m <= 1505)
    } catch (e) { return true }
  }

  // 主题：跟随主站 html.dark
  function isDark() {
    try {
      if (document.documentElement.classList.contains('dark')) return true
      var t = localStorage.getItem('tf-theme')
      return t !== 'light'
    } catch (e) { return true }
  }

  // 从 dialog 顶部文本读 symbol（形如 002474.SZ）；用 textContent 避免 innerText 触发重排
  function readSymbol(dialog) {
    var m = (dialog.textContent || '').match(/\b(\d{6}\.(?:SZ|SH|BJ))\b/)
    return m ? m[1] : ''
  }

  // 当前是否在「分时」视图
  // 【2026-11-17 15:1x 修复】日K页签误叠加的根因：
  //  旧版只查 dialog 里有没有「分时走势」四个字 + 按钮 class 猜高亮。
  //  但「日 K」页签下右侧小面板标题也叫「分时走势」，且按钮 class 判断不稳，
  //  导致日K页签被误判成分时，覆盖层画到日K蜡烛图上（横轴变成 22 个交易日）。
  //  实测 DOM：顶部「日 K」/「分时」按钮都带 aria-selected（true/false），这是真源。
  function isIntradayView(dialog) {
    if (!dialog) return false
    var btns = dialog.querySelectorAll('button')
    var fen = null, day = null
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].textContent || '').trim()
      if (t === '分时' && !fen) fen = btns[i]
      else if ((t === '日 K' || t === '日K') && !day) day = btns[i]
    }
    if (fen) {
      var sel = fen.getAttribute('aria-selected')
      if (sel !== null) return sel === 'true'
      // 兜底：无 aria-selected 时按 class 高亮判断（只在两个按钮都在时）
      if (day) {
        var fc = (fen.className || '').toString(), dc = (day.className || '').toString()
        var fOn = /(bg-accent|text-accent|font-medium|text-foreground)/.test(fc)
        var dOn = /(bg-accent|text-accent|font-medium|text-foreground)/.test(dc)
        if (fOn !== dOn) return fOn
      }
      return false // 信息不足：宁可不叠加，也不画错图
    }
    return false // 找不到「分时」按钮：不是个股详情图，不叠加
  }

  // 绘图区锚点：直接锁定 .tv-lightweight-charts（精确贴合主站绘图区），
  // 而不是外面的卡片（卡片含标题栏，会让覆盖层上下错位）。
  function findChartCard(dialog) {
    if (!dialog) return null
    var tv = dialog.querySelector('.tv-lightweight-charts')
    if (!tv || !tv.querySelector('table')) return null
    return tv
  }

  function clearOverlay() {
    if (resizeObs) { try { resizeObs.disconnect() } catch (e) {} resizeObs = null }
    if (overlay && overlay.parentNode) {
      var parent = overlay.parentNode
      if (parent.getAttribute && parent.getAttribute('data-nanchuan-rel') === '1') {
        parent.style.position = ''
        parent.removeAttribute('data-nanchuan-rel')
      }
      parent.removeChild(overlay)
    }
    overlay = null
    canvas = null
    boundCard = null
  }

  // 复用已挂载的覆盖层；仅当宿主节点变化时才重建（这是「显示慢」的第二来源）
  function ensureOverlay(card) {
    if (overlay && canvas && boundCard === card && overlay.parentNode === card) return canvas
    clearOverlay()
    var wrap = document.createElement('div')
    wrap.setAttribute('data-nanchuan', '1')
    wrap.style.cssText = 'position:absolute;inset:0;z-index:5;pointer-events:none;'
    var cs = window.getComputedStyle(card)
    if (cs.position === 'static') { card.style.position = 'relative'; card.setAttribute('data-nanchuan-rel', '1') }
    var cv = document.createElement('canvas')
    cv.style.cssText = 'width:100%;height:100%;display:block;'
    wrap.appendChild(cv)
    card.appendChild(wrap)
    overlay = wrap
    canvas = cv
    boundCard = card
    if (typeof ResizeObserver !== 'undefined') {
      try {
        resizeObs = new ResizeObserver(function () { scheduleDraw() })
        resizeObs.observe(card)
      } catch (e) { resizeObs = null }
    }
    return cv
  }

  // 取分时数据：主站同源接口。不带 live=true —— 实测该参数单次 1.9~27.9s。
  // 本地分钟分区盘中按 ≥60s 轮次更新，45s 刷新一次足够，且单次 1.6~2.0s。
  function fetchMinute(symbol, cb) {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', '/api/kline/minute?symbol=' + encodeURIComponent(symbol), true)
    xhr.setRequestHeader('Accept', 'application/json')
    xhr.timeout = FETCH_TIMEOUT_MS
    var done = false
    function finish(err, payload) {
      if (done) return
      done = true
      cb(err, payload)
    }
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return
      if (xhr.status < 200 || xhr.status >= 300) return finish(new Error('HTTP ' + xhr.status))
      try {
        var j = JSON.parse(xhr.responseText)
        if (!j.rows || j.rows.length < 2) return finish(new Error('empty rows'))
        finish(null, j)
      } catch (e) { finish(e) }
    }
    xhr.ontimeout = function () { finish(new Error('timeout')) }
    xhr.onerror = function () { finish(new Error('network')) }
    xhr.send()
  }

  // 数据签名：日期 + 根数 + 末根时间 + 末根收盘价。未变则跳过重算重绘。
  function sigOf(payload) {
    var rows = payload.rows
    var last = rows[rows.length - 1]
    return String(payload.date || '') + '|' + rows.length + '|' + last.datetime + '|' + last.close
  }

  // 画复刻分时走势：价格折线 + a9 黄虚线 + 四条锚定线 + 文字
  function draw(payload, computed) {
    if (!canvas) return
    var rect = canvas.parentElement.getBoundingClientRect()
    var W = Math.max(200, Math.floor(rect.width))
    var H = Math.max(120, Math.floor(rect.height))
    var dpr = window.devicePixelRatio || 1
    var pw = Math.floor(W * dpr), ph = Math.floor(H * dpr)
    if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph }
    var g = canvas.getContext('2d')
    g.setTransform(dpr, 0, 0, dpr, 0, 0)

    var dark = isDark()
    var bg = dark ? '#0c0c0d' : '#ffffff'
    var grid = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
    var fg = dark ? '#a1a1aa' : '#71717a'
    var priceColor = dark ? '#e4e4e7' : '#18181b'
    g.clearRect(0, 0, W, H)
    g.fillStyle = bg
    g.fillRect(0, 0, W, H)

    var rows = payload.rows
    var ov = computed.overlays
    var prevClose = +payload.prev_close || rows[0].close
    var n = rows.length
    var padL = 46, padR = 50, padT = 12, padB = 18
    var plotW = W - padL - padR
    var plotH = H - padT - padB

    var minP = prevClose, maxP = prevClose
    function consider(v) { if (isFinite(v) && v > 0) { if (v < minP) minP = v; if (v > maxP) maxP = v } }
    for (var i = 0; i < n; i++) { consider(rows[i].high); consider(rows[i].low); consider(ov.avg[i]) }
    ov.lines.forEach(function (l) { consider(l.price) })
    var span = (maxP - minP) || (prevClose * 0.02)
    minP -= span * 0.12; maxP += span * 0.12
    var yOf = function (p) { return padT + (maxP - p) / (maxP - minP) * plotH }
    var xOf = function (idx) { return padL + (n <= 1 ? 0 : idx / (n - 1) * plotW) }

    g.font = '10px system-ui, sans-serif'
    g.textBaseline = 'middle'
    for (var k = 0; k <= 4; k++) {
      var p = minP + (maxP - minP) * k / 4
      var yy = yOf(p)
      g.strokeStyle = grid; g.lineWidth = 1
      g.beginPath(); g.moveTo(padL, yy); g.lineTo(W - padR, yy); g.stroke()
      g.fillStyle = fg
      g.textAlign = 'left'
      g.fillText(p.toFixed(2), W - padR + 4, yy)
      var pct = (p / prevClose - 1) * 100
      g.fillText((pct >= 0 ? '+' : '') + pct.toFixed(2) + '%', W - padR + 4, yy + 11 > H ? yy - 11 : yy + 11)
    }
    var yPrev = yOf(prevClose)
    g.setLineDash([4, 4]); g.strokeStyle = fg; g.globalAlpha = 0.5
    g.beginPath(); g.moveTo(padL, yPrev); g.lineTo(W - padR, yPrev); g.stroke()
    g.setLineDash([]); g.globalAlpha = 1

    g.strokeStyle = priceColor; g.lineWidth = 1.4; g.beginPath()
    for (var i2 = 0; i2 < n; i2++) {
      var xx = xOf(i2), yy2 = yOf(rows[i2].close)
      if (i2 === 0) g.moveTo(xx, yy2); else g.lineTo(xx, yy2)
    }
    g.stroke()

    g.strokeStyle = '#eab308'; g.lineWidth = 1.3; g.setLineDash([5, 3]); g.beginPath()
    for (var i3 = 0; i3 < n; i3++) {
      var xx3 = xOf(i3), yy3 = yOf(ov.avg[i3])
      if (i3 === 0) g.moveTo(xx3, yy3); else g.lineTo(xx3, yy3)
    }
    g.stroke(); g.setLineDash([])

    ov.lines.forEach(function (l) {
      var y = yOf(l.price)
      if (y < padT - 2 || y > H - padB + 2) return
      g.strokeStyle = l.color; g.lineWidth = l.width; g.globalAlpha = 0.85
      g.beginPath(); g.moveTo(xOf(l.startIdx), y); g.lineTo(W - padR, y); g.stroke()
      g.globalAlpha = 1
    })

    ov.labels.forEach(function (lb) {
      var x = xOf(lb.idx), y = yOf(lb.price)
      g.font = 'bold 11px system-ui, sans-serif'
      var tw = g.measureText(lb.text).width
      var tx = Math.min(Math.max(padL, x - tw / 2), W - padR - tw)
      var ty = Math.min(Math.max(padT + 10, y - 8), H - padB - 2)
      g.fillStyle = dark ? 'rgba(12,12,16,0.82)' : 'rgba(255,255,255,0.88)'
      g.fillRect(tx - 3, ty - 9, tw + 6, 15)
      g.fillStyle = lb.color; g.textAlign = 'left'
      g.fillText(lb.text, tx, ty)
    })

    g.font = '10px system-ui, sans-serif'; g.textAlign = 'left'
    g.fillStyle = dark ? 'rgba(234,179,8,0.85)' : 'rgba(161,98,7,0.9)'
    g.fillText('南川三代 0801D · 分时主图', padL + 4, padT + 8)
  }

  function scheduleDraw() {
    if (rafId) return
    rafId = (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : function (f) { return setTimeout(f, 16) })(function () {
      rafId = 0
      if (!canvas || !cache.payload || !cache.computed) return
      try { draw(cache.payload, cache.computed); dbg.draws++ }
      catch (e) { dbg.lastError = 'draw:' + e.message; clearOverlay() }
    })
  }

  function invalidateView() {
    lastSymbol = ''
    clearOverlay()
  }

  function activate(allowFetch) {
    if (document.hidden) return
    var dialog = document.querySelector('[role="dialog"]')
    if (!dialog || !isIntradayView(dialog)) { invalidateView(); return }
    var symbol = readSymbol(dialog)
    if (!symbol) { invalidateView(); return }
    var card = findChartCard(dialog)
    if (!card) { clearOverlay(); return }

    if (lastSymbol !== symbol) {
      lastSymbol = symbol
      cache = { symbol: '', sig: '', payload: null, computed: null, at: 0 }
      lastFetchAt = 0
    }

    var haveCache = !!(cache.payload && cache.symbol === symbol)
    if (haveCache) {
      // 仅在覆盖层确实丢失时重建/重绘；数据没变就不要每 900ms 白重画一次
      var wasMissing = !overlay
      ensureOverlay(card)
      if (wasMissing) scheduleDraw()
      dbg.cacheHits++
    }

    if (!allowFetch || fetching) return
    if (haveCache && !isTradingNow()) return
    if (Date.now() - lastFetchAt < (haveCache ? REFRESH_MS : 0)) return

    fetching = true
    var t0 = now()
    fetchMinute(symbol, function (err, payload) {
      fetching = false
      dbg.fetches++
      dbg.lastFetchMs = Math.round(now() - t0)
      if (err) {
        dbg.lastError = String(err.message || err)
        if (!haveCache) clearOverlay()
        return
      }
      var sig = sigOf(payload)
      lastFetchAt = Date.now()
      if (haveCache && sig === cache.sig) return  // 数据未变：不重算不重绘

      var computed
      try {
        if (!core) throw new Error('core unavailable')
        computed = core.compute(payload.rows)
      } catch (e) {
        dbg.lastError = 'compute:' + e.message
        if (!haveCache) clearOverlay()
        return
      }
      cache = { symbol: symbol, sig: sig, payload: payload, computed: computed, at: Date.now() }
      // 异步期间主站可能重绘分时卡片，必须重新定位最新容器
      var d2 = document.querySelector('[role="dialog"]')
      if (!d2 || !isIntradayView(d2)) return
      var card2 = findChartCard(d2)
      if (!card2) return
      ensureOverlay(card2)
      scheduleDraw()
    })
  }

  function tick() {
    if (!enabled()) { clearOverlay(); return }
    try { activate(true) } catch (e) { dbg.lastError = 'tick:' + e.message; clearOverlay() }
  }

  function addSwitch() {
    if (document.getElementById('nanchuan-switch')) return
    var btn = document.createElement('button')
    btn.id = 'nanchuan-switch'
    btn.textContent = enabled() ? '南川ON' : '南川OFF'
    btn.title = '切换「南川三代 0801D」分时指标叠加层（状态会记住）'
    btn.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483000;' +
      'font:12px system-ui;padding:6px 10px;border-radius:8px;cursor:pointer;' +
      'border:1px solid ' + (isDark() ? '#3f3f46' : '#d4d4d8') + ';' +
      'background:' + (enabled() ? '#166534' : '#3f3f46') + ';color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.3);'
    btn.addEventListener('click', function (e) {
      e.stopPropagation()
      var next = !enabled()
      setEnabled(next)
      btn.textContent = next ? '南川ON' : '南川OFF'
      btn.style.background = next ? '#166534' : '#3f3f46'
      if (!next) { clearOverlay() } else { lastFetchAt = 0; tick() }
    })
    document.body.appendChild(btn)
  }

  function init() {
    if (inited) return
    inited = true
    addSwitch()
    tick()
    var timer = setInterval(tick, DOM_POLL_MS)
    // 主题切换只重绘，不重新取数
    window.addEventListener(THEME_EVT, scheduleDraw)
    window.addEventListener('storage', scheduleDraw)
    try {
      var mo = new MutationObserver(scheduleDraw)
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    } catch (e) {}
    window.setInterval(function () {
      try {
        var b = document.getElementById('nanchuan-switch')
        if (b) {
          b.style.borderColor = isDark() ? '#3f3f46' : '#d4d4d8'
          b.style.background = enabled() ? '#166534' : '#3f3f46'
        }
      } catch (e) {}
    }, 3000)
    void timer
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
