// ============================================================================
// TSP · K 线绘图工作台   —   ext_page 运行时插件 (单文件 ES 模块)
// ----------------------------------------------------------------------------
// 形态参照: TSP 原生「技术分析」页 (左侧画线工具 + 右侧指标面板 +
//           主图 K 线叠加均线 + 成交量副图 + MACD 副图 + 顶部周期切换)
//
// 重要: 本版本 **零外部依赖**。不 import 任何 CDN / 第三方 ESM,
//       K 线、指标、画线全部用原生 Canvas 2D 自行绘制, 因此在
//       离线 / 外网 fail-closed / 严格 CSP 的部署下也能正常打开。
//
// 数据来源: 同源 /api/kline/* (浏览器自动带会话 cookie, 无需 Bearer)
//   GET  /api/kline/daily?symbol=&days=240
//   GET  /api/kline/instruments/search?q=&limit=20
//   GET  /api/kline/minute-range?symbol=&days=20
//
// 升级安全: 落在 data/ext_pages/local_chart/, 不进镜像, 升级不丢。
// ============================================================================

// ── 主题 (贴近 TSP 暗色; A 股配色: 涨红跌绿) ──────────────────────────────
const T = {
  bg: '#0b1220', panel: '#111a2b', panel2: '#0e1726', border: '#1e2a3f',
  text: '#d7e0ee', muted: '#8794a8', dim: '#5c6b82',
  accent: '#3b82f6', accent2: '#1f6feb', grid: '#1b2740', cross: '#6b7c99',
  up: '#f23645', down: '#0ecb81', draw: '#ffb74d',
  ma: ['#ffb74d', '#4dd0e1', '#b388ff', '#90a4ae'],
  ema: ['#f472b6', '#38bdf8', '#a3e635'],
  boll: '#8b9dc3', volMa: ['#ffd54f', '#42a5f5'],
  dif: '#ffd54f', dea: '#42a5f5',
};

// ── 周期 (对齐截图: 日 / 周 / 月 / 30分 / 10分 / 5分 / 1分) ──────────────
const TFS = [
  { id: '1d', label: '日', kind: 'daily' },
  { id: '1w', label: '周', kind: 'week' },
  { id: '1M', label: '月', kind: 'month' },
  { id: '30m', label: '30分', kind: 'minute', n: 30, days: 20 },
  { id: '10m', label: '10分', kind: 'minute', n: 10, days: 20 },
  { id: '5m', label: '5分', kind: 'minute', n: 5, days: 20 },
  { id: '1m', label: '1分', kind: 'minute', n: 1, days: 20 },
];

// ── 画线工具 (分组 + 两列面板; n = 落点次数, free = 自由笔刷) ─────────────
const TOOL_GROUPS = [
  { name: '光标与编辑', tools: [
    { id: 'cursor', label: '十字光标', icon: '✛', n: 0, mode: 'cursor' },
    { id: 'delete', label: '删除图形', icon: '⌫', n: 0, mode: 'delete' },
    { id: 'clear', label: '清空画板', icon: '✕', n: 0, mode: 'clear' },
  ] },
  { name: '线条', tools: [
    { id: 'trend-line', label: '趋势线', icon: '╱', n: 2 },
    { id: 'horizontal-line', label: '水平线', icon: '—', n: 1 },
    { id: 'vertical-line', label: '垂直线', icon: '│', n: 1 },
    { id: 'ray', label: '射线', icon: '↗', n: 2 },
    { id: 'extended-line', label: '延长线', icon: '↔', n: 2 },
    { id: 'segment', label: '线段', icon: '／', n: 2 },
    { id: 'arrow', label: '箭头', icon: '➤', n: 2 },
    { id: 'parallel-channel', label: '平行通道', icon: '≋', n: 3 },
    { id: 'flat-channel', label: '平台通道', icon: '▤', n: 2 },
    { id: 'pitchfork', label: '分歧线', icon: 'Ψ', n: 3 },
  ] },
  { name: '图形', tools: [
    { id: 'rectangle', label: '矩形', icon: '▭', n: 2 },
    { id: 'vert-rectangle', label: '垂直矩形', icon: '▯', n: 2 },
    { id: 'triangle', label: '三角形', icon: '△', n: 3 },
    { id: 'circle', label: '圆', icon: '○', n: 2 },
    { id: 'ellipse', label: '椭圆', icon: '⬭', n: 2 },
    { id: 'arc', label: '弧形', icon: '⌒', n: 2 },
    { id: 'hyperbola', label: '双曲线', icon: '⋈', n: 2 },
  ] },
  { name: '斐波那契', tools: [
    { id: 'fib-retracement', label: '斐波那契回调线', icon: 'F', n: 2 },
    { id: 'fib-extension', label: '斐波那契扩展线', icon: 'F', n: 2 },
    { id: 'fib-time', label: '斐波那契时间周期', icon: 'F', n: 2 },
    { id: 'fib-fan', label: '斐波那契扇形', icon: 'F', n: 2 },
    { id: 'fib-arc', label: '斐波那契弧线', icon: 'F', n: 2 },
    { id: 'fib-spiral', label: '斐波那契螺线', icon: 'F', n: 2 },
    { id: 'fib-wedge', label: '斐波那契楔形', icon: 'F', n: 2 },
    { id: 'fib-channel', label: '斐波那契通道', icon: 'F', n: 2 },
  ] },
  { name: '江恩', tools: [
    { id: 'gann-fan', label: '江恩角度线', icon: 'G', n: 2 },
    { id: 'gann-box', label: '江恩箱', icon: 'G', n: 2 },
    { id: 'gann-grid', label: '江恩网格', icon: 'G', n: 2 },
    { id: 'gann-fan-alt', label: '江恩扇形', icon: 'G', n: 2 },
  ] },
  { name: '形态', tools: [
    { id: 'abcd', label: 'ABCO 形态', icon: '◇', n: 4 },
    { id: 'head-shoulders', label: '头部形态', icon: '◇', n: 3 },
    { id: 'triangle-pattern', label: '三角形形态', icon: '◇', n: 3 },
    { id: 'three-waves', label: '三浪形态', icon: '◇', n: 3 },
  ] },
  { name: '标注与测量', tools: [
    { id: 'text', label: '文字', icon: 'T', n: 1, mode: 'text' },
    { id: 'note', label: '注释', icon: 'T', n: 1, mode: 'text' },
    { id: 'callout', label: '气泡', icon: 'T', n: 1, mode: 'text' },
    { id: 'pin', label: '定位针', icon: 'T', n: 1, mode: 'text' },
    { id: 'flag', label: '旗标', icon: 'T', n: 1, mode: 'text' },
    { id: 'price-range', label: '价格区间', icon: '↕', n: 2 },
    { id: 'date-range', label: '日期区间', icon: '↔', n: 2 },
    { id: 'volume-profile', label: '量价分布', icon: '▥', n: 2 },
    { id: 'anchored-vwap', label: '锚定 VWAP', icon: '∿', n: 1 },
  ] },
  { name: '笔刷', tools: [
    { id: 'brush', label: '画笔', icon: '✎', n: 0, mode: 'free' },
    { id: 'highlighter', label: '高亮', icon: '▰', n: 0, mode: 'free' },
  ] },
];
const ALL_TOOLS = TOOL_GROUPS.flatMap((g) => g.tools.map((t) => ({ ...t, group: g.name })));
const TOOL_BY_ID = Object.fromEntries(ALL_TOOLS.map((t) => [t.id, t]));
const QUICK = ['cursor', 'trend-line', 'horizontal-line', 'vertical-line', 'ray',
  'rectangle', 'ellipse', 'triangle', 'fib-retracement', 'text', 'brush', 'delete'];

// ── 小工具 ────────────────────────────────────────────────────────────────
function h(tag, props, ...kids) {
  const node = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null) continue;
    if (k === 'style') Object.assign(node.style, v);
    else if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    node.appendChild(typeof kid === 'string' || typeof kid === 'number' ? document.createTextNode(String(kid)) : kid);
  }
  return node;
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const f2 = (n) => (n == null || !isFinite(n)) ? '-' : Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const f0 = (n) => (n == null || !isFinite(n)) ? '-' : Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 0 });

