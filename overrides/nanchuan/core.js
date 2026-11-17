/*
 * 南川三代 0801D · 分时主图指标内核（通达信公式逐条翻译）
 *
 * 来源：用户提供的通达信公式「{南川三代0801D｜独立版｜适配通达信26070714｜分时主图｜最终定稿}」
 * 铁律：口径零改。a1~a33 逐条对应，保留原公式的写法特性（含把绝对 ATR 当相对阈值的用法）。
 *
 * 通达信函数语义（按通达信默认实现）：
 *  - REF(X,N)    : i-N 根；越界( i-N<0 )取 X[0]
 *  - MA(X,N)     : 最近 N 根均值；不足 N 根按已有根数平均
 *  - SUM(X,0)    : 从首根到当前的累计和
 *  - SUM(X,N)    : 最近 N 根和
 *  - BARSLAST(P) : 上次 P 成立距今根数；成立当根=0；从未成立返回 i
 *  - BARSSINCE(P): 首次 P 成立距今根数；本数据首根即有 C，故 = i
 *  - COUNT(P,N)  : 最近 N 根中 P 为真个数（N 可为逐根变化的数组）
 *  - CROSS(A,B)  : A 上穿 B（A[i]>B[i] 且 A[i-1]<=B[i-1]）；标量按常数处理
 *  - FRACPART(x) : 小数部分
 *
 * 导出：globalThis.NanchuanCore = { compute }，并兼容 Node 的 module.exports。
 */
