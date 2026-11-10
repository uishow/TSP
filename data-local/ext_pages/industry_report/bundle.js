// ============================================================================
// TSP · 行业 / 公司研究报告   —   ext_page 运行时插件 (单文件 ES 模块)
// ----------------------------------------------------------------------------
// 来源: 将 https://github.com/SapioCresco/industry-report-skill 的能力「落地」为
//       TSP 扩展页面。原 skill 的「联网研报聚合(东方财富/iwencai) + AI 分析」需要
//       外网与密钥; 而本机 TSP 为 local_only(fail-closed), 故本页改用 **TSP 已验证
//       本地数据** 生成结构化的研究快照, 复刻原 skill 的「单文件研究报告」呈现形态。
//
// 形态参照: industry-report-skill 的 templates/report.html / company_report.html
//           (行业/公司双模式 → 概览 / 行情 / 财务 / 市场环境 / 数据来源)
//
// 重要: 零外部依赖。不 import 任何 CDN / 第三方 ESM, 全部用原生 DOM + fetch,
//       因此在离线 / 外网 fail-closed / 严格 CSP 的部署下也能正常打开。
//
// 数据来源(同源 /api/*, 浏览器自动带会话, 无需 Bearer):
//   GET /api/kline/instruments/search?q=&limit=      —— 标的搜索
//   GET /api/kline/daily?symbol=&days=240            —— 日 K / 均线 / 量额
//   GET /api/financials/reports?symbol=              —— 财务分析报告(markdown)
//   GET /api/regime/latest                           —— 市场情绪/景气状态
//
// 升级安全: 落在 data/ext_pages/industry-report/, 不进镜像, 升级不丢。
// ============================================================================

// ── 主题 (贴近 TSP 暗色; A 股配色: 涨红跌绿) ──────────────────────────────
const T = {
  bg: '#0b1220', panel: '#111a2b', panel2: '#0e1726', border: '#1e2a3f',
  text: '#d7e0ee', muted: '#8794a8', dim: '#5c6b82',
  accent: '#2f80ed', accent2: '#1f6feb', cyan: '#22d3ee', green: '#34d399',
  up: '#f23645', down: '#0ecb81', warn: '#fbbf24',
};

// ── 轻量 DOM 构造 ──────────────────────────────────────────────────────────
function h(tag, opts = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(opts)) {
    if (k === 'style') el.style.cssText = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v != null) el.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return el;
}
const fmt2 = (n) => (n == null || !isFinite(n)) ? '-' : Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const fmt0 = (n) => (n == null || !isFinite(n)) ? '-' : Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 0 });
const pct = (n) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

// ── 极简 markdown 渲染(只处理标题/加粗/列表, 够读研报摘要) ──────────────────
function mdLight(md) {
  if (!md) return h('div', { style: 'color:' + T.dim }, '（无内容）');
  const box = h('div', { style: 'font-size:13px;line-height:1.7;color:' + T.text });
  for (let line of md.split('\n')) {
    line = line.trimEnd();
    if (!line.trim()) continue;
    if (line.startsWith('## ')) box.appendChild(h('div', { style: 'font-weight:700;color:' + T.cyan + ';margin:10px 0 4px;font-size:14px', text: line.slice(3) }));
    else if (line.startsWith('# ')) box.appendChild(h('div', { style: 'font-weight:800;color:' + T.accent + ';margin:8px 0 4px;font-size:15px', text: line.slice(2) }));
    else if (line.startsWith('- ')) box.appendChild(h('div', { style: 'padding-left:14px;color:' + T.text, text: '• ' + line.slice(2).replace(/\*\*(.+?)\*\*/g, '$1') }));
    else box.appendChild(h('div', { style: 'color:' + T.text, text: line.replace(/\*\*(.+?)\*\*/g, '$1') }));
  }
  return box;
}