function smaArr(v, p) {
  const out = new Array(v.length).fill(NaN); let sum = 0;
  for (let i = 0; i < v.length; i++) { sum += v[i]; if (i >= p) sum -= v[i - p]; if (i >= p - 1) out[i] = sum / p; }
  return out;
}
function emaArr(v, p) {
  const out = new Array(v.length).fill(NaN), k = 2 / (p + 1); let prev = v[0];
  for (let i = 0; i < v.length; i++) { prev = i === 0 ? v[0] : v[i] * k + prev * (1 - k); out[i] = prev; }
  return out;
}
function bollArr(v, n, k) {
  const mid = smaArr(v, n), up = new Array(v.length).fill(NaN), lo = new Array(v.length).fill(NaN);
  for (let i = n - 1; i < v.length; i++) {
    let s = 0; for (let j = i - n + 1; j <= i; j++) s += (v[j] - mid[i]) ** 2;
    const sd = Math.sqrt(s / n); up[i] = mid[i] + k * sd; lo[i] = mid[i] - k * sd;
  }
  return { mid, up, lo };
}
function macdArr(v, fast, slow, signal) {
  const ef = emaArr(v, fast), es = emaArr(v, slow);
  const dif = v.map((_, i) => ef[i] - es[i]);
  const dea = emaArr(dif, signal);
  const hist = dif.map((d, i) => (d - dea[i]) * 2);
  return { dif, dea, hist };
}
function weekKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = (d.getUTCDay() + 6) % 7;              // 周一=0
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}
function aggregateBars(bars, kind) {
  const groups = new Map();
  for (const b of bars) {
    const t = String(b.t).slice(0, 10);
    const key = kind === 'week' ? weekKey(t) : t.slice(0, 7);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(b);
  }
  const out = [];
  for (const [, rows] of groups) {
    out.push({
      t: rows[rows.length - 1].t,
      open: rows[0].open, close: rows[rows.length - 1].close,
      high: Math.max(...rows.map((r) => r.high)), low: Math.min(...rows.map((r) => r.low)),
      volume: rows.reduce((s, r) => s + (r.volume || 0), 0),
    });
  }
  return out;
}
function minuteOfDay(dt) {
  const s = String(dt).replace('T', ' ');
  const m = s.match(/(\d{1,2}):(\d{2})/);
  return m ? (+m[1]) * 60 + (+m[2]) : 0;
}
function aggregateMinutes(rows, n) {
  const out = [];
  for (const r of rows) {
    const bucket = Math.floor(minuteOfDay(r.datetime) / n);
    const last = out[out.length - 1];
    const day = String(r.datetime).slice(0, 10);
    if (last && last._day === day && last._bucket === bucket) {
      last.high = Math.max(last.high, +r.high); last.low = Math.min(last.low, +r.low);
      last.close = +r.close; last.volume += +(r.volume || 0); last.t = r.datetime;
    } else {
      out.push({ _day: day, _bucket: bucket, t: r.datetime, open: +r.open, high: +r.high,
        low: +r.low, close: +r.close, volume: +(r.volume || 0) });
    }
  }
  return out.map(({ _day, _bucket, ...b }) => b);
}
const storeKey = (symbol, tf) => `tsp-chart-v2:${symbol}:${tf}`;