(function (root) {
  'use strict'

  // num 兼容 boolean（cross() 返回 true/false）：通达信里布尔与数值可混用，true=1/false=0。
  // 早期版本 num(true) 因 typeof 判断返回 0，导致 bool(cross(...)) 恒为 0、信号链路全灭。
  const num = (v) => (typeof v === 'boolean' ? (v ? 1 : 0) : (typeof v === 'number' && isFinite(v) ? v : 0))
  const bool = (v) => (num(v) ? 1 : 0)

  function ref(arr, n) {
    return arr.map((_, i) => arr[Math.max(0, i - n)])
  }
  function ma(arr, n) {
    const out = []
    let sum = 0
    for (let i = 0; i < arr.length; i++) {
      sum += num(arr[i])
      if (i >= n) sum -= num(arr[i - n])
      out.push(sum / Math.min(i + 1, n))
    }
    return out
  }
  function cumsum(arr) {
    const out = []
    let s = 0
    for (let i = 0; i < arr.length; i++) { s += num(arr[i]); out.push(s) }
    return out
  }
  function barslast(cond) {
    const out = []
    let last = -1
    for (let i = 0; i < cond.length; i++) {
      if (num(cond[i])) last = i
      out.push(last < 0 ? i : i - last)
    }
    return out
  }
  function countWindow(cond, N) {
    const out = []
    for (let i = 0; i < cond.length; i++) {
      const n = Math.max(0, Math.min(i + 1, num(N[i])))
      let c = 0
      for (let k = i - n + 1; k <= i; k++) if (k >= 0 && num(cond[k])) c++
      out.push(c)
    }
    return out
  }
  function cross(A, B, i) {
    const av = Array.isArray(A) ? num(A[i]) : num(A)
    const bv = Array.isArray(B) ? num(B[i]) : num(B)
    const ap = Array.isArray(A) ? num(A[Math.max(0, i - 1)]) : num(A)
    const bp = Array.isArray(B) ? num(B[Math.max(0, i - 1)]) : num(B)
    return av > bv && ap <= bp
  }
  function crossingSeries(A, B) {
    return A.map((_, i) => (cross(A, B, i) ? 1 : 0))
  }

  /**
   * rows: [{ datetime, open, high, low, close, volume, amount }, ...]（按时间升序，日线内）
   * 返回 { a, overlays, meta }：a 为 a1..a33 逐根数组，overlays 为绘图所需的线/标注。
   */
  function compute(rows) {
    const n = rows.length
    const H = rows.map((r) => num(r.high))
    const L = rows.map((r) => num(r.low))
    const C = rows.map((r) => num(r.close))
    const V = rows.map((r) => num(r.volume))
    const AMT = rows.map((r) => num(r.amount))
    const times = rows.map((r) => String(r.datetime || ''))

    const hour = times.map((t) => { const m = t.match(/T(\d{2}):/); return m ? +m[1] : 0 })
    const minute = times.map((t) => { const m = t.match(/:(\d{2}):/); return m ? +m[1] : 0 })
    const TIME = times.map((t) => {
      const m = t.match(/T(\d{2}):(\d{2}):(\d{2})/)
      return m ? (+m[1] * 10000 + +m[2] * 100 + +m[3]) : 0
    })

    // a1/a2：秒（TIME 的个位两位）；a2 在原公式未被使用，保留以逐条对照
    const a1 = TIME.map((t) => (t / 100 - Math.floor(t / 100)) * 100)
    const a2 = a1.map((v) => (v > 50 ? 1 : 0))

    // a3：距 9:30 的根数 +1。本机数据源可能带 09:30 快照柱（volume=0），
    // 也可能首根直接是 09:31；优先认真实 9:30 根，缺失时退回首根作锚点。
    const has930 = TIME.some((t) => t === 93000)
    const is930 = TIME.map((t, i) => (has930 ? t === 93000 : i === 0))
    const a3 = barslast(is930).map((v) => v + 1)
    const a7 = a3.slice()

    // a4/a5：累计成交额均价（元/股）；a5 原公式未使用
    // 注意：本机数据源首根是 09:30 快照柱（volume=0），午间也可能有 0 量占位根。
    // 通达信分时在这些根上均价线保持上一有效值，不能落到 0——否则 a9 从 0 跳到 5.29，
    // 画出来是一条竖直虚线，且会污染 a12/a13 的比值判断。
    const sumAmt = cumsum(AMT)
    const sumVol = cumsum(V)
    const sumCV = cumsum(C.map((c, i) => c * V[i]))
    const a4 = [], a5 = []
    for (let i = 0; i < n; i++) {
      if (sumVol[i] > 0) {
        a4.push(sumAmt[i] / sumVol[i] / 100)
        a5.push(sumCV[i] / sumVol[i])
      } else {
        a4.push(i > 0 ? a4[i - 1] : C[i])
        a5.push(i > 0 ? a5[i - 1] : C[i])
      }
    }

    // a6/a8：第几根 + 简单算术均价（9:25 前的回退分支，本分时数据全在 9:25 之后）
    const a6 = C.map((_, i) => i + 1)
    const a8 = C.map((_, i) => {
      let s = 0
      for (let k = 0; k <= i; k++) s += C[k]
      return s / (i + 1)
    })

    // a9：分时均价黄虚线；TIME>92500 恒真 → a9 = a4
    const a9 = TIME.map((t, i) => (t > 92500 ? a4[i] : a8[i]))

    // 真实波幅 / ATR(14) / a10(前一根 ATR) / a11 = a10*1.3
    //
    // 【2026-11-17 口径修正】通达信「分时走势图」每一根只有一个价格点，
    // 公式里的 H/L 在分时语境下退化为当前价（或等价地 H=MAX(C,REF(C,1))、
    // L=MIN(C,REF(C,1))），故 TRV = |C - REF(C,1)|，而不是分钟K线的最高/最低价。
    //
    // 实测证据（002474.SZ 2026-11-17，用户通达信原图对照）：
    //   分钟K H/L 口径 → 卖！5.400@11:10、买！5.260@14:09   （与原图对不上）
    //   分时 ΔC 口径   → 卖！5.380@11:03、买！5.280@10:37   （与原图 5.38@~11:00、5.28@~10:35 一致）
    // K线口径把 ATR 放大约 2~4 倍，导致 a12/a13 首次偏离晚几十到几百分钟，
    // 锚定价随之失真；这是「信号和通达信不一样」的根因。
    // H/L 数组仍保留，供 DRAWTEXT(a14 OR a22,H,...) / (a15 OR a23,L,...) 标注位置使用。
    const TRV = C.map((c, i) => Math.abs(c - (i > 0 ? C[i - 1] : c)))
    const ATRVAL = ma(TRV, 14)
    const a10 = ref(ATRVAL, 1)
    const a11 = a10.map((v) => v * 1.3)

    // a12/a13：首根偏离均价（a7>2 即从第 3 根起）
    const a12 = C.map((c, i) => (c / (a9[i] || 1) > 1 + a10[i] && a7[i] > 2 ? 1 : 0))
    const a13 = C.map((c, i) => (c / (a9[i] || 1) < 1 - a10[i] && a7[i] > 2 ? 1 : 0))

    const cumA12 = cumsum(a12)
    const cumA13 = cumsum(a13)
    // a14/a15：偏离首次发生（累计从 0→1）
    const a14 = cumA12.map((v, i) => (num(cumA12[Math.max(0, i - 1)]) === 0 && v === 1 ? 1 : 0))
    const a15 = cumA13.map((v, i) => (num(cumA13[Math.max(0, i - 1)]) === 0 && v === 1 ? 1 : 0))

    const downBar = C.map((c, i) => (i > 0 && c < C[i - 1] ? 1 : 0))
    const upBar = C.map((c, i) => (i > 0 && c > C[i - 1] ? 1 : 0))
    const b14 = barslast(a14)
    const b15 = barslast(a15)

    // a16：a14 之后首根下跌 bar → 卖！；a17：a15 之后首根上涨 bar → 买！
    const a16 = a14.map((_, i) => (
      cumA12[i] * bool(cross(countWindow(downBar, b14).map((v, k) => (v && b14[k] > 0 ? 1 : 0)), 0.5, i))
    ))
    const a17 = a15.map((_, i) => (
      cumA13[i] * bool(cross(countWindow(upBar, b15).map((v, k) => (v && b15[k] > 0 ? 1 : 0)), 0.5, i))
    ))

    const a18 = barslast(a16)
    const a19 = a18.map((v, i) => C[Math.max(0, i - (v + 1))])
    const a20 = barslast(a17)
    const a21 = a20.map((v, i) => C[Math.max(0, i - (v + 1))])

    // a22/a23：再卖/再买 预警（突破锚定价 ± a11）
    const preA22 = a19.map((p, i) => (p > 0 && C[i] > p * (1 + a11[i]) ? 1 : 0))
    const preA23 = a21.map((p, i) => (p > 0 && C[i] < p * (1 - a11[i]) ? 1 : 0))
    const a22 = crossingSeries(cumsum(preA22), 0.5)
    const a23 = crossingSeries(cumsum(preA23), 0.5)

    const b22 = barslast(a22)
    const b23 = barslast(a23)
    const cumA22 = cumsum(a22)
    const cumA23 = cumsum(a23)
    const a24 = a22.map((_, i) => (
      cumA22[i] * bool(cross(countWindow(downBar, b22).map((v, k) => (v && b22[k] > 0 ? 1 : 0)), 0.5, i))
    ))
    const a25 = a23.map((_, i) => (
      cumA23[i] * bool(cross(countWindow(upBar, b23).map((v, k) => (v && b23[k] > 0 ? 1 : 0)), 0.5, i))
    ))

    const a26 = barslast(a24)
    const a27 = a26.map((v, i) => C[Math.max(0, i - (v + 1))])
    const a28 = barslast(a25)
    const a29 = a28.map((v, i) => C[Math.max(0, i - (v + 1))])

    // a30~a33：原公式定义但未用于绘图，保留逐条对照
    const a30 = crossingSeries(a17, 0.5).map((_, i) => (cross(0.5, a17, i) ? 1 : 0))
    const a31 = a17.map((_, i) => (cross(0.5, a25, i) ? 1 : 0))
    const a32 = a17.map((_, i) => (cross(0.5, a16, i) ? 1 : 0))
    const a33 = a17.map((_, i) => (cross(0.5, a24, i) ? 1 : 0))

    const a = { a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20, a21, a22, a23, a24, a25, a26, a27, a28, a29, a30, a31, a32, a33 }

    // ---- 绘图叠加层 ----
    // 水平锚定线：从信号当根起向右延伸，取该根 a19/a21/a27/a29（锚定价在其后保持不变）
    const lines = []
    const pushLine = (arr, flag, label, color, width) => {
      let started = null
      for (let i = 0; i < n; i++) {
        if (num(flag[i])) { started = { startIdx: i, price: num(arr[i]), label } }
        // 只在首次出现处落一条线（多次信号由后续 flag 再触发）
        if (num(flag[i]) && started && started.startIdx === i) {
          lines.push(Object.assign({}, started, { color, width }))
        }
      }
    }
    pushLine(a19, a16, '卖！', '#22c55e', 3)
    pushLine(a21, a17, '买！', '#d946ef', 3)
    pushLine(a27, a24, '再卖', '#22c55e', 2)
    pushLine(a29, a25, '再买', '#d946ef', 2)

    // 文字标注（通达信 DRAWTEXT）：idx + 价位 + 文案 + 颜色
    const labels = []
    const pushLabels = (flag, priceArr, text, color) => {
      for (let i = 0; i < n; i++) if (num(flag[i])) labels.push({ idx: i, price: num(priceArr[i]), text, color })
    }
    const a14or22 = a14.map((v, i) => (num(v) || num(a22[i]) ? 1 : 0))
    const a15or23 = a15.map((v, i) => (num(v) || num(a23[i]) ? 1 : 0))
    const prevC = ref(C, 1)
    pushLabels(a14or22, H, '准备卖', '#22c55e')
    pushLabels(a15or23, L, '准备买', '#ef4444')
    pushLabels(a16, prevC, '卖！', '#eab308')
    pushLabels(a24, prevC, '再卖', '#eab308')
    pushLabels(a17, prevC, '买！', '#eab308')
    pushLabels(a25, prevC, '再买', '#eab308')
    labels.sort((x, y) => x.idx - y.idx)

    return {
      a,
      overlays: { avg: a9, lines, labels, close: C, high: H, low: L, times },
      meta: { n, firstTime: times[0], lastTime: times[n - 1], avg15Count: cumA12[n - 1], avg16Count: cumA16Count(a16) }
    }
  }
  function cumA16Count(arr) { let c = 0; for (const v of arr) if (num(v)) c++; return c }

  const api = { compute, _fns: { ref, ma, cumsum, barslast, countWindow, cross } }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  root.NanchuanCore = api
})(typeof globalThis !== 'undefined' ? globalThis : this)