// ── 主挂载 ─────────────────────────────────────────────────────────────────
function mountPage(root) {
  root.style.cssText = `height:100%;background:${T.bg};color:${T.text};font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;overflow:auto;`;
  root.innerHTML = '';

  const wrap = h('div', { style: 'max-width:980px;margin:0 auto;padding:22px 26px 60px' });
  root.appendChild(wrap);

  // 头部
  wrap.appendChild(h('div', { style: 'display:flex;align-items:baseline;gap:12px;flex-wrap:wrap' }, [
    h('h1', { style: 'font-size:22px;margin:0;color:' + T.text, text: '行业 / 公司研究报告' }),
    h('span', { style: 'font-size:12px;color:' + T.cyan, text: 'TSP 本地数据版 · 移植自 industry-report-skill' }),
  ]));
  wrap.appendChild(h('div', {
    style: `margin:10px 0 18px;padding:10px 14px;border-left:3px solid ${T.warn};background:${T.panel2};border-radius:0 8px 8px 0;font-size:12.5px;color:${T.muted}`,
    html: '本页使用 <b style="color:' + T.cyan + '">TSP 本机已验证数据</b>（行情 / 财务 / 市场景气）生成研究快照。原 skill 的「联网研报聚合 + AI 分析」需外网与密钥，本环境为 <b>local_only（fail-closed）</b>，未接入；如需联网聚合，可在有网环境扩展本页的「数据源」层。'
  }));

  // 搜索区
  const input = h('input', {
    placeholder: '输入代码或名称，如 000157 / 中联重科 / 贵州茅台',
    style: `flex:1;min-width:260px;background:${T.panel};border:1px solid ${T.border};border-radius:8px;color:${T.text};padding:10px 12px;font-size:14px;outline:none`,
  });
  const btn = h('button', {
    text: '生成报告',
    style: `background:linear-gradient(90deg,${T.accent},${T.cyan});border:none;border-radius:8px;color:#fff;padding:10px 18px;font-size:14px;font-weight:600;cursor:pointer`,
  });
  const status = h('div', { style: 'font-size:12.5px;color:' + T.muted + ';min-height:18px;margin:8px 0' });
  const out = h('div', { style: 'margin-top:10px' });

  wrap.appendChild(h('div', { style: 'display:flex;gap:10px;flex-wrap:wrap;align-items:center' }, [input, btn]));
  wrap.appendChild(status);
  wrap.appendChild(out);

  let current = null; // {symbol,name}

  async function api(path) {
    const r = await fetch(path, { credentials: 'same-origin' });
    if (!r.ok) throw new Error(path + ' → HTTP ' + r.status);
    return r.json();
  }

  async function doSearch(q) {
    if (!q) return [];
    try {
      const d = await api('/api/kline/instruments/search?q=' + encodeURIComponent(q) + '&limit=8');
      return (d.results || []).map(x => ({ symbol: x.symbol, name: x.name || x.symbol, asset_type: x.asset_type }));
    } catch (e) { status.textContent = '搜索失败：' + e.message; return []; }
  }

  function showResults(list) {
    const old = document.getElementById('__ir_search_list');
    if (old) old.remove();
    if (!list.length) return;
    const box = h('div', {
      id: '__ir_search_list',
      style: `margin-top:6px;background:${T.panel};border:1px solid ${T.border};border-radius:8px;overflow:hidden`,
    });
    list.forEach(x => box.appendChild(h('div', {
      style: `padding:8px 12px;cursor:pointer;border-bottom:1px solid ${T.border};font-size:13px`,
      text: `${x.name}  (${x.symbol})  ·  ${x.asset_type}`,
      onMouseenter: (e) => e.target.style.background = T.panel2,
      onMouseleave: (e) => e.target.style.background = 'transparent',
      onclick: () => { current = x; input.value = x.name + ' (' + x.symbol + ')'; box.remove(); generate(x); },
    })));
    wrap.insertBefore(box, status);
  }

  input.addEventListener('input', async () => {
    const q = input.value.trim();
    if (q.length >= 1) showResults(await doSearch(q));
  });
  btn.addEventListener('click', async () => {
    const q = input.value.trim();
    if (!q) { status.textContent = '请输入代码或名称'; return; }
    const list = await doSearch(q);
    if (!list.length) { status.textContent = '未找到匹配标的'; return; }
    if (list.length === 1) { current = list[0]; generate(list[0]); }
    else showResults(list);
  });

  // ── 报告渲染 ──
  async function generate(target) {
    out.innerHTML = ''; status.textContent = '正在拉取本地数据…';
    try {
      const [daily, fin, regime] = await Promise.allSettled([
        api('/api/kline/daily?symbol=' + encodeURIComponent(target.symbol) + '&days=240'),
        api('/api/financials/reports?symbol=' + encodeURIComponent(target.symbol)),
        api('/api/regime/latest'),
      ]);
      status.textContent = '✓ 数据已就绪（本机 /api 同源）';
      renderReport(target, daily, fin, regime);
    } catch (e) {
      status.textContent = '生成失败：' + e.message;
    }
  }

  function card(title, children, accent) {
    return h('div', { style: `background:${T.panel};border:1px solid ${T.border};border-radius:12px;padding:16px 18px;margin:14px 0;border-top:3px solid ${accent || T.accent}` }, [
      h('div', { style: 'font-size:15px;font-weight:700;color:' + T.text + ';margin-bottom:10px', text: title }),
      ...[].concat(children),
    ]);
  }

  function renderReport(target, dailyP, finP, regimeP) {
    const daily = dailyP.status === 'fulfilled' ? dailyP.value : null;
    const fin = finP.status === 'fulfilled' ? finP.value : null;
    const regime = regimeP.status === 'fulfilled' ? regimeP.value : null;

    // 标题卡
    const rows = (daily && daily.rows) || [];
    const name = (daily && daily.name) || target.name;
    out.appendChild(card(name + '  (' + target.symbol + ')', [
      h('div', { style: 'font-size:12.5px;color:' + T.muted, text: '资产类型: ' + ((daily && daily.asset_type) || target.asset_type || '-') + ' · 数据源: ' + ((daily && daily.source) || 'local') + ' · 样本区间: 近 ' + rows.length + ' 个交易日' }),
    ], T.cyan));

    // 行情快照
    if (rows.length) {
      const last = rows[rows.length - 1];
      const prev = last.prev_close || (rows[rows.length - 2] ? rows[rows.length - 2].close : last.close);
      const chg = last.close - prev;
      const chgPct = prev ? chg / prev * 100 : 0;
      const col = chg >= 0 ? T.up : T.down;
      let hi = -Infinity, lo = Infinity, vsum = 0;
      for (const r of rows) { hi = Math.max(hi, r.high); lo = Math.min(lo, r.low); vsum += (r.volume || 0); }
      const ma = [['MA5', last.ma5], ['MA10', last.ma10], ['MA20', last.ma20], ['MA60', last.ma60]];
      out.appendChild(card('行情快照', [
        h('div', { style: 'display:flex;gap:18px;align-items:baseline;flex-wrap:wrap' }, [
          h('span', { style: 'font-size:24px;font-weight:800;color:' + col, text: fmt2(last.close) }),
          h('span', { style: 'font-size:14px;color:' + col + ';font-weight:600', text: (chg >= 0 ? '+' : '') + fmt2(chg) + '  ' + pct(chgPct) }),
        ]),
        h('div', { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px 16px;margin-top:10px;font-size:13px' }, [
          kv('区间最高', fmt2(hi)), kv('区间最低', fmt2(lo)),
          kv('区间成交量均值', fmt0(vsum / rows.length) + ' 手'),
          kv('昨收', fmt2(prev)),
          ...ma.map(m => kv(m[0], m[1] != null ? fmt2(m[1]) : '-')),
        ]),
        h('div', { style: 'margin-top:8px;font-size:12px;color:' + T.dim, text: '均线排列: ' + (last.ma5 > last.ma20 && last.ma20 > last.ma60 ? '多头(短>中>长)' : last.ma5 < last.ma20 && last.ma20 < last.ma60 ? '空头(短<中<长)' : '交织/震荡') }),
      ]));
    } else {
      out.appendChild(card('行情快照', [h('div', { style: 'color:' + T.warn, text: '本地无该标的日线数据（daily 接口未返回 rows）' })]));
    }

    // 市场环境
    if (regime && regime.row) {
      const r = regime.row;
      const stateMap = { strong: ['强势', T.up], weak: ['弱势', T.down], neutral: ['中性', T.muted] };
      const [stxt, scol] = stateMap[r.state] || [r.state, T.muted];
      out.appendChild(card('市场环境（景气状态）', [
        h('div', { style: 'display:flex;gap:14px;align-items:center;flex-wrap:wrap' }, [
          h('span', { style: 'font-size:15px;font-weight:700;color:' + scol, text: '市场状态: ' + stxt }),
          h('span', { style: 'font-size:12.5px;color:' + T.muted, text: '数据日期 ' + (r.date || '-') + ' · 景气分 ' + (r.score ?? '-') }),
        ]),
        h('div', { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px 16px;margin-top:10px;font-size:13px' }, [
          kv('上涨家数', fmt0(r.up_count)), kv('下跌家数', fmt0(r.down_count)),
          kv('上涨占比', (r.up_ratio != null ? (r.up_ratio * 100).toFixed(1) + '%' : '-')),
          kv('涨停', fmt0(r.limit_up)), kv('跌停', fmt0(r.limit_down)),
          kv('中位涨跌幅', r.median_pct != null ? pct(r.median_pct * 100) : '-'),
          kv('站上MA20占比', r.above_ma20_pct != null ? (r.above_ma20_pct * 100).toFixed(1) + '%' : '-'),
        ]),
      ], T.green));
    }

    // 财务分析报告
    const reports = (fin && fin.reports) || [];
    if (reports.length) {
      const rep = reports[0];
      const mismatch = rep.symbol && rep.symbol !== target.symbol
        ? h('div', { style: 'font-size:11.5px;color:' + T.warn + ';margin-bottom:6px', text: '⚠ 返回报告标的为 ' + rep.symbol + '（' + (rep.name || '') + '），与查询标的 ' + target.symbol + ' 不一致，可能为本端财务接口未严格按 symbol 过滤，仅供参考。' })
        : null;
      out.appendChild(card('财务分析报告', [mismatch, mdLight(rep.content)]));
    } else {
      out.appendChild(card('财务分析报告', [h('div', { style: 'color:' + T.dim, text: '本端 /api/financials/reports 无该标的报告（或未生成）。' })]));
    }

    // 数据来源说明
    out.appendChild(h('div', {
      style: `margin-top:18px;padding:10px 14px;background:${T.panel2};border:1px solid ${T.border};border-radius:8px;font-size:11.5px;color:${T.dim};line-height:1.7`,
      html: '数据来源（同源 /api，本机已验证）：<br>' +
        '· <code style="color:' + T.cyan + '">/api/kline/daily</code> 行情与均线<br>' +
        '· <code style="color:' + T.cyan + '">/api/financials/reports</code> 财务分析<br>' +
        '· <code style="color:' + T.cyan + '">/api/regime/latest</code> 市场景气<br>' +
        '· <code style="color:' + T.cyan + '">/api/kline/instruments/search</code> 标的搜索<br>' +
        '原 industry-report-skill 的联网研报聚合(iwencai / 东方财富)与 AI 分析层未在本页接入（local_only 环境）。'
    }));
  }

  function kv(k, v) {
    return h('div', {}, [
      h('div', { style: 'color:' + T.dim + ';font-size:11.5px', text: k }),
      h('div', { style: 'color:' + T.text + ';font-weight:600', text: v }),
    ]);
  }

  return function cleanup() { /* 本页无定时器/订阅, 无需清理 */ };
}

// ── ext_page 契约 (runtime PagePackExtension) ─────────────────────────────
const extension = {
  id: 'local.industry_report',
  apiVersion: 1,
  routes: [
    { id: 'industry-report', path: '/industry-report', mount(root, ctx) { return mountPage(root, ctx); } },
  ],
  navigation: [
    { id: 'industry-report', routeId: 'industry-report', label: '研究报告', icon: 'FileText' },
  ],
};

export default extension;