// ── 主页面 ────────────────────────────────────────────────────────────────
function mountPage(root) {
  root.style.cssText = 'height:100%;display:flex;flex-direction:column;background:' + T.bg +
    ';color:' + T.text + ';font:12px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;overflow:hidden;';

  const S = {
    bars: [], raw: [], tf: TFS[0], symbol: '600519.SH', name: '',
    view: { start: 0, count: 120 }, scale: null, layout: null,
    ind: { ma: true, maP: [5, 10, 20, 60], ema: false, emaP: [5, 14, 60],
      boll: false, bollN: 20, bollK: 2, vol: true, volMa: true,
      macd: true, macdP: [12, 26, 9] },
    calc: null, drawings: [], draft: null, hover: null, selected: -1,
    activeTool: 'cursor', magnet: 'off', drag: null, textInput: null,
    loading: false, reqSeq: 0, navSeq: 0, error: '', note: '',
    W: 800, H: 500, dpr: 1, raf: 0, ro: null, cleanup: [],
  };

  // ── 顶部工具条 ──
  const searchInput = h('input', { type: 'text', placeholder: '搜索代码 / 名称，如 600519 或 茅台',
    value: S.symbol, style: { width: '210px', padding: '5px 9px', borderRadius: '5px',
      border: '1px solid ' + T.border, background: T.panel2, color: T.text, outline: 'none' } });
  const suggestBox = h('div', { style: { position: 'absolute', top: '30px', left: '0', zIndex: 60,
    background: T.panel, border: '1px solid ' + T.border, borderRadius: '6px',
    minWidth: '250px', maxHeight: '280px', overflow: 'auto', display: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.5)' } });
  const searchWrap = h('div', { style: { position: 'relative', display: 'inline-block' } }, searchInput, suggestBox);

  const tfBox = h('span', { style: { display: 'inline-flex', gap: '2px', marginLeft: '10px' } });
  const tfBtns = {};
  for (const tf of TFS) {
    const b = h('button', { text: tf.label, style: btnStyle(), onclick: () => selectTf(tf) });
    tfBtns[tf.id] = b; tfBox.appendChild(b);
  }

  const magnetSel = h('select', { style: selStyle(), onchange: (e) => { S.magnet = e.target.value; } },
    ...['off', 'weak', 'strong'].map((m) => h('option', { value: m, text: '磁吸 ' + ({ off: '关', weak: '弱', strong: '强' })[m] })));

  const saveBtn = h('button', { text: '保存', title: '保存画线到本机', style: btnStyle(), onclick: saveDrawings });
  const loadBtn = h('button', { text: '载入', title: '载入已保存画线', style: btnStyle(), onclick: () => { loadDrawings(true); } });
  const clearBtn = h('button', { text: '清空', title: '清空画线', style: btnStyle(), onclick: () => { S.drawings = []; S.selected = -1; persist(); draw(); } });
  const fitBtn = h('button', { text: '适应', title: '显示全部', style: btnStyle(), onclick: fitAll });

  const quote = h('span', { style: { marginLeft: 'auto', display: 'inline-flex', gap: '8px', alignItems: 'baseline', fontSize: '13px' } });
  const header = h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 10px',
    borderBottom: '1px solid ' + T.border, background: T.panel, flexShrink: '0', flexWrap: 'wrap' } },
    h('span', { text: 'K 线绘图', style: { color: T.muted, fontWeight: '600', marginRight: '4px' } }),
    searchWrap, tfBox, magnetSel, saveBtn, loadBtn, clearBtn, fitBtn, quote);

  // ── 左侧: 细图标列 ──
  const quickCol = h('div', { style: { width: '38px', flexShrink: '0', background: T.panel,
    borderRight: '1px solid ' + T.border, display: 'flex', flexDirection: 'column', alignItems: 'center',
    paddingTop: '6px', gap: '2px', overflowY: 'auto' } });
  const quickBtns = {};
  for (const id of QUICK) {
    const t = TOOL_BY_ID[id];
    const b = h('button', { text: t.icon, title: t.label, style: Object.assign(iconBtn(), {}),
      onclick: () => { if (id === 'clear') { S.drawings = []; persist(); draw(); } else selectTool(id); } });
    quickBtns[id] = b; quickCol.appendChild(b);
  }
  quickCol.appendChild(h('div', { style: { flex: '1' } }));
  const panelToggle = h('button', { text: '☰', title: '展开/收起画线工具', style: iconBtn(),
    onclick: () => togglePanel() });
  quickCol.appendChild(panelToggle);

  // ── 左侧: 画线工具面板 ──
  const toolSearch = h('input', { type: 'text', placeholder: '搜索工具...', style: {
    width: '100%', boxSizing: 'border-box', padding: '6px 9px', borderRadius: '5px',
    border: '1px solid ' + T.border, background: T.panel2, color: T.text, outline: 'none' } });
  const toolList = h('div', { style: { flex: '1', overflowY: 'auto', padding: '4px 6px 10px' } });
  const toolPanel = h('div', { style: { width: '238px', flexShrink: '0', background: T.panel,
    borderRight: '1px solid ' + T.border, display: 'flex', flexDirection: 'column' } },
    h('div', { style: { padding: '8px 10px', borderBottom: '1px solid ' + T.border,
      display: 'flex', alignItems: 'center', gap: '6px' } },
      h('span', { text: '画线工具', style: { fontWeight: '600', color: T.text } }),
      h('span', { text: '✕', title: '收起', style: { marginLeft: 'auto', cursor: 'pointer', color: T.muted },
        onclick: () => togglePanel(false) })),
    h('div', { style: { padding: '8px 10px 4px' } }, toolSearch), toolList);
  let panelOpen = true;
  function togglePanel(force) {
    panelOpen = typeof force === 'boolean' ? force : !panelOpen;
    toolPanel.style.display = panelOpen ? 'flex' : 'none';
  }
  const toolBtns = {};
  function renderToolList(q) {
    q = (q || '').trim().toLowerCase();
    toolList.innerHTML = '';
    for (const g of TOOL_GROUPS) {
      const items = g.tools.filter((t) => !q || t.label.toLowerCase().includes(q) || t.id.includes(q));
      if (!items.length) continue;
      toolList.appendChild(h('div', { text: g.name, style: { color: T.dim, fontSize: '11px',
        padding: '8px 4px 4px', letterSpacing: '.5px' } }));
      const grid = h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' } });
      for (const t of items) {
        const b = h('button', { text: t.label, title: t.label, style: Object.assign(toolBtn(), {}),
          onclick: () => { if (t.id === 'clear') { S.drawings = []; persist(); draw(); } else selectTool(t.id); } });
        toolBtns[t.id] = b; grid.appendChild(b);
      }
      toolList.appendChild(grid);
    }
    highlightTool();
  }
  toolSearch.addEventListener('input', () => renderToolList(toolSearch.value));

  // ── 右侧: 指标面板 ──
  const indPanel = buildIndicatorPanel();

  // ── 中间图表区 ──
  const canvas = h('canvas', { style: { display: 'block', position: 'absolute', left: '0', top: '0', cursor: 'crosshair' } });
  const canvasBox = h('div', { style: { flex: '1 1 auto', position: 'relative', minHeight: '0', overflow: 'hidden' } }, canvas);
  const textBox = h('input', { type: 'text', placeholder: '输入文字后回车', style: { position: 'absolute',
    display: 'none', zIndex: 20, padding: '4px 6px', borderRadius: '4px', border: '1px solid ' + T.accent,
    background: T.panel2, color: T.text, outline: 'none', minWidth: '140px' } });
  canvasBox.appendChild(textBox);

  const status = h('div', { style: { padding: '4px 10px', borderTop: '1px solid ' + T.border,
    background: T.panel, color: T.muted, fontSize: '11px', flexShrink: '0' } });

  const body = h('div', { style: { display: 'flex', flex: '1 1 auto', minHeight: '0' } },
    quickCol, toolPanel, canvasBox, indPanel);
  root.appendChild(header); root.appendChild(body); root.appendChild(status);

  function btnStyle() { return { padding: '5px 9px', borderRadius: '5px', border: '1px solid ' + T.border,
    background: T.panel2, color: T.text, cursor: 'pointer', fontSize: '12px' }; }
  function selStyle() { return { padding: '5px 6px', borderRadius: '5px', border: '1px solid ' + T.border,
    background: T.panel2, color: T.text, fontSize: '12px', cursor: 'pointer' }; }
  function iconBtn() { return { width: '30px', height: '28px', borderRadius: '5px', border: '1px solid transparent',
    background: 'transparent', color: T.muted, cursor: 'pointer', fontSize: '15px', flexShrink: '0' }; }
  function toolBtn() { return { padding: '5px 4px', borderRadius: '4px', border: '1px solid transparent',
    background: 'transparent', color: T.text, cursor: 'pointer', fontSize: '11px', textAlign: 'left',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }; }

  // ── 指标面板构建 ──
  function buildIndicatorPanel() {
    const p = h('div', { style: { width: '224px', flexShrink: '0', background: T.panel,
      borderLeft: '1px solid ' + T.border, overflowY: 'auto', padding: '0 0 16px' } });
    p.appendChild(h('div', { style: { padding: '9px 12px', borderBottom: '1px solid ' + T.border,
      display: 'flex', gap: '14px' } },
      h('span', { text: '主图', style: { color: T.accent, fontWeight: '600', borderBottom: '2px solid ' + T.accent, paddingBottom: '4px' } }),
      h('span', { text: '副图', style: { color: T.muted } })));

    const section = (title) => h('div', { style: { padding: '10px 12px 4px', borderBottom: '1px solid ' + T.border } },
      h('div', { text: title, style: { color: T.muted, fontSize: '11px', marginBottom: '8px' } }));
    const row = (label, color, checked, onToggle, inputs) => {
      const cb = h('input', { type: 'checkbox' }); cb.checked = checked;
      cb.addEventListener('change', () => onToggle(cb.checked));
      return h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' } },
        cb, h('span', { style: { width: '8px', height: '8px', borderRadius: '2px', background: color, flexShrink: '0' } }),
        h('span', { text: label, style: { fontSize: '12px' } }), ...(inputs || []));
    };
    const num = (v, min, max, onCh) => {
      const i = h('input', { type: 'number', value: String(v), min: String(min), max: String(max),
        style: { width: '38px', padding: '3px 4px', borderRadius: '4px', border: '1px solid ' + T.border,
          background: T.panel2, color: T.text, fontSize: '11px', textAlign: 'center' } });
      i.addEventListener('change', () => onCh(clamp(parseInt(i.value, 10) || v, min, max)));
      return i;
    };

    // 主图叠加
    const s1 = section('主图叠加');
    const maInputs = S.ind.maP.map((v, i) => num(v, 2, 250, (nv) => { S.ind.maP[i] = nv; recompute(); }));
    s1.appendChild(row('均线 MA', T.ma[0], S.ind.ma, (c) => { S.ind.ma = c; recompute(); },
      [h('span', { style: { width: '100%' } }), ...maInputs]));
    const emaInputs = S.ind.emaP.map((v, i) => num(v, 2, 250, (nv) => { S.ind.emaP[i] = nv; recompute(); }));
    s1.appendChild(row('指数 EMA', T.ema[0], S.ind.ema, (c) => { S.ind.ema = c; recompute(); },
      [h('span', { style: { width: '100%' } }), ...emaInputs]));
    s1.appendChild(row('布林带 BOLL', T.boll, S.ind.boll, (c) => { S.ind.boll = c; recompute(); },
      [num(S.ind.bollN, 2, 200, (nv) => { S.ind.bollN = nv; recompute(); }),
       num(S.ind.bollK, 1, 6, (nv) => { S.ind.bollK = nv; recompute(); })]));
    p.appendChild(s1);

    // 副图
    const s2 = section('副图指标');
    s2.appendChild(row('成交量 VOL', T.up, S.ind.vol, (c) => { S.ind.vol = c; draw(); }));
    s2.appendChild(row('量均线', T.volMa[0], S.ind.volMa, (c) => { S.ind.volMa = c; draw(); }));
    const macdInputs = S.ind.macdP.map((v, i) => num(v, 1, 200, (nv) => { S.ind.macdP[i] = nv; recompute(); }));
    s2.appendChild(row('MACD', T.dif, S.ind.macd, (c) => { S.ind.macd = c; recompute(); },
      [h('span', { style: { width: '100%' } }), ...macdInputs]));
    p.appendChild(s2);

    // 图例 / 说明
    const s3 = section('图例');
    for (const [c, t] of [[T.up, '上涨 / 阳线'], [T.down, '下跌 / 阴线'],
      [T.ma[0], 'MA5'], [T.ma[1], 'MA10'], [T.ma[2], 'MA20'], [T.draw, '画线 / 标注']]) {
      s3.appendChild(h('div', { style: { display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' } },
        h('span', { style: { width: '12px', height: '3px', background: c, borderRadius: '2px' } }),
        h('span', { text: t, style: { fontSize: '11px', color: T.muted } })));
    }
    p.appendChild(s3);
    p.appendChild(h('div', { style: { padding: '10px 12px', color: T.dim, fontSize: '10px', lineHeight: '1.6' } },
      '滚轮缩放 · 拖拽平移 · 双击适应 · 画线自动保存于本机 · 数据来自本地 K 线接口'));
    return p;
  }

  // ── 尺寸 / 布局 ──
  const ctx = canvas.getContext('2d');
  function resize() {
    const r = canvasBox.getBoundingClientRect();
    S.W = Math.max(320, Math.floor(r.width)); S.H = Math.max(240, Math.floor(r.height));
    S.dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(S.W * S.dpr); canvas.height = Math.floor(S.H * S.dpr);
    canvas.style.width = S.W + 'px'; canvas.style.height = S.H + 'px';
    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    computeLayout(); draw();
  }
  function computeLayout() {
    const AX = 62, TH = 22, GAP = 7;
    const plotW = S.W - AX, plotH = S.H - TH;
    const usable = plotH - GAP * 2;
    const mainH = usable * 0.60, volH = usable * 0.18, macdH = usable * 0.22;
    S.layout = {
      AX, TH, GAP, plotW, plotH,
      main: { x: 0, y: 0, w: plotW, h: mainH },
      vol: { x: 0, y: mainH + GAP, w: plotW, h: volH },
      macd: { x: 0, y: mainH + GAP + volH + GAP, w: plotW, h: macdH },
    };
  }
  S.ro = new ResizeObserver(resize); S.ro.observe(canvasBox);
  S.cleanup.push(() => S.ro.disconnect());

  // ── 坐标换算 ──
  const barW = () => S.layout.plotW / S.view.count;
  const iToX = (i) => (i - S.view.start + 0.5) * barW();
  const xToI = (x) => x / barW() - 0.5 + S.view.start;
  function yToPrice(pane, y) {
    const sc = S.scale[pane];
    return sc.lo + (pane === 'main' ? (S.layout.main.y + S.layout.main.h - y) / S.layout.main.h
      : (S.layout[pane].y + S.layout[pane].h - y) / S.layout[pane].h) * (sc.hi - sc.lo);
  }
  function pToY(pane, p) {
    const sc = S.scale[pane], L = S.layout[pane];
    return L.y + L.h - (p - sc.lo) / (sc.hi - sc.lo) * L.h;
  }
  const P = (pt) => ({ x: iToX(pt.i), y: pToY('main', pt.p) });

  // ── 指标计算 ──
  function recompute() {
    if (!S.bars.length) { S.calc = null; draw(); return; }
    const closes = S.bars.map((b) => b.close), vols = S.bars.map((b) => b.volume || 0);
    const I = S.ind;
    S.calc = {
      ma: I.maP.map((p) => smaArr(closes, p)),
      ema: I.emaP.map((p) => emaArr(closes, p)),
      boll: I.boll ? bollArr(closes, I.bollN, I.bollK) : null,
      volMa: [smaArr(vols, 5), smaArr(vols, 10)],
      macd: I.macd ? macdArr(closes, I.macdP[0], I.macdP[1], I.macdP[2]) : null,
    };
    draw();
  }

  // ── 绘制 ──
  function scheduleDraw() { if (!S.raf) S.raf = requestAnimationFrame(() => { S.raf = 0; draw(); }); }

  function draw() {
    ctx.clearRect(0, 0, S.W, S.H);
    ctx.fillStyle = T.bg; ctx.fillRect(0, 0, S.W, S.H);
    if (!S.layout) computeLayout();
    const L = S.layout;
    if (!S.bars.length) {
      const msg = S.error || '无数据 · 请搜索标的选择，或切换到日 K（本地分钟线可能尚未同步）';
      ctx.fillStyle = T.muted; ctx.font = '13px system-ui'; ctx.textAlign = 'center';
      const maxW = Math.max(200, Math.min(L.plotW - 40, 900));
      const lines = []; let line = '';
      for (const ch of String(msg)) {
        if (ctx.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch; }
        else line += ch;
      }
      if (line) lines.push(line);
      const y0 = S.H / 2 - lines.length * 9;
      lines.forEach((ln, i) => ctx.fillText(ln, L.plotW / 2, y0 + i * 18));
      ctx.fillStyle = T.dim; ctx.font = '11px system-ui';
      ctx.fillText('数据来源：/api/kline/* （本地）', L.plotW / 2, y0 + lines.length * 18 + 8);
      ctx.textAlign = 'left';
      status.textContent = S.error || '无数据';
      return;
    }

    const start = clamp(Math.round(S.view.start), 0, Math.max(0, S.bars.length - 1));
    const end = Math.min(S.bars.length, start + S.view.count);
    const vis = S.bars.slice(start, end);
    S.view.start = start;

    // 主图量程
    let lo = Infinity, hi = -Infinity;
    for (const b of vis) { lo = Math.min(lo, b.low); hi = Math.max(hi, b.high); }
    if (S.calc && S.ind.ma) for (const arr of S.calc.ma) for (let i = start; i < end; i++) {
      const v = arr[i]; if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    }
    if (S.calc && S.ind.ema) for (const arr of S.calc.ema) for (let i = start; i < end; i++) {
      const v = arr[i]; if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    }
    if (S.calc && S.calc.boll) for (let i = start; i < end; i++) {
      for (const v of [S.calc.boll.up[i], S.calc.boll.lo[i]]) if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    }
    if (!isFinite(lo) || !isFinite(hi)) { lo = 0; hi = 1; }
    const pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad;

    let vmax = 0; for (let i = start; i < end; i++) vmax = Math.max(vmax, S.bars[i].volume || 0);
    if (S.calc && S.ind.volMa) for (let i = start; i < end; i++)
      for (const a of S.calc.volMa) if (isFinite(a[i])) vmax = Math.max(vmax, a[i]);
    vmax = vmax * 1.12 || 1;

    let mmax = 0;
    if (S.calc && S.calc.macd) {
      const { dif, dea, hist } = S.calc.macd;
      for (let i = start; i < end; i++) for (const v of [dif[i], dea[i], hist[i]]) if (isFinite(v)) mmax = Math.max(mmax, Math.abs(v));
    }
    mmax = mmax * 1.2 || 1;
    S.scale = { main: { lo, hi }, vol: { lo: 0, hi: vmax }, macd: { lo: -mmax, hi: mmax } };

    // 网格与分隔
    ctx.strokeStyle = T.grid; ctx.lineWidth = 1;
    for (const key of ['main', 'vol', 'macd']) {
      const pane = L[key];
      ctx.strokeRect(pane.x + 0.5, pane.y + 0.5, pane.w - 1, pane.h - 1);
      ctx.setLineDash([2, 4]);
      for (let k = 1; k <= 4; k++) {
        const y = Math.round(pane.y + pane.h * k / 5) + 0.5;
        ctx.beginPath(); ctx.moveTo(pane.x, y); ctx.lineTo(pane.x + pane.w, y); ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    // 垂直网格 + 时间轴
    const step = Math.max(1, Math.floor(S.view.count / 7));
    ctx.textAlign = 'center'; ctx.font = '10px system-ui';
    for (let i = start; i < end; i++) {
      if ((i - start) % step !== 0) continue;
      const x = Math.round(iToX(i)) + 0.5;
      ctx.strokeStyle = T.grid; ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, L.plotH); ctx.stroke(); ctx.setLineDash([]);
      const t = String(S.bars[i].t);
      const label = t.length > 10 ? t.slice(5, 16) : t.slice(5);
      ctx.fillStyle = T.dim; ctx.fillText(label, x, S.H - 6);
      ctx.strokeStyle = T.grid;
      ctx.beginPath(); ctx.moveTo(x, L.plotH); ctx.lineTo(x, L.plotH + 4); ctx.stroke();
    }
    ctx.textAlign = 'left';

    // 右轴刻度
    ctx.font = '10px system-ui';
    for (const key of ['main', 'vol', 'macd']) {
      const pane = L[key], sc = S.scale[key];
      const ticks = key === 'vol' ? 2 : 4;
      for (let k = 0; k <= ticks; k++) {
        const v = sc.lo + (sc.hi - sc.lo) * k / ticks;
        const y = pane.y + pane.h - pane.h * k / ticks;
        ctx.fillStyle = T.dim;
        ctx.fillText(key === 'vol' ? f0(v) : f2(v), L.plotW + 5, clamp(y + 3, pane.y + 10, pane.y + pane.h - 2));
      }
    }
    ctx.strokeStyle = T.border;
    ctx.beginPath(); ctx.moveTo(L.plotW + 0.5, 0); ctx.lineTo(L.plotW + 0.5, S.H); ctx.stroke();

    // ── 主图 K 线 ──
    const bw = barW(), cw = Math.max(1, Math.min(18, bw * 0.68));
    ctx.save(); ctx.beginPath(); ctx.rect(L.main.x, L.main.y, L.main.w, L.main.h); ctx.clip();
    for (let i = start; i < end; i++) {
      const b = S.bars[i], x = iToX(i);
      const rising = b.close >= b.open;
      const col = rising ? T.up : T.down;
      const yo = pToY('main', b.open), yc = pToY('main', b.close);
      const yh = pToY('main', b.high), yl = pToY('main', b.low);
      ctx.strokeStyle = col; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Math.round(x) + 0.5, yh); ctx.lineTo(Math.round(x) + 0.5, yl); ctx.stroke();
      ctx.fillStyle = col;
      const top = Math.min(yo, yc), hgt = Math.max(1, Math.abs(yc - yo));
      ctx.fillRect(x - cw / 2, top, cw, hgt);
    }
    // 指标线
    const line = (arr, color, width, dash) => {
      ctx.strokeStyle = color; ctx.lineWidth = width || 1.2; ctx.setLineDash(dash || []);
      ctx.beginPath(); let started = false;
      for (let i = start; i < end; i++) {
        const v = arr[i]; if (!isFinite(v)) { started = false; continue; }
        const x = iToX(i), y = pToY('main', v);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.setLineDash([]);
    };
    if (S.calc && S.ind.ma) S.calc.ma.forEach((a, k) => line(a, T.ma[k % T.ma.length]));
    if (S.calc && S.ind.ema) S.calc.ema.forEach((a, k) => line(a, T.ema[k % T.ema.length], 1.1, [4, 3]));
    if (S.calc && S.calc.boll) {
      line(S.calc.boll.up, T.boll, 1, [3, 3]); line(S.calc.boll.mid, T.boll, 1);
      line(S.calc.boll.lo, T.boll, 1, [3, 3]);
    }
    ctx.restore();

    // ── 成交量副图 ──
    if (S.ind.vol) {
      ctx.save(); ctx.beginPath(); ctx.rect(L.vol.x, L.vol.y, L.vol.w, L.vol.h); ctx.clip();
      for (let i = start; i < end; i++) {
        const b = S.bars[i], x = iToX(i), v = b.volume || 0;
        const y = pToY('vol', v), base = pToY('vol', 0);
        ctx.fillStyle = b.close >= b.open ? 'rgba(242,54,69,.62)' : 'rgba(14,203,129,.62)';
        ctx.fillRect(x - cw / 2, y, cw, Math.max(1, base - y));
      }
      if (S.calc && S.ind.volMa) {
        S.calc.volMa.forEach((a, k) => {
          ctx.strokeStyle = T.volMa[k]; ctx.lineWidth = 1; ctx.beginPath(); let st = false;
          for (let i = start; i < end; i++) {
            if (!isFinite(a[i])) continue;
            const x = iToX(i), y = pToY('vol', a[i]);
            if (!st) { ctx.moveTo(x, y); st = true; } else ctx.lineTo(x, y);
          }
          ctx.stroke();
        });
      }
      ctx.restore();
      ctx.fillStyle = T.dim; ctx.font = '10px system-ui';
      ctx.fillText('VOL', L.vol.x + 6, L.vol.y + 12);
    }

    // ── MACD 副图 ──
    if (S.calc && S.calc.macd && S.ind.macd) {
      const { dif, dea, hist } = S.calc.macd;
      ctx.save(); ctx.beginPath(); ctx.rect(L.macd.x, L.macd.y, L.macd.w, L.macd.h); ctx.clip();
      const zero = pToY('macd', 0);
      ctx.strokeStyle = T.border; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(L.macd.x, zero); ctx.lineTo(L.macd.x + L.macd.w, zero); ctx.stroke();
      ctx.setLineDash([]);
      for (let i = start; i < end; i++) {
        const v = hist[i]; if (!isFinite(v)) continue;
        const x = iToX(i), y = pToY('macd', v);
        ctx.fillStyle = v >= 0 ? 'rgba(242,54,69,.75)' : 'rgba(14,203,129,.75)';
        ctx.fillRect(x - cw / 2, Math.min(y, zero), cw, Math.max(1, Math.abs(y - zero)));
      }
      for (const [arr, col] of [[dif, T.dif], [dea, T.dea]]) {
        ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.beginPath(); let st = false;
        for (let i = start; i < end; i++) {
          const v = arr[i]; if (!isFinite(v)) continue;
          const x = iToX(i), y = pToY('macd', v);
          if (!st) { ctx.moveTo(x, y); st = true; } else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = T.dim; ctx.font = '10px system-ui';
      ctx.fillText(`MACD(${S.ind.macdP.join(',')})`, L.macd.x + 6, L.macd.y + 12);
    }

    // ── 现价线 + 标签 ──
    const last = S.bars[end - 1];
    if (last) {
      const y = pToY('main', last.close);
      if (y > L.main.y && y < L.main.y + L.main.h) {
        ctx.strokeStyle = last.close >= last.open ? 'rgba(242,54,69,.55)' : 'rgba(14,203,129,.55)';
        ctx.setLineDash([4, 4]); ctx.beginPath();
        ctx.moveTo(0, y); ctx.lineTo(L.plotW, y); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.fillStyle = last.close >= last.open ? T.up : T.down;
      ctx.fillRect(L.plotW + 1, clamp(y - 9, 0, S.H - 18), L.AX - 2, 18);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui';
      ctx.fillText(f2(last.close), L.plotW + 5, clamp(y + 4, 12, S.H - 4));
    }

    // ── 画线 (clip 主图) ──
    ctx.save(); ctx.beginPath(); ctx.rect(L.main.x, L.main.y, L.main.w, L.main.h); ctx.clip();
    S.drawings.forEach((d, idx) => renderDrawing(d, idx === S.selected));
    if (S.draft) renderDrawing(S.draft, false, true);
    ctx.restore();

    // ── 十字光标 + OHLC ──
    if (S.hover && S.hover.x >= 0 && S.hover.x <= L.plotW && S.hover.y >= 0 && S.hover.y <= L.plotH) {
      const hx = Math.round(S.hover.x) + 0.5, hy = Math.round(S.hover.y) + 0.5;
      ctx.strokeStyle = T.cross; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(hx, 0); ctx.lineTo(hx, L.plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(L.plotW, hy); ctx.stroke();
      ctx.setLineDash([]);
      // 右轴价格
      const paneKey = S.hover.y < L.main.y + L.main.h ? 'main'
        : (S.hover.y < L.macd.y ? 'vol' : 'macd');
      const pv = yToPrice(paneKey, S.hover.y);
      ctx.fillStyle = '#2a3852'; ctx.fillRect(L.plotW + 1, clamp(hy - 9, 0, S.H - 18), L.AX - 2, 18);
      ctx.fillStyle = '#fff'; ctx.font = '10px system-ui';
      ctx.fillText(paneKey === 'vol' ? f0(pv) : f2(pv), L.plotW + 5, clamp(hy + 3, 11, S.H - 5));
      // 底部时间
      const ii = clamp(Math.round(xToI(S.hover.x)), start, end - 1);
      const t = String(S.bars[ii] ? S.bars[ii].t : '');
      const tw = Math.max(58, t.length * 6 + 12);
      ctx.fillStyle = '#2a3852'; ctx.fillRect(clamp(iToX(ii) - tw / 2, 0, L.plotW - tw), L.plotH + 1, tw, 17);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '10px system-ui';
      ctx.fillText(t.length > 16 ? t.slice(5, 16) : t, clamp(iToX(ii), tw / 2, L.plotW - tw / 2), L.plotH + 13);
      ctx.textAlign = 'left';
      // OHLC 信息条
      const b = S.bars[ii];
      if (b) {
        const prev = S.bars[ii - 1];
        const chg = prev ? (b.close - prev.close) / prev.close * 100 : 0;
        const info = `开 ${f2(b.open)}  高 ${f2(b.high)}  低 ${f2(b.low)}  收 ${f2(b.close)}  ` +
          `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%  量 ${f0(b.volume)}`;
        ctx.font = '11px system-ui';
        const w = ctx.measureText(info).width + 14;
        ctx.fillStyle = 'rgba(11,18,32,.85)'; ctx.fillRect(6, 4, w, 20);
        ctx.fillStyle = T.text; ctx.fillText(info, 12, 18);
      }
    }

    // 状态
    const toolName = TOOL_BY_ID[S.activeTool] ? TOOL_BY_ID[S.activeTool].label : '十字光标';
    status.textContent = `${S.symbol} ${S.name} · ${S.tf.label}K · 共 ${S.bars.length} 根 / 显示 ${vis.length} 根 · ` +
      `画线 ${S.drawings.length} 个 · 当前工具：${toolName}` + (S.note ? ' · ' + S.note : '');
  }

  // ── 画线渲染 ────────────────────────────────────────────────────────────
  function renderDrawing(d, selected, isDraft) {
    const tool = TOOL_BY_ID[d.type];
    const need = Math.max(1, tool ? (tool.n || 1) : 2);
    // 已确认点 + 预览点; 不足所需点数时用最后一点补齐, 保证草稿预览不越界
    const src = (d.pts || []).concat(d.preview ? [d.preview] : []);
    if (!src.length) return;
    const pts = src.slice();
    while (pts.length < need) pts.push(pts[pts.length - 1]);
    const color = d.color || T.draw;
    ctx.save();
    ctx.globalAlpha = isDraft ? 0.75 : 1;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = selected ? 2.2 : 1.5;
    ctx.setLineDash(isDraft ? [4, 3] : []);
    const A = pts.map(P);
    const a = A[0], b = A[1] || a, c = A[2] || b;

    const seg = (p, q, dash) => {
      ctx.setLineDash(dash || (isDraft ? [4, 3] : []));
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      ctx.setLineDash(isDraft ? [4, 3] : []);
    };
    const infinite = (p, q, mode) => {
      // mode: 0 线段, 1 向右延长, 2 双向延长
      const dx = q.x - p.x, dy = q.y - p.y;
      if (Math.abs(dx) < 1e-6) { seg({ x: p.x, y: 0 }, { x: p.x, y: S.H }); return; }
      let x1 = p.x, x2 = q.x;
      const at = (x) => ({ x, y: p.y + (x - p.x) / dx * dy });
      if (mode === 1) x2 = S.layout.plotW + 2000;
      if (mode === 2) { x1 = -2000; x2 = S.layout.plotW + 2000; }
      seg(at(x1), at(x2));
    };
    const rect = (p, q, fill) => {
      const x = Math.min(p.x, q.x), y = Math.min(p.y, q.y);
      const w = Math.abs(q.x - p.x), h = Math.abs(q.y - p.y);
      if (fill) { ctx.globalAlpha = isDraft ? 0.06 : 0.10; ctx.fillRect(x, y, w, h); ctx.globalAlpha = isDraft ? 0.75 : 1; }
      ctx.strokeRect(x, y, w, h);
    };
    const ellipse = (p, q) => {
      const cx = (p.x + q.x) / 2, cy = (p.y + q.y) / 2;
      const rx = Math.max(1, Math.abs(q.x - p.x) / 2), ry = Math.max(1, Math.abs(q.y - p.y) / 2);
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    };
    const poly = (arr, close) => {
      if (arr.length < 2) return;
      ctx.beginPath(); ctx.moveTo(arr[0].x, arr[0].y);
      for (let i = 1; i < arr.length; i++) ctx.lineTo(arr[i].x, arr[i].y);
      if (close) ctx.closePath(); ctx.stroke();
    };
    const arrow = (p, q) => {
      seg(p, q);
      const ang = Math.atan2(q.y - p.y, q.x - p.x), s = 10;
      ctx.beginPath(); ctx.moveTo(q.x, q.y);
      ctx.lineTo(q.x - s * Math.cos(ang - 0.42), q.y - s * Math.sin(ang - 0.42));
      ctx.lineTo(q.x - s * Math.cos(ang + 0.42), q.y - s * Math.sin(ang + 0.42));
      ctx.closePath(); ctx.fill();
    };
    const tag = (x, y, text, bg) => {
      ctx.font = '10px system-ui';
      const w = ctx.measureText(String(text)).width + 10;
      ctx.setLineDash([]); ctx.globalAlpha = isDraft ? 0.75 : 1;
      ctx.fillStyle = bg || 'rgba(11,18,32,.9)'; ctx.fillRect(x, y - 12, w, 15);
      ctx.fillStyle = color; ctx.fillText(String(text), x + 5, y - 1);
      ctx.fillStyle = color; ctx.setLineDash(isDraft ? [4, 3] : []);
    };
    const hline = (y, label) => {
      ctx.setLineDash(isDraft ? [4, 3] : []);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S.layout.plotW, y); ctx.stroke();
      ctx.setLineDash([]);
      if (label) tag(Math.min(a.x + 6, S.layout.plotW - 70), y - 2, label);
      ctx.setLineDash(isDraft ? [4, 3] : []);
    };
    const vline = (x, label) => {
      ctx.setLineDash(isDraft ? [4, 3] : []);
      ctx.beginPath(); ctx.moveTo(x, S.layout.main.y); ctx.lineTo(x, S.layout.main.y + S.layout.main.h); ctx.stroke();
      ctx.setLineDash([]);
      if (label) tag(Math.min(x + 4, S.layout.plotW - 50), S.layout.main.y + 16, label);
      ctx.setLineDash(isDraft ? [4, 3] : []);
    };
    const fibLevels = (levels) => {
      const p1 = pts[0].p, p2 = pts[1].p, span = p2 - p1;
      levels.forEach((lv, k) => {
        const price = p1 + span * lv;
        const y = pToY('main', price);
        ctx.strokeStyle = k === 0 || k === levels.length - 1 ? color : 'rgba(255,183,77,.55)';
        hline(y, `${(lv * 100).toFixed(1)}%  ${f2(price)}`);
      });
      ctx.strokeStyle = color; seg(a, b, [2, 3]);
    };
    const fibTime = () => {
      const f = [0, 1, 2, 3, 5, 8, 13, 21];
      const x1 = a.x, dx = b.x - a.x;
      f.forEach((n) => {
        const x = x1 + dx * n / 8;
        ctx.strokeStyle = n === 0 ? color : 'rgba(255,183,77,.55)';
        vline(x, `F${n}`);
      });
      ctx.strokeStyle = color;
    };

    switch (d.type) {
      case 'trend-line': case 'segment': seg(a, b); break;
      case 'extended-line': infinite(a, b, 2); break;
      case 'ray': infinite(a, b, 1); break;
      case 'horizontal-line': hline(a.y, f2(pts[0].p)); break;
      case 'vertical-line': {
        const idx = clamp(Math.round(pts[0].i), 0, S.bars.length - 1);
        vline(a.x, String(S.bars[idx] ? S.bars[idx].t : '').slice(5)); break;
      }
      case 'arrow': arrow(a, b); break;
      case 'parallel-channel': {
        if (pts.length < 2) { seg(a, a); break; }
        infinite(a, b, 2);
        const dy = P(pts[2] || pts[1]).y - a.y;
        // 第二条线与主线斜率一致, 整体平移 dy
        infinite({ x: a.x, y: a.y + dy }, { x: b.x, y: b.y + dy }, 2);
        break;
      }
      case 'flat-channel': case 'rectangle': case 'vert-rectangle': rect(a, b, true); break;
      case 'triangle': case 'triangle-pattern': poly(A.slice(0, 3), true); break;
      case 'circle': {
        const r = Math.hypot(b.x - a.x, b.y - a.y);
        ctx.beginPath(); ctx.arc(a.x, a.y, Math.max(1, r), 0, Math.PI * 2); ctx.stroke(); break;
      }
      case 'ellipse': case 'fib-arc': ellipse(a, b); break;
      case 'arc': {
        ctx.beginPath(); ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2,
          Math.max(1, Math.abs(b.x - a.x) / 2), Math.max(1, Math.abs(b.y - a.y) / 2),
          0, 0, Math.PI); ctx.stroke(); break;
      }
      case 'hyperbola': {
        const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        const rx = Math.max(1, Math.abs(b.x - a.x) / 2), ry = Math.max(1, Math.abs(b.y - a.y) / 2);
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, Math.PI / 2, Math.PI * 1.5); ctx.stroke(); break;
      }
      case 'fib-retracement': fibLevels([0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]); break;
      case 'fib-extension': fibLevels([0, 0.618, 1, 1.618, 2.618]); break;
      case 'fib-channel': {
        fibLevels([0, 0.382, 0.5, 0.618, 1]);
        const span = pts[1].p - pts[0].p;
        ctx.strokeStyle = 'rgba(255,183,77,.5)';
        for (const lv of [0, 1]) {
          const price = pts[0].p + span * lv + span * 0.5;
          hline(pToY('main', price), null);
        }
        ctx.strokeStyle = color; break;
      }
      case 'fib-time': fibTime(); break;
      case 'fib-fan': case 'gann-fan': case 'gann-fan-alt': {
        const ratios = [0.236, 0.382, 0.5, 0.618, 0.786, 1];
        ctx.strokeStyle = 'rgba(255,183,77,.6)';
        for (const r of ratios) {
          const y = a.y + (b.y - a.y) * r;
          const x = a.x + (b.x - a.x);
          seg(a, { x: x + (b.x - a.x) * (1 - r), y });
        }
        ctx.strokeStyle = color; seg(a, b); break;
      }
      case 'fib-spiral': {
        const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        const rx = Math.abs(b.x - a.x) / 2 || 1, ry = Math.abs(b.y - a.y) / 2 || 1;
        ctx.beginPath();
        for (let i = 0; i <= 160; i++) {
          const ang = i / 160 * Math.PI * 4, rr = i / 160;
          const x = cx + Math.cos(ang) * rx * rr, y = cy + Math.sin(ang) * ry * rr;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke(); break;
      }
      case 'fib-wedge': {
        seg(a, b); seg(a, { x: b.x, y: a.y + (b.y - a.y) * 0.382 });
        seg(b, { x: b.x, y: a.y + (b.y - a.y) * 0.382 }); break;
      }
      case 'gann-box': {
        rect(a, b, false);
        ctx.strokeStyle = 'rgba(255,183,77,.45)';
        for (let k = 1; k <= 7; k++) {
          const f = k / 8;
          seg({ x: a.x + (b.x - a.x) * f, y: a.y }, { x: a.x + (b.x - a.x) * f, y: b.y });
          seg({ x: a.x, y: a.y + (b.y - a.y) * f }, { x: b.x, y: a.y + (b.y - a.y) * f });
        }
        ctx.strokeStyle = color; break;
      }
      case 'gann-grid': {
        ctx.strokeStyle = 'rgba(255,183,77,.45)';
        const dx = (b.x - a.x) || 30, dy = (b.y - a.y) || 30;
        for (let k = -8; k <= 12; k++) {
          seg({ x: a.x + dx * k, y: 0 }, { x: a.x + dx * k, y: S.layout.main.h });
          seg({ x: 0, y: a.y + dy * k }, { x: S.layout.plotW, y: a.y + dy * k });
        }
        ctx.strokeStyle = color; break;
      }
      case 'pitchfork': {
        infinite(a, b, 1);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const q = pts[2] || pts[1];
        const off = { x: P(q).x - mid.x, y: P(q).y - mid.y };
        seg({ x: a.x + off.x, y: a.y + off.y }, { x: b.x + off.x, y: b.y + off.y });
        seg({ x: a.x - off.x, y: a.y - off.y }, { x: b.x - off.x, y: b.y - off.y }); break;
      }
      case 'abcd': case 'three-waves': poly(A, false);
        A.forEach((p, i) => tag(p.x + 4, p.y - 4, 'ABCD'[i] || String(i + 1))); break;
      case 'head-shoulders': {
        poly(A, false);
        A.forEach((p, i) => tag(p.x + 4, p.y - 4, ['左肩', '头', '右肩'][i] || '')); break;
      }
      case 'price-range': {
        rect(a, b, true);
        const pct = pts[0].p ? (pts[1].p - pts[0].p) / pts[0].p * 100 : 0;
        tag(Math.min(a.x, b.x) + 4, Math.min(a.y, b.y) + 16,
          `${f2(Math.abs(pts[1].p - pts[0].p))}  ${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`); break;
      }
      case 'date-range': {
        vline(a.x, String(S.bars[clamp(Math.round(pts[0].i), 0, S.bars.length - 1)]?.t || '').slice(5));
        vline(b.x, String(S.bars[clamp(Math.round(pts[1].i), 0, S.bars.length - 1)]?.t || '').slice(5));
        const n = Math.abs(Math.round(pts[1].i - pts[0].i));
        tag((a.x + b.x) / 2, S.layout.main.y + 30, `${n} 根`); break;
      }
      case 'volume-profile': {
        rect(a, b, true);
        ctx.strokeStyle = 'rgba(255,183,77,.55)';
        const loP = Math.min(pts[0].p, pts[1].p), hiP = Math.max(pts[0].p, pts[1].p);
        for (let k = 1; k < 8; k++) {
          const price = loP + (hiP - loP) * k / 8;
          hline(pToY('main', price), null);
        }
        ctx.strokeStyle = color; break;
      }
      case 'anchored-vwap': {
        const i0 = clamp(Math.round(pts[0].i), 0, S.bars.length - 1);
        let pv = 0, vv = 0;
        ctx.strokeStyle = '#4dd0e1'; ctx.lineWidth = 1.6; ctx.beginPath(); let st = false;
        for (let i = i0; i < S.bars.length; i++) {
          const b = S.bars[i]; pv += ((b.high + b.low + b.close) / 3) * (b.volume || 1); vv += (b.volume || 1);
          const v = pv / vv, x = iToX(i), y = pToY('main', v);
          if (!st) { ctx.moveTo(x, y); st = true; } else ctx.lineTo(x, y);
        }
        ctx.stroke(); ctx.strokeStyle = color; ctx.lineWidth = selected ? 2.2 : 1.5; break;
      }
      case 'text': case 'note': case 'callout': case 'pin': case 'flag': {
        const txt = d.text || '';
        ctx.setLineDash([]); ctx.font = '12px system-ui';
        const w = Math.max(24, ctx.measureText(txt).width + 14);
        const bx = a.x, by = a.y - 20;
        if (d.type === 'pin' || d.type === 'flag') {
          ctx.beginPath(); ctx.arc(a.x, a.y, 4, 0, Math.PI * 2); ctx.fill();
          seg(a, { x: a.x, y: a.y - 20 });
        }
        ctx.fillStyle = d.type === 'callout' ? 'rgba(59,130,246,.22)' : 'rgba(11,18,32,.88)';
        ctx.fillRect(bx, by, w, 20);
        ctx.strokeStyle = color; ctx.strokeRect(bx, by, w, 20);
        ctx.fillStyle = '#fff'; ctx.fillText(txt, bx + 7, by + 14);
        ctx.fillStyle = color; break;
      }
      case 'brush': case 'highlighter': {
        ctx.lineWidth = d.type === 'highlighter' ? 12 : 2;
        ctx.globalAlpha = d.type === 'highlighter' ? 0.35 : 1;
        ctx.lineJoin = 'round'; ctx.lineCap = 'round'; poly(A, false);
        ctx.globalAlpha = 1; ctx.lineWidth = selected ? 2.2 : 1.5; break;
      }
      default: seg(a, b);
    }

    // 选中控制点
    if (selected && !isDraft) {
      ctx.setLineDash([]); ctx.fillStyle = '#fff'; ctx.strokeStyle = color;
      for (const p of A) { ctx.fillRect(p.x - 3, p.y - 3, 6, 6); ctx.strokeRect(p.x - 3, p.y - 3, 6, 6); }
    }
    ctx.restore();
  }

  // ── 交互 ────────────────────────────────────────────────────────────────
  function evPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function toData(x, y) {
    if (!S.scale || !S.bars.length) return { i: 0, p: 0 };
    let i = xToI(x);
    let p = yToPrice('main', y);
    if (S.magnet !== 'off' && S.bars.length) {
      const idx = clamp(Math.round(i), 0, S.bars.length - 1), b = S.bars[idx];
      const tol = (S.scale.main.hi - S.scale.main.lo) * (S.magnet === 'strong' ? 0.02 : 0.008);
      const cands = [b.high, b.low, b.open, b.close];
      let best = null, bd = tol;
      for (const v of cands) { const dd = Math.abs(v - p); if (dd < bd) { bd = dd; best = v; } }
      if (best != null) p = best;
    }
    return { i, p };
  }
  function nearestDrawing(x, y) {
    let best = -1, bd = 10;
    S.drawings.forEach((d, idx) => {
      for (const pt of (d.pts || [])) {
        const p = P(pt), dd = Math.hypot(p.x - x, p.y - y);
        if (dd < bd) { bd = dd; best = idx; }
      }
    });
    return best;
  }
  function finishDraft() {
    if (!S.draft) return;
    const d = S.draft; S.draft = null;
    const tool = TOOL_BY_ID[d.type];
    const need = Math.max(1, tool ? (tool.n || 1) : 2);
    const pts = (d.pts || []).slice();
    while (pts.length < need && pts.length) pts.push(pts[pts.length - 1]);
    if (pts.length) { S.drawings.push({ type: d.type, pts, text: d.text, color: T.draw }); persist(); }
    draw();
  }
  function selectTool(id) {
    S.activeTool = id; S.draft = null; S.selected = -1;
    canvas.style.cursor = id === 'cursor' ? 'crosshair' : (id === 'delete' ? 'not-allowed' : 'crosshair');
    highlightTool(); scheduleDraw();
  }
  function highlightTool() {
    for (const [id, b] of Object.entries(toolBtns)) {
      const on = id === S.activeTool;
      b.style.background = on ? 'rgba(59,130,246,.22)' : 'transparent';
      b.style.color = on ? '#9ec5ff' : T.text;
      b.style.borderColor = on ? T.accent : 'transparent';
    }
    for (const [id, b] of Object.entries(quickBtns)) {
      const on = id === S.activeTool;
      b.style.background = on ? 'rgba(59,130,246,.25)' : 'transparent';
      b.style.color = on ? '#9ec5ff' : T.muted;
    }
  }
  function askText(pt) {
    S.textInput = { pt };
    const p = evPosFromPt(pt);
    textBox.value = ''; textBox.style.display = 'block';
    textBox.style.left = clamp(p.x, 4, Math.max(4, S.W - 160)) + 'px';
    textBox.style.top = clamp(p.y - 24, 4, Math.max(4, S.H - 30)) + 'px';
    textBox.focus();
  }
  function evPosFromPt(pt) { const p = P(pt); return { x: p.x, y: p.y }; }
  function commitText() {
    if (!S.textInput) return;
    const t = textBox.value.trim(); textBox.style.display = 'none';
    if (t) { S.drawings.push({ type: S.activeTool, pts: [S.textInput.pt], text: t, color: T.draw }); persist(); }
    S.textInput = null; textBox.value = ''; draw();
  }
  textBox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commitText(); }
    else if (e.key === 'Escape') { textBox.style.display = 'none'; S.textInput = null; }
    e.stopPropagation();
  });
  textBox.addEventListener('blur', commitText);

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (!S.bars.length || !S.scale) return;
    const pos = evPos(e);
    if (pos.x > S.layout.plotW || pos.y > S.layout.plotH) return;
    const tool = TOOL_BY_ID[S.activeTool] || TOOL_BY_ID.cursor;
    if (tool.mode === 'delete') {
      const idx = nearestDrawing(pos.x, pos.y);
      if (idx >= 0) { S.drawings.splice(idx, 1); persist(); }
      draw(); return;
    }
    if (tool.mode === 'cursor') {
      S.selected = nearestDrawing(pos.x, pos.y);
      S.drag = { x: pos.x, start: S.view.start };
      draw(); return;
    }
    if (tool.mode === 'free') {
      S.draft = { type: tool.id, pts: [toData(pos.x, pos.y)], preview: null };
      S.drag = { free: true }; draw(); return;
    }
    const pt = toData(pos.x, pos.y);
    if (tool.mode === 'text') { askText(pt); return; }
    const need = Math.max(1, tool.n || 1);
    if (S.draft && S.draft.type === tool.id) {
      S.draft.pts.push(pt);
      S.draft.preview = null;
      if (S.draft.pts.length >= need) finishDraft();
      else draw();
    } else {
      S.draft = { type: tool.id, pts: [pt], preview: null };
      if (need <= 1) finishDraft();
      else draw();
    }
  });
  canvas.addEventListener('mousemove', (e) => {
    const pos = evPos(e);
    S.hover = pos;
    if (!S.bars.length || !S.scale) { scheduleDraw(); return; }
    if (S.drag && S.drag.free && S.draft) {
      const last = S.draft.pts[S.draft.pts.length - 1];
      const d = toData(pos.x, pos.y);
      if (Math.hypot(iToX(d.i) - iToX(last.i), pToY('main', d.p) - pToY('main', last.p)) > 3)
        S.draft.pts.push(d);
    } else if (S.drag && !S.drag.free) {
      const delta = Math.round((S.drag.x - pos.x) / barW());
      S.view.start = clamp(S.drag.start + delta, 0, Math.max(0, S.bars.length - 5));
    } else if (S.draft) {
      // 预览点与已确认点分离, 避免重复追加导致落点数错乱
      S.draft.preview = toData(pos.x, pos.y);
    }
    scheduleDraw();
  });
  const endDrag = () => {
    if (S.drag && S.drag.free && S.draft) finishDraft();
    S.drag = null;
  };
  canvas.addEventListener('mouseup', endDrag);
  canvas.addEventListener('mouseleave', () => { S.hover = null; endDrag(); scheduleDraw(); });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (!S.bars.length) return;
    const pos = evPos(e);
    const anchor = xToI(pos.x);
    const old = S.view.count;
    const next = clamp(Math.round(old * (e.deltaY > 0 ? 1.15 : 0.87)), 20, Math.max(20, S.bars.length));
    const ratio = (anchor - S.view.start) / old;
    S.view.count = next;
    S.view.start = clamp(Math.round(anchor - ratio * next), 0, Math.max(0, S.bars.length - next));
    scheduleDraw();
  }, { passive: false });
  canvas.addEventListener('dblclick', fitAll);
  canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); S.draft = null; draw(); });
  const onKey = (e) => {
    if (document.activeElement === textBox || document.activeElement === searchInput) return;
    if (e.key === 'Escape') { S.draft = null; S.selected = -1; draw(); }
    else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (S.selected >= 0) { S.drawings.splice(S.selected, 1); S.selected = -1; persist(); draw(); }
    } else if (e.key === 'f' || e.key === 'F') fitAll();
  };
  window.addEventListener('keydown', onKey);
  S.cleanup.push(() => window.removeEventListener('keydown', onKey));

  function fitAll() {
    if (!S.bars.length) return;
    S.view.count = Math.min(S.bars.length, 160);
    S.view.start = Math.max(0, S.bars.length - S.view.count);
    draw();
  }

  // ── 画线持久化 ──
  function persist() {
    try { localStorage.setItem(storeKey(S.symbol, S.tf.id), JSON.stringify(S.drawings)); } catch (e) { /* 忽略配额 */ }
  }
  function saveDrawings() {
    persist(); S.note = '已保存 ' + S.drawings.length + ' 个图形到本机'; draw();
    setTimeout(() => { S.note = ''; draw(); }, 2500);
  }
  function loadDrawings(manual) {
    try {
      const raw = localStorage.getItem(storeKey(S.symbol, S.tf.id));
      S.drawings = raw ? (JSON.parse(raw) || []) : [];
      if (manual) S.note = '已载入 ' + S.drawings.length + ' 个图形';
    } catch (e) { S.drawings = []; if (manual) S.note = '载入失败：数据损坏'; }
    draw();
    if (manual) setTimeout(() => { S.note = ''; draw(); }, 2500);
  }

  // ── 标的搜索 + symbol 规范化 ──
  // 后端 /api/kline/daily 只接受本地已收录的标准代码 (如 600519.SH)。
  // 纯数字 / 中文名直接请求会触发 TickFlow 外网回退, 被 SOURCE_POLICY_BLOCKED
  // 策略阻断并返回 502。故回车时先经搜索接口解析成标准代码并回显;
  // 解析不到则直接给提示, 不再发起注定 502 的 daily 请求。
  const STD_RE = /^(\d{6}|[A-Z0-9]+)\.(SH|SZ|BJ|HK|US)$/i;
  const isStandard = (s) => STD_RE.test(String(s || '').trim());

  async function errText(r) {
    let detail = '';
    try {
      const j = await r.json(), d = j && j.detail;
      detail = typeof d === 'string' ? d : (d ? JSON.stringify(d) : '');
    } catch (e) { /* 非 JSON 响应 */ }
    if (r.status === 502 && /SOURCE_POLICY_BLOCKED|TickFlow/i.test(detail)) {
      return '本地未收录该标的（外网回退已按策略禁用）：' + detail +
        '。请从搜索下拉选择本地已收录的标准代码，如 600519.SH';
    }
    return `接口 ${r.status}${detail ? '：' + detail : ''}`;
  }

  async function resolveSymbol(raw, seq) {
    const q = String(raw || '').trim();
    if (!q) return { symbol: null, reason: '请输入股票代码或名称' };
    if (isStandard(q)) return { symbol: q.toUpperCase() };
    try {
      const r = await fetch('/api/kline/instruments/search?q=' + encodeURIComponent(q) + '&limit=20', { credentials: 'same-origin' });
      if (r.ok) {
        const j = await r.json();
        if (seq !== S.navSeq) return { stale: true };
        const rows = j.results || [];
        const code6 = /^\d{6}$/.test(q) ? q : null;
        const pick = rows.find((x) => String(x.symbol).toUpperCase() === q.toUpperCase())
          || (code6 && rows.find((x) => String(x.symbol).slice(0, 6) === code6))
          || rows.find((x) => String(x.name || '').trim() === q)
          || rows[0];
        if (pick && pick.symbol) return { symbol: String(pick.symbol).toUpperCase(), name: pick.name || '' };
      }
    } catch (e) { /* 落到下方提示 */ }
    if (seq !== S.navSeq) return { stale: true };
    return { symbol: null, reason: `未识别「${q}」：本地没有匹配的标的。` +
      '请从搜索下拉选择标准代码（如 600519.SH / 000001.SZ）' };
  }

  async function goto(raw) {
    const seq = ++S.navSeq;
    suggestBox.style.display = 'none';
    S.note = '解析标的…'; draw();
    const res = await resolveSymbol(raw, seq);
    if (res.stale || seq !== S.navSeq) return;
    S.note = '';
    if (!res.symbol) { S.error = res.reason; S.bars = []; draw(); return; }
    S.symbol = res.symbol;
    searchInput.value = res.symbol;   // 回显实际使用的标准代码, 避免用户误判
    if (res.name) S.name = res.name;
    loadData();
  }

  let sugTimer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(sugTimer);
    const q = searchInput.value.trim();
    if (!q) { suggestBox.style.display = 'none'; return; }
    sugTimer = setTimeout(async () => {
      try {
        const r = await fetch('/api/kline/instruments/search?q=' + encodeURIComponent(q) + '&limit=20', { credentials: 'same-origin' });
        if (!r.ok) return;
        const j = await r.json();
        const rows = (j.results || []).slice(0, 14);
        suggestBox.innerHTML = '';
        if (!rows.length) { suggestBox.style.display = 'none'; return; }
        for (const it of rows) {
          suggestBox.appendChild(h('div', { text: `${it.symbol}  ${it.name || ''}`,
            style: { padding: '7px 10px', cursor: 'pointer', borderBottom: '1px solid ' + T.border, fontSize: '12px' },
            onmouseenter: (e) => { e.target.style.background = 'rgba(59,130,246,.18)'; },
            onmouseleave: (e) => { e.target.style.background = 'transparent'; },
            onclick: () => goto(it.symbol) }));
        }
        suggestBox.style.display = 'block';
      } catch (e) { /* 忽略 */ }
    }, 220);
  });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); goto(searchInput.value); }
  });
  const hideSug = (e) => { if (!searchWrap.contains(e.target)) suggestBox.style.display = 'none'; };
  document.addEventListener('click', hideSug);
  S.cleanup.push(() => document.removeEventListener('click', hideSug));

  // ── 周期切换 ──
  function selectTf(tf) {
    S.tf = tf;
    for (const [id, b] of Object.entries(tfBtns)) {
      const on = id === tf.id;
      b.style.background = on ? T.accent2 : T.panel2;
      b.style.color = on ? '#fff' : T.text;
      b.style.borderColor = on ? T.accent : T.border;
    }
    loadData();
  }

  // ── 数据加载 ──
  // 用请求序号替代 loading 拦截: 快速连切周期时只应用最后一次结果,
  // 避免旧请求后返回覆盖新周期的数据 (状态栏与图表错乱)。
  async function loadData() {
    const seq = ++S.reqSeq;
    S.error = ''; S.note = '加载中…'; draw();
    try {
      const tf = S.tf, sym = S.symbol;
      let bars = [];
      if (tf.kind === 'minute') {
        const r = await fetch(`/api/kline/minute-range?symbol=${encodeURIComponent(sym)}&days=${tf.days}`, { credentials: 'same-origin' });
        if (seq !== S.reqSeq) return;
        if (!r.ok) throw new Error(await errText(r));
        const j = await r.json();
        if (seq !== S.reqSeq) return;
        S.name = j.name || S.name;
        const rows = [];
        for (const s of (j.sessions || [])) for (const row of (s.rows || [])) rows.push(row);
        rows.sort((x, y) => String(x.datetime).localeCompare(String(y.datetime)));
        bars = aggregateMinutes(rows.map((x) => ({
          datetime: x.datetime, open: +x.open, high: +x.high, low: +x.low,
          close: +x.close, volume: +(x.volume || 0),
        })).filter((b) => b.open > 0 && b.close > 0), tf.n);
        if (!bars.length) {
          S.error = '本地暂无该标的的分钟线数据（可在「数据」页同步后重试，或切回日 K）';
        } else S.note = '分钟线最小粒度以本地数据为准';
      } else {
        const r = await fetch(`/api/kline/daily?symbol=${encodeURIComponent(sym)}&days=240`, { credentials: 'same-origin' });
        if (seq !== S.reqSeq) return;
        if (!r.ok) throw new Error(await errText(r));
        const j = await r.json();
        if (seq !== S.reqSeq) return;
        S.name = j.name || (j.stock_info && j.stock_info.name) || '';
        const raw = (j.rows || []).map((x) => ({
          t: x.date, open: +x.open, high: +x.high, low: +x.low,
          close: +x.close, volume: +(x.volume || 0),
        })).filter((b) => b.open > 0 && b.close > 0);
        bars = tf.kind === 'daily' ? raw : aggregateBars(raw, tf.kind);
        if (!bars.length) S.error = '本地暂无该标的的日线数据';
      }
      if (seq !== S.reqSeq) return;
      S.bars = bars; S.raw = bars;
      S.view.count = Math.min(bars.length || 120, 120);
      S.view.start = Math.max(0, bars.length - S.view.count);
      recompute();
      loadDrawings(false);
      updateQuote();
      if (!bars.length) draw();
    } catch (e) {
      if (seq !== S.reqSeq) return;
      S.error = e && e.message ? e.message : String(e);
      S.bars = []; draw();
    } finally {
      if (seq === S.reqSeq) { S.note = ''; draw(); }
    }
  }
  function updateQuote() {
    const bars = S.bars; quote.innerHTML = '';
    if (!bars.length) return;
    const last = bars[bars.length - 1], prev = bars[bars.length - 2];
    const chg = prev ? last.close - prev.close : 0;
    const pct = prev ? chg / prev.close * 100 : 0;
    const col = chg >= 0 ? T.up : T.down;
    const name = h('span', { text: S.name || S.symbol, style: { fontWeight: '600' } });
    const price = h('span', { text: f2(last.close), style: { color: col, fontWeight: '600', fontSize: '15px' } });
    const delta = h('span', { text: `${chg >= 0 ? '+' : ''}${f2(chg)}  ${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
      style: { color: col, fontSize: '12px' } });
    quote.appendChild(name); quote.appendChild(price); quote.appendChild(delta);
  }

  // ── 初始化 ──
  renderToolList('');
  for (const [id, b] of Object.entries(tfBtns)) {
    const on = id === S.tf.id;
    b.style.background = on ? T.accent2 : T.panel2;
    b.style.color = on ? '#fff' : T.text;
    b.style.borderColor = on ? T.accent : T.border;
  }
  highlightTool();
  resize();
  loadData();

  return function cleanup() {
    if (S.raf) cancelAnimationFrame(S.raf);
    for (const fn of S.cleanup) { try { fn(); } catch (e) { /* noop */ } }
  };
}

// ── ext_page 契约 (runtime PagePackExtension) ─────────────────────────────
const extension = {
  id: 'local.chart',
  apiVersion: 1,
  routes: [
    { id: 'local-chart', path: '/local-chart', mount(root, ctx) { return mountPage(root, ctx); } },
  ],
  navigation: [
    { id: 'local-chart', routeId: 'local-chart', label: 'K线绘图', icon: 'LineChart' },
  ],
};

export default extension;
