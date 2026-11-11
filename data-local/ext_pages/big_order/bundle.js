/* 大单监控 · TSP 自定义页面（v3 · 带量化分析）
 * 数据：ELTDX 适配器 :3021  /bigorder/{flow,ticks,screen,auction}
 *       TSP 同源 :3018   /api/kline/instruments/search（搜索框）
 */

const ADAPTER = "http://127.0.0.1:3021";
const T_SCREEN = 10000;

const TIERS = [
  { key: "super", label: "超大单", color: "#f5455c" },
  { key: "big", label: "大单", color: "#ff9f43" },
  { key: "mid", label: "中单", color: "#5b8def" },
  { key: "small", label: "小单", color: "#8b98ad" },
];

const CSS = `
.bo{--bg:#0f1420;--panel:#151c2b;--line:#232c3f;--txt:#c9d4e4;--dim:#7b8aa3;--up:#f5455c;--down:#2ee6a8;
  background:var(--bg);color:var(--txt);height:100%;overflow:auto;padding:10px 12px 16px;font-size:12px}
.bo *{box-sizing:border-box}
.bo-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}
.bo-h1{font-size:15px;font-weight:600}
.bo-tag{font-size:11px;padding:1px 7px;border-radius:9px;border:1px solid var(--line);color:var(--dim)}
.bo-tag.on{color:#2ee6a8;border-color:#1d4d3f}
.bo-tag.off{color:#f5455c;border-color:#4d1d24}
.bo-in{background:#0b1120;border:1px solid var(--line);color:var(--txt);border-radius:5px;padding:4px 8px;font-size:12px;outline:none}
.bo-in:focus{border-color:#3d6ef7}
.bo-in.num{width:64px;text-align:right;font-family:Consolas,monospace}
.bo-sel{background:#0b1120;border:1px solid var(--line);color:var(--txt);border-radius:5px;padding:4px 6px;font-size:12px}
.bo-btn{background:#1d2740;border:1px solid var(--line);color:var(--txt);border-radius:5px;padding:4px 10px;cursor:pointer;font-size:12px}
.bo-btn:hover{border-color:#3d6ef7}
.bo-btn.on{background:#3d6ef7;border-color:#3d6ef7;color:#fff}
.bo-wrap{position:relative}
.bo-sug{position:absolute;top:100%;left:0;z-index:30;background:#0b1120;border:1px solid #3d6ef7;border-radius:6px;width:230px;max-height:240px;overflow:auto;display:none;margin-top:2px}
.bo-sug div{padding:5px 9px;cursor:pointer;display:flex;justify-content:space-between;gap:8px}
.bo-sug div:hover,.bo-sug div.act{background:#1b2740}
.bo-sug small{color:var(--dim)}
.bo-card{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:7px 9px}
.bo-auction{display:flex;align-items:center;gap:12px;margin-bottom:8px;padding:6px 10px;font-size:12px;flex-wrap:wrap}
.bo-auction b{font-size:16px;font-family:Consolas,monospace}
.bo-auction .v-strong{color:#f5455c}.bo-auction .v-mid{color:#ff9f43}.bo-auction .v-weak{color:#2ee6a8}
.bo-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:8px}
@media(max-width:1180px){.bo-grid{grid-template-columns:1fr}}
.bo-quote{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.bo-name{font-size:16px;font-weight:600}
.bo-code{color:var(--dim);font-size:11px}
.bo-price{font-size:22px;font-weight:700;font-family:Consolas,monospace}
.bo-pct{font-size:13px;font-weight:600}
.bo-dim{color:var(--dim)}
.bo-tiers{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:10px}
.bo-tier{border:1px solid var(--line);border-radius:8px;padding:7px 10px;background:#111828}
.bo-tier .lb{color:var(--dim);font-size:11px;display:flex;justify-content:space-between}
.bo-tier .val{font-family:Consolas,monospace;font-size:15px;margin-top:3px}
.bo-tier .bar{height:5px;border-radius:3px;background:#0b1120;margin-top:7px;position:relative;overflow:hidden}
.bo-tier .bar i{position:absolute;top:0;bottom:0;left:0;border-radius:2px}
.bo-bs{display:flex;gap:8px 14px;margin-top:8px;font-size:12px;color:var(--dim);flex-wrap:wrap;align-items:center}
.bo-bs b{font-family:Consolas,monospace;font-size:14px;font-weight:600}
.bo-levels{display:flex;gap:10px;margin-left:14px;flex-wrap:wrap}
.bo-lv{padding:3px 12px;border:1px solid var(--line);border-radius:12px;cursor:pointer;font-size:11.5px;color:var(--dim);min-width:58px;text-align:center;background:transparent;line-height:1.6}
.bo-lv:hover{border-color:#3d6ef7}
.bo-lv.on{background:#1b2740;border-color:#3d6ef7;color:#fff}
.bo-seal{border:1px solid var(--line);border-radius:8px;background:#111828;padding:6px 10px;margin-top:8px;cursor:pointer}
.bo-seal:hover{border-color:#3d6ef7}
.bo-seal-row{display:flex;gap:8px 16px;flex-wrap:wrap;align-items:baseline;font-size:11.5px;color:var(--dim)}
.bo-seal-row b{font-family:Consolas,monospace;font-size:14px;color:#dbe5f5;font-weight:600}
.bo-seal-chip{font-size:11px;padding:1px 8px;border-radius:9px;border:1px solid #3d4759;color:#a9b7cc}
.bo-seal-chip.bad{border-color:#f5455c;color:#ffb3bd}
.bo-seal-chip.warn{border-color:#ff9f43;color:#ffd7ae}
.bo-seal-chip.ok{border-color:#2ee6a8;color:#9bf0d6}
.bo-seal-spark{width:100%;height:34px;display:block;margin-top:4px}
.bo-bottom{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
@media(max-width:900px){.bo-bottom{grid-template-columns:1fr}}
.bo-bottom .bo-scroll{height:210px}
.bo-chartbox{position:relative;margin-top:10px}
.bo-chart{width:100%;height:230px;display:block;cursor:crosshair}
.bo-tip{position:absolute;pointer-events:none;background:#0b1120;border:1px solid #3d6ef7;border-radius:5px;
  padding:4px 8px;font-size:11px;font-family:Consolas,monospace;display:none;z-index:20;white-space:nowrap}
.bo-tabs{display:flex;gap:6px;margin:8px 0 4px}
.bo-tab{padding:3px 10px;border:1px solid var(--line);border-radius:5px;cursor:pointer;font-size:12px;color:var(--dim)}
.bo-tab.on{color:var(--txt);border-color:#3d6ef7;background:#1b2740}
.bo-scroll{height:200px;overflow:auto;border:1px solid var(--line);border-radius:6px}
.bo-table{width:100%;border-collapse:collapse;font-size:11.5px;font-family:Consolas,monospace}
.bo-table th{position:sticky;top:0;background:#151c2b;color:var(--dim);font-weight:400;text-align:right;padding:4px 6px;border-bottom:1px solid var(--line)}
.bo-table th:first-child,.bo-table td:first-child{text-align:left}
.bo-table td{padding:2px 6px;text-align:right;border-bottom:1px solid #1a2233}
.bo-up{color:var(--up)}.bo-down{color:var(--down)}.bo-flat{color:var(--dim)}
.bo-alert{border-radius:6px;padding:5px 10px;margin-bottom:6px;display:none;font-size:12px}
.bo-alert.major{display:block;background:#3a1420;border:1px solid #f5455c;color:#ffd7de}
.bo-alert.normal{display:block;background:#2b2410;border:1px solid #ff9f43;color:#ffe8c7}
.bo-rankrow{display:grid;grid-template-columns:1fr 62px 66px;gap:6px;padding:3px 5px;border-bottom:1px solid #1a2233;cursor:pointer}
.bo-rankhead{display:grid;grid-template-columns:1fr 62px 66px;gap:6px;padding:2px 5px;color:var(--dim);font-size:10.5px;border-bottom:1px solid var(--line)}
.bo-rankhead span:last-child,.bo-rankhead span:nth-child(2){text-align:right}
.bo-sort{cursor:pointer;user-select:none}
.bo-sort:hover{color:#c9d4e4}
.bo-sort.on{color:#3d6ef7;font-weight:600}
.bo-chks{display:flex;gap:8px;align-items:center;font-size:10.5px;color:var(--dim);flex-wrap:wrap}
.bo-chks label{display:flex;align-items:center;gap:3px;cursor:pointer;white-space:nowrap}
.bo-chks input{margin:0;accent-color:#3d6ef7;width:11px;height:11px}
.bo-rankrow:hover{background:#1b2436}
.bo-rankrow.sel{background:#1b2740}
.bo-sub{color:var(--dim);font-size:11px;display:flex;justify-content:space-between;margin-bottom:4px}
.bo-list{height:150px;overflow:auto;border:1px solid var(--line);border-radius:6px;margin-top:4px}
.bo-hit{padding:3px 6px;border-bottom:1px solid #1a2233;font-size:11px;font-family:Consolas,monospace}
.bo-empty{color:var(--dim);text-align:center;padding:10px;font-size:11px}
/* 量化分析卡 */
.bo-ana{display:grid;grid-template-columns:150px minmax(0,1fr) minmax(0,340px);gap:10px;align-items:stretch}
@media(max-width:1280px){.bo-ana{grid-template-columns:150px minmax(0,1fr)}}
.bo-gauge{display:flex;flex-direction:column;align-items:center;justify-content:center}
.bo-gauge canvas{width:140px;height:92px}
.bo-gauge .sc{font-size:22px;font-weight:700;font-family:Consolas,monospace;margin-top:-6px}
.bo-gauge .lb{font-size:11px;color:var(--dim)}
.bo-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;align-content:stretch}
@media(max-width:1100px){.bo-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
.bo-metric{border:1px solid var(--line);border-radius:6px;padding:5px 8px;background:#111828}
.bo-metric .k{font-size:10.5px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bo-metric .v{font-size:14px;font-family:Consolas,monospace;margin-top:1px;white-space:nowrap}
.bo-cum{position:relative}
.bo-cum-cap{font-size:10px;color:var(--dim);margin-bottom:2px}
.bo-cum canvas{width:100%;height:124px;display:block}
.bo-chips{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px}
.bo-chip{font-size:10.5px;padding:0 7px;border-radius:9px;border:1px solid #3d4759;background:#111828;color:#a9b7cc}
.bo-chip.red{border-color:#f5455c;color:#ffb3bd}
.bo-chip.green{border-color:#2ee6a8;color:#9bf0d6}
.bo-text{margin-top:3px;line-height:1.5;font-size:11px;color:#aebad0}
.bo-text b{color:#dbe5f5;font-weight:500}
.bo-pop{position:absolute;z-index:40;background:#101728;border:1px solid #3d6ef7;border-radius:8px;padding:8px 10px;width:320px;display:none;box-shadow:0 8px 24px rgba(0,0,0,.5)}
.bo-pop .hd{display:flex;justify-content:space-between;color:var(--dim);font-size:11px;margin-bottom:4px}
.bo-pop .bd{max-height:200px;overflow:auto;font-family:Consolas,monospace;font-size:11px}
.bo-modal{position:fixed;inset:0;background:rgba(4,7,14,.72);display:none;z-index:80;align-items:center;justify-content:center}
.bo-modal .box{background:#121a2a;border:1px solid #3d6ef7;border-radius:10px;padding:16px 18px;width:520px;max-width:92vw;line-height:1.75;font-size:12.5px}
.bo-modal h4{margin:0 0 8px;font-size:14px;color:#dbe5f5}
.bo-modal p{margin:0 0 8px;color:#b8c4d8}
.bo-modal .k{color:#ffd7de}
.bo-modal .g{color:#9bf0d6}
.bo-pop .bd div{display:grid;grid-template-columns:60px 1fr 70px 40px;gap:6px;padding:2px 0;border-bottom:1px solid #1a2233}
`;

function h(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function money(v) {
  if (v == null || !isFinite(v)) return "-";
  const a = Math.abs(v);
  if (a >= 1e8) return (v / 1e8).toFixed(2) + "亿";
  if (a >= 1e4) return (v / 1e4).toFixed(0) + "万";
  return v.toFixed(0);
}
function pctText(v) {
  return v == null ? "" : (v > 0 ? "+" : "") + v.toFixed(2) + "%";
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function toMin(t) {
  const [a, b, c] = t.split(":").map(Number);
  return a * 60 + b + (c || 0) / 60;
}
function normSym(raw) {
  let s = String(raw || "").trim().toUpperCase().replace(/^(SH|SZ|BJ)(\d{6})$/, "$1.$2");
  if (/^\d{6}$/.test(s)) {
    const c = s[0];
    s += c === "6" || c === "5" || c === "9" ? ".SH" : c === "4" || c === "8" ? ".BJ" : ".SZ";
  }
  return /^\d{6}\.(SH|SZ|BJ)$/.test(s) ? s : null;
}
async function getJSON(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

export default {
  id: "tsp.big-order",
  apiVersion: 1,
  routes: [{ id: "big-order", path: "/custom/big-order", mount: (host) => mountBigOrder(host) }],
  navigation: [{ id: "big-order", routeId: "big-order", label: "大单监控", icon: "Activity" }],
};

function mountBigOrder(host) {
  host.innerHTML = "";
  const style = h("style");
  style.textContent = CSS;
  host.appendChild(style);
  const root = h("div", "bo");
  host.appendChild(root);

  /* ---------------- 顶栏 ---------------- */
  const bar = h("div", "bo-row");
  bar.appendChild(h("div", "bo-h1", "大单监控"));
  const badge = h("span", "bo-tag", "连接中…");
  bar.appendChild(badge);
  const legend = h("span", "bo-tag", "汇总=同花顺 · 逐笔/榜单=东财 · 竞价=TSP快照");
  bar.appendChild(legend);

  const searchWrap = h("div", "bo-wrap");
  const input = h("input", "bo-in");
  input.style.width = "175px";
  input.placeholder = "代码 / 名称 / 拼音";
  input.value = localStorage.getItem("bo.symbol") || "002639.SZ";
  const sug = h("div", "bo-sug");
  searchWrap.append(input, sug);
  bar.appendChild(searchWrap);

  bar.appendChild(h("span", "bo-dim", "异常大单 ≥"));
  const thInput = h("input", "bo-in num");
  thInput.value = localStorage.getItem("bo.th") || "100";
  bar.appendChild(thInput);
  bar.appendChild(h("span", "bo-dim", "万 · 窗口"));
  const winInput = h("input", "bo-in num");
  winInput.value = localStorage.getItem("bo.win") || "60";
  bar.appendChild(winInput);
  bar.appendChild(h("span", "bo-dim", "秒"));
  const applyBtn = h("button", "bo-btn", "应用");
  bar.appendChild(applyBtn);

  const speedSel = h("select", "bo-sel");
  [["2000", "2秒"], ["3000", "3秒"], ["5000", "5秒"], ["10000", "10秒"]].forEach(([v, t]) => {
    const o = h("option", "", t);
    o.value = v;
    if (localStorage.getItem("bo.speed") === v) o.selected = true;
    speedSel.appendChild(o);
  });
  bar.appendChild(speedSel);
  const pauseBtn = h("button", "bo-btn", "暂停");
  bar.appendChild(pauseBtn);
  bar.appendChild(h("span", "bo-dim", "汇总源"));
  const srcThs = h("button", "bo-btn on", "同花顺");
  const srcEm = h("button", "bo-btn", "东财");
  bar.append(srcThs, srcEm);
  root.appendChild(bar);

  const alertBox = h("div", "bo-alert");
  root.appendChild(alertBox);

  /* ---------------- 竞价强度 ---------------- */
  const auc = h("div", "bo-card bo-auction");
  const aucLb = h("span", "bo-dim", "竞价强度");
  const aucCount = h("b", "", "-");
  const aucUnit = h("span", "bo-dim", "只 ≥5000万");
  const aucVerdict = h("b", "v-mid", "—");
  const aucHint = h("span", "bo-dim", "");
  auc.append(aucLb, aucCount, aucUnit, aucVerdict, aucHint);
  root.appendChild(auc);

  /* ---------------- 量化分析卡 ---------------- */
  const anaCard = h("div", "bo-card");
  anaCard.style.marginBottom = "8px";
  const anaHead = h("div", "bo-sub");
  const anaTitle = h("span", "", "量化分析");
  const anaState = h("span", "", "");
  anaHead.append(anaTitle, anaState);
  anaCard.appendChild(anaHead);

  const ana = h("div", "bo-ana");
  anaCard.appendChild(ana);

  const gaugeBox = h("div", "bo-gauge");
  const gaugeCv = h("canvas");
  const scoreEl = h("div", "sc", "—");
  const scoreLb = h("div", "lb", "综合评分");
  gaugeBox.append(gaugeCv, scoreEl, scoreLb);
  ana.appendChild(gaugeBox);

  const metricBox = h("div", "bo-metrics");
  const metricRefs = {};
  const METRICS = [
    ["netRate", "主力净流入率"],
    ["part", "大单参与度"],
    ["active", "大单活跃度"],
    ["tail", "尾盘量能"],
    ["pv", "价量配合"],
    ["rhythm", "资金节奏"],
  ];
  for (const [k, label] of METRICS) {
    const box = h("div", "bo-metric");
    box.append(h("div", "k", label), h("div", "v", "—"));
    metricBox.appendChild(box);
    metricRefs[k] = box.querySelector(".v");
  }
  const dualBox = h("div", "bo-metric");
  dualBox.style.cursor = "pointer";
  dualBox.style.gridColumn = "span 2";
  const dualK = h("div", "k");
  dualK.append(h("span", "", "双源校验"), h("span", "", "点我说明"));
  const dualV = h("div", "v", "—");
  dualBox.append(dualK, dualV);
  dualBox.addEventListener("click", () => showDualHelp());
  metricBox.appendChild(dualBox);
  ana.appendChild(metricBox);

  const cumBox = h("div", "bo-cum");
  cumBox.appendChild(h("div", "bo-cum-cap", "累计大单净流入（≥当前档位）"));
  const cumCv = h("canvas");
  cumBox.appendChild(cumCv);
  ana.appendChild(cumBox);

  const chips = h("div", "bo-chips");
  anaCard.appendChild(chips);
  const texts = h("div", "bo-text");
  anaCard.appendChild(texts);
  root.appendChild(anaCard);

  /* ---------------- 主体 ---------------- */
  const grid = h("div", "bo-grid");
  root.appendChild(grid);

  const left = h("div", "bo-card");
  grid.appendChild(left);

  const quote = h("div", "bo-quote");
  const nameEl = h("span", "bo-name", "—");
  const codeEl = h("span", "bo-code", "");
  const priceEl = h("span", "bo-price", "—");
  const pctEl = h("span", "bo-pct", "");
  const amountEl = h("span", "bo-dim", "");
  quote.append(nameEl, codeEl, priceEl, pctEl, amountEl);
  left.appendChild(quote);

  /* 大单买入/卖出总额 + 档位筛选 */
  const bsLine = h("div", "bo-bs");
  const buyEl = h("b", "bo-up", "—");
  const sellEl = h("b", "bo-down", "—");
  const netEl = h("b", "", "—");
  const levels = h("div", "bo-levels");
  const LV = [50, 100, 200, 500, 1000];
  const lvBtns = {};
  for (const lv of LV) {
    const b = h("button", "bo-lv", lv + "万");
    b.addEventListener("click", () => {
      thInput.value = String(lv);
      applyThresholds();
    });
    levels.appendChild(b);
    lvBtns[lv] = b;
  }
  bsLine.append(h("span", "", "大单买入"), buyEl, h("span", "", "卖出"), sellEl, h("span", "", "净"), netEl, h("span", "", "只看 ≥"), levels);
  left.appendChild(bsLine);

  const tiersBox = h("div", "bo-tiers");
  const tierRefs = {};
  for (const t of TIERS) {
    const box = h("div", "bo-tier");
    const lb = h("div", "lb");
    lb.append(h("span", "", t.label), h("span", "", "净额"));
    const val = h("div", "val", "—");
    const track = h("div", "bar");
    const fill = h("i");
    track.appendChild(fill);
    box.append(lb, val, track);
    tiersBox.appendChild(box);
    tierRefs[t.key] = { val, fill };
  }
  left.appendChild(tiersBox);

  /* 封单质量 */
  const sealCard = h("div", "bo-seal");
  const sealRow = h("div", "bo-seal-row");
  const sealMain = h("b", "", "—");
  const sealMid = h("span", "", "");
  const sealRatio = h("span", "", "");
  const sealDrops = h("span", "", "");
  const sealFlags = h("span", "");
  sealRow.append(h("span", "", "封单"), sealMain, sealMid, sealRatio, sealDrops, sealFlags);
  const sealSpark = h("canvas", "bo-seal-spark");
  sealCard.append(sealRow, sealSpark);
  sealCard.addEventListener("click", () => showSealHelp());

  left.appendChild(sealCard);

  const chartBox = h("div", "bo-chartbox");
  const canvas = h("canvas", "bo-chart");
  const tip = h("div", "bo-tip");
  const pop = h("div", "bo-pop");
  const popHd = h("div", "hd");
  const popTitle = h("span", "", "");
  const popClose = h("span", "", "× 关闭");
  popHd.append(popTitle, popClose);
  const popBd = h("div", "bd");
  pop.append(popHd, popBd);
  chartBox.append(canvas, tip, pop);
  left.appendChild(chartBox);

  /* 逐笔大单 + 分钟汇总：左右并排 */
  const bottom = h("div", "bo-bottom");

  const tickCol = h("div");
  tickCol.appendChild(h("div", "bo-sub", "逐笔大单"));
  const scroll = h("div", "bo-scroll");
  const table = h("table", "bo-table");
  const thead = h("thead");
  const tbody = h("tbody");
  table.append(thead, tbody);
  scroll.appendChild(table);
  tickCol.appendChild(scroll);
  bottom.appendChild(tickCol);

  const minCol = h("div");
  minCol.appendChild(h("div", "bo-sub", "分钟汇总（60 秒合计）"));
  const minScroll = h("div", "bo-scroll");
  const minTable = h("table", "bo-table");
  const minHead = h("thead");
  const minBody = h("tbody");
  minTable.append(minHead, minBody);
  minScroll.appendChild(minTable);
  minCol.appendChild(minScroll);
  bottom.appendChild(minCol);

  left.appendChild(bottom);

  /* ---------------- 右栏 ---------------- */
  const right = h("div");
  right.style.display = "flex";
  right.style.flexDirection = "column";
  right.style.gap = "8px";
  grid.appendChild(right);

  const rankCard = h("div", "bo-card");
  rankCard.style.flex = "1";
  const rankSub = h("div", "bo-sub");
  rankSub.append(h("span", "", "全市场主力净额榜"));
  const chks = h("div", "bo-chks");
  const chkBoxes = {};
  const mkChk = (label, key) => {
    const lb = h("label");
    const cb = h("input");
    cb.type = "checkbox";
    cb.checked = localStorage.getItem(key) === "1";
    cb.addEventListener("change", () => {
      localStorage.setItem(key, cb.checked ? "1" : "0");
      renderRank();
    });
    chkBoxes[key] = cb;
    lb.append(cb, h("span", "", label));
    return lb;
  };
  chks.append(mkChk("剔创业板", "bo.f.gem"), mkChk("剔科创板", "bo.f.star"), mkChk("剔ST", "bo.f.st"));
  rankSub.appendChild(chks);

  const rankHead = h("div", "bo-rankhead");
  const hName = h("span", "", "名称");
  const hChg = h("span", "bo-sort", "涨幅 ⇅");
  const hNet = h("span", "bo-sort on", "净额 ↓");
  rankHead.append(hName, hChg, hNet);

  const rankList = h("div", "bo-list");
  rankList.style.height = "auto";
  rankList.style.flex = "1 1 auto";
  rankList.style.minHeight = "200px";
  rankCard.style.flex = "1 1 0";
  rankCard.style.display = "flex";
  rankCard.style.flexDirection = "column";
  rankCard.style.minHeight = "0";
  rankCard.append(rankSub, rankHead, rankList);

  function setSort(key) {
    if (st.rankSort.key === key) {
      st.rankSort.dir = -st.rankSort.dir;
    } else {
      st.rankSort.key = key;
      st.rankSort.dir = -1;
    }
    hChg.classList.toggle("on", st.rankSort.key === "chg");
    hNet.classList.toggle("on", st.rankSort.key === "main");
    hChg.textContent = "涨幅 " + (st.rankSort.key === "chg" ? (st.rankSort.dir < 0 ? "↓" : "↑") : "⇅");
    hNet.textContent = "净额 " + (st.rankSort.key === "main" ? (st.rankSort.dir < 0 ? "↓" : "↑") : "⇅");
    renderRank();
  }
  hChg.addEventListener("click", () => setSort("chg"));
  hNet.addEventListener("click", () => setSort("main"));
  right.appendChild(rankCard);

  const hitCard = h("div", "bo-card");
  hitCard.style.flex = "1 1 0";
  hitCard.style.display = "flex";
  hitCard.style.flexDirection = "column";
  hitCard.style.minHeight = "0";
  const hitSub = h("div", "bo-sub");
  const hitCount = h("span", "", "0");
  hitSub.append(h("span", "", "本次异常"), hitCount);
  const hitList = h("div", "bo-list");
  hitList.style.flex = "1 1 auto";
  hitList.style.height = "auto";
  hitList.style.minHeight = "200px";
  hitCard.append(hitSub, hitList);
  right.appendChild(hitCard);

  const modal = h("div", "bo-modal");
  const modalBox = h("div", "box");
  modal.appendChild(modalBox);
  host.appendChild(modal);
  modal.addEventListener("click", (ev) => {
    if (ev.target === modal) modal.style.display = "none";
  });

  /* ---------------- 状态 ---------------- */
  const st = {
    symbol: normSym(input.value) || "002639.SZ",
    src: localStorage.getItem("bo.src") || "ths",
    emFlow: null,
    seal: null,
    flow: null,
    ticks: [],
    screen: [],
    hits: [],
    rankSort: { key: "main", dir: -1 },
    tab: "ticks",
    th: Math.max(1, Number(thInput.value) || 100) * 1e4,
    win: Math.max(10, Number(winInput.value) || 60),
    speed: Number(speedSel.value) || 2000,
    paused: false,
    timers: [],
    disposed: false,
    last: null,
  };

  function setBadge(ok, text) {
    badge.className = "bo-tag " + (ok ? "on" : "off");
    badge.textContent = text;
  }

  function applyFlow(f) {
    if (!f) return;
    nameEl.textContent = f.name || st.symbol;
    codeEl.textContent = st.symbol;
    priceEl.textContent = f.price != null ? f.price.toFixed(2) : "—";
    priceEl.className = "bo-price " + (f.change_pct > 0 ? "bo-up" : f.change_pct < 0 ? "bo-down" : "bo-flat");
    pctEl.textContent = pctText(f.change_pct);
    pctEl.className = "bo-pct " + (f.change_pct > 0 ? "bo-up" : f.change_pct < 0 ? "bo-down" : "bo-flat");
    amountEl.textContent = "成交 " + money(f.amount);
    const tiers = (st.src === "em" ? st.emFlow?.tiers : f.tiers) || {};
    let maxAbs = 1;
    for (const t of TIERS) maxAbs = Math.max(maxAbs, Math.abs(tiers[t.key]?.net || 0));
    for (const t of TIERS) {
      const it = tiers[t.key] || { net: 0 };
      const ref = tierRefs[t.key];
      ref.val.textContent = (it.net >= 0 ? "+" : "") + money(it.net);
      ref.val.style.color = it.net >= 0 ? "#f5455c" : "#2ee6a8";
      ref.fill.style.width = (Math.abs(it.net) / maxAbs) * 100 + "%";
      ref.fill.style.background = it.net >= 0 ? "#f5455c" : "#2ee6a8";
    }
  }

  /* ---------- 统计 ---------- */
  function stats() {
    const rows = st.ticks.filter((t) => t.bs !== "auction");
    if (!rows.length) return null;
    const big = rows.filter((t) => t.amt >= st.th);
    const buy = big.filter((t) => t.bs === "buy").reduce((s, t) => s + t.amt, 0);
    const sell = big.filter((t) => t.bs === "sell").reduce((s, t) => s + t.amt, 0);
    const bigAmt = buy + sell;
    const net = buy - sell;
    const total = st.flow?.amount || 0;
    const lastTick = toMin(rows[rows.length - 1].t);
    // 收盘后的零星盘后成交不算进「尾盘 30 分钟」，否则量能比会失真成 0.05×
    const lastMin = clamp(lastTick, 570, 900);
    const firstMin = toMin(rows[0].t);
    const elapsed = Math.max(1, lastMin - firstMin);
    const perMin = big.length / elapsed;

    // 累计成交额（用于均价）
    let cumAmt = 0, cumVol = 0;
    const avgAt = [];
    for (const t of rows) {
      cumAmt += t.amt;
      cumVol += t.vol * 100;
      avgAt.push({ t: t.t, avg: cumVol ? cumAmt / cumVol : t.price });
    }
    const avgPrice = cumVol ? cumAmt / cumVol : rows[rows.length - 1].price;
    const price = rows[rows.length - 1].price;
    const dev = avgPrice ? (price / avgPrice - 1) * 100 : 0;

    // 近 30 分钟
    const tail = rows.filter((t) => lastMin - toMin(t.t) <= 30);
    const tailBuy = tail.filter((t) => t.bs === "buy").reduce((s, t) => s + t.amt, 0);
    const tailSell = tail.filter((t) => t.bs === "sell").reduce((s, t) => s + t.amt, 0);
    const tailNet = tailBuy - tailSell;
    const tailBig = tail.filter((t) => t.amt >= st.th);
    const tailBigNet = tailBig.reduce((s, t) => s + (t.bs === "buy" ? t.amt : -t.amt), 0);
    const tailAmt = tailBuy + tailSell;
    const allAmt = rows.reduce((s, t) => s + t.amt, 0);
    const tailRatio = allAmt && elapsed > 30 ? (tailAmt / 30) / (allAmt / elapsed) : 1;

    const prevBig = big.filter((t) => lastMin - toMin(t.t) > 30);
    const prevBigNet = prevBig.reduce((s, t) => s + (t.bs === "buy" ? t.amt : -t.amt), 0);
    const midPrice = tail.length ? tail[0].price : price;
    const tailUp = price >= midPrice;

    const chg = st.flow?.change_pct ?? 0;
    const netRate = bigAmt ? (net / bigAmt) * 100 : 0;
    const part = total ? (bigAmt / total) * 100 : 0;

    let pv;
    if (tailNet > 0 && !tailUp) pv = "价跌资金流入（吸筹）";
    else if (tailNet < 0 && tailUp) pv = "价涨资金流出（派发）";
    else if (tailNet > 0 && tailUp) pv = "量价齐升";
    else pv = "双弱";
    const rhythm = tailBigNet > 0 && prevBigNet <= 0 ? "尾盘资金转流入"
      : tailBigNet < 0 && prevBigNet >= 0 ? "尾盘资金转流出"
      : tailBigNet > 0 ? "持续流入" : "持续流出";

    const score = clamp(
      50 + netRate * 0.45 + chg * 1.8 + clamp(dev, -3, 3) * 4 + clamp(tailBigNet / Math.max(1, bigAmt / 4), -2, 2) * 4,
      0,
      100,
    );

    const thsMain = st.flow?.main?.net ?? null;
    const emMain = st.emFlow?.main?.net ?? null;
    let dual = null;
    if (thsMain != null && emMain != null && Math.abs(emMain) > 1e5) {
      const diff = ((thsMain - emMain) / Math.abs(emMain)) * 100;
      dual = { thsMain, emMain, diff, sameDir: Math.sign(thsMain) === Math.sign(emMain) };
    }

    const tags = [];
    if (part > 50) tags.push(["大单主导盘面", "red"]);
    if (perMin > 3) tags.push(["大单密集", "red"]);
    if (tailRatio < 0.7) tags.push(["尾盘缩量", "green"]);
    if (Math.abs(dev) > 1.2 && (dev > 0) !== (net > 0)) tags.push(["量价背离", "green"]);
    if (tailNet > 0 && !tailUp) tags.push(["吸筹迹象", "green"]);
    if (rhythm === "尾盘资金转流入") tags.push(["尾盘资金转流入", "red"]);
    if (st.flow && Math.abs(chg) > 4) tags.push(["日内波动放大", "red"]);
    if (dual && !dual.sameDir) tags.push(["双源背离", "green"]);
    if (score < 40) tags.push(["偏空", "green"]);
    else if (score > 65) tags.push(["偏多", "red"]);

    return {
      rows, big, buy, sell, bigAmt, net, total, perMin, avgAt, avgPrice, dev, price, chg,
      tailBigNet, tailNet, tailRatio, pv, rhythm, score, tags, netRate, part, bigCount: big.length, dual,
      buyCount: big.filter((t) => t.bs === "buy").length,
      sellCount: big.filter((t) => t.bs === "sell").length,
    };
  }

  function drawGauge(score) {
    const cv = gaugeCv;
    const dpr = window.devicePixelRatio || 1;
    const w = 140, hh = 92;
    cv.width = w * dpr;
    cv.height = hh * dpr;
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, hh);
    const cx = w / 2, cy = hh - 10, r = 54;
    ctx.lineWidth = 9;
    ctx.strokeStyle = "#232c3f";
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 0);
    ctx.stroke();
    const ratio = clamp(score / 100, 0, 1);
    ctx.strokeStyle = score >= 60 ? "#f5455c" : score <= 40 ? "#2ee6a8" : "#ff9f43";
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, Math.PI + Math.PI * ratio);
    ctx.stroke();
    const ang = Math.PI + Math.PI * ratio;
    ctx.fillStyle = "#dbe5f5";
    ctx.beginPath();
    ctx.arc(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCum(s, target) {
    const cv = cumCv;
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth || 280;
    const hh = 124;
    cv.width = w * dpr;
    cv.height = hh * dpr;
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, hh);
    if (!s || !s.big.length) {
      ctx.fillStyle = "#7b8aa3";
      ctx.font = "11px sans-serif";
      ctx.fillText("暂无大单", 8, 18);
      return;
    }
    let cum = 0;
    const pts = s.big.map((t) => {
      cum += t.bs === "buy" ? t.amt : -t.amt;
      return { x: toMin(t.t), y: cum };
    });
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const yMin = Math.min(0, ...ys), yMax = Math.max(0, ...ys);
    const padL = 6, padR = 6, padT = 8, padB = 8;
    const X = (v) => padL + ((v - x0) / Math.max(1, x1 - x0)) * (w - padL - padR);
    const Y = (v) => padT + (1 - (v - yMin) / Math.max(1e-6, yMax - yMin)) * (hh - padT - padB);

    ctx.strokeStyle = "#3d4759";
    ctx.beginPath();
    ctx.moveTo(padL, Y(0));
    ctx.lineTo(w - padR, Y(0));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(X(pts[0].x), Y(0));
    for (const p of pts) ctx.lineTo(X(p.x), Y(p.y));
    ctx.lineTo(X(pts[pts.length - 1].x), Y(0));
    ctx.closePath();
    const last = pts[pts.length - 1].y;
    ctx.fillStyle = last >= 0 ? "rgba(245,69,92,.18)" : "rgba(46,230,168,.16)";
    ctx.fill();

    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y))));
    ctx.strokeStyle = last >= 0 ? "#f5455c" : "#2ee6a8";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = "#9aa7bd";
    ctx.font = "10px Consolas,monospace";
    ctx.fillText(money(last), padL + 2, 11);
  }

  function renderAnalysis() {
    const s = stats();
    st.last = s;
    if (!s) {
      scoreEl.textContent = "—";
      for (const k of Object.keys(metricRefs)) metricRefs[k].textContent = "—";
      chips.innerHTML = "";
      texts.innerHTML = "";
      drawCum(null);
      return;
    }
    scoreEl.textContent = Math.round(s.score);
    scoreEl.style.color = s.score >= 60 ? "#f5455c" : s.score <= 40 ? "#2ee6a8" : "#ff9f43";
    scoreLb.textContent = s.score >= 60 ? "偏多" : s.score <= 40 ? "偏空" : "中性";
    drawGauge(s.score);
    drawCum(s);

    buyEl.textContent = money(s.buy);
    sellEl.textContent = money(s.sell);
    netEl.textContent = (s.net >= 0 ? "+" : "") + money(s.net);
    netEl.style.color = s.net >= 0 ? "#f5455c" : "#2ee6a8";
    const curLv = Math.round(st.th / 1e4);
    for (const kv of Object.keys(lvBtns)) lvBtns[kv].classList.toggle("on", Number(kv) === curLv);
    if (s.dual) {
      const d = s.dual;
      dualV.textContent = (d.sameDir ? "同向" : "背离") + " · 差 " + (d.diff > 0 ? "+" : "") + d.diff.toFixed(0) + "%";
      dualV.style.color = d.sameDir ? "#9bf0d6" : "#f5455c";
    } else {
      dualV.textContent = "—";
    }

    metricRefs.netRate.textContent = s.netRate.toFixed(1) + "%";
    metricRefs.netRate.style.color = s.netRate >= 0 ? "#f5455c" : "#2ee6a8";
    metricRefs.part.textContent = s.part.toFixed(1) + "%";
    metricRefs.active.textContent = s.bigCount + " 笔";
    metricRefs.tail.textContent = s.tailRatio.toFixed(2) + "×";
    metricRefs.tail.style.color = s.tailRatio >= 1 ? "#f5455c" : "#2ee6a8";
    metricRefs.pv.textContent = s.pv.split("（")[0];
    metricRefs.pv.style.color = s.pv.startsWith("价跌资金流入") ? "#2ee6a8" : s.pv.startsWith("价涨资金流出") ? "#f5455c" : "#dbe5f5";
    metricRefs.rhythm.textContent = s.rhythm;
    metricRefs.rhythm.style.color = s.rhythm.includes("流入") ? "#f5455c" : "#2ee6a8";

    chips.innerHTML = "";
    for (const [txt, color] of s.tags) chips.appendChild(h("span", "bo-chip " + (color || ""), txt));

    const lines = [];
    lines.push(`<b>资金面：</b>大单买入 ${money(s.buy)}（${s.big.filter((t) => t.bs === "buy").length} 笔）、卖出 ${money(s.sell)}（${s.big.filter((t) => t.bs === "sell").length} 笔），大单净${s.net >= 0 ? "流入" : "流出"} ${money(Math.abs(s.net))}，净流入强度 ${s.netRate.toFixed(1)}%，占全天成交 ${s.part.toFixed(1)}%。`);
    lines.push(`<b>盘面节奏：</b>近 30 分钟大单净${s.tailBigNet >= 0 ? "流入" : "流出"} ${money(Math.abs(s.tailBigNet))}，节奏判定为「${s.rhythm}」；近 30 分钟量能为全天均量的 ${s.tailRatio.toFixed(2)} 倍。`);
    lines.push(`<b>价量关系：</b>现价 ${s.price.toFixed(2)}、分时均价 ${s.avgPrice.toFixed(2)}（偏离 ${s.dev >= 0 ? "+" : ""}${s.dev.toFixed(2)}%），判定为「${s.pv}」。`);
    texts.innerHTML = lines.join("<br>");
  }

  /* ---------- 表格 ---------- */
  function bigTicks() {
    return st.ticks.filter((t) => t.bs !== "auction" && t.amt >= st.th);
  }

  function renderTicks() {
    thead.innerHTML = "<tr><th>时间</th><th>价格</th><th>手数</th><th>金额</th><th>方向</th></tr>";
    tbody.innerHTML = "";
    const rows = bigTicks().slice(-80).reverse();
    for (const t of rows) {
      const tr = h("tr");
      tr.append(
        h("td", "", t.t),
        h("td", t.bs === "buy" ? "bo-up" : "bo-down", t.price.toFixed(2)),
        h("td", "", t.vol.toFixed(0)),
        h("td", t.amt >= st.th ? "bo-up" : "", money(t.amt)),
        h("td", t.bs === "buy" ? "bo-up" : "bo-down", t.bs === "buy" ? "买" : "卖"),
      );
      tbody.appendChild(tr);
    }
    if (!rows.length) tbody.innerHTML = '<tr><td class="bo-empty" colspan="5">暂无大单</td></tr>';
  }

  function renderMinutes() {
    minHead.innerHTML = "<tr><th>分钟</th><th>价格</th><th>涨幅</th><th>净额</th><th>大单</th></tr>";
    minBody.innerHTML = "";
    const map = new Map();
    for (const t of st.ticks) {
      if (t.bs === "auction") continue;
      const key = t.t.slice(0, 5);
      let cur = map.get(key);
      if (!cur) {
        cur = { key, price: t.price, net: 0, count: 0 };
        map.set(key, cur);
      }
      cur.price = t.price;
      cur.net += t.bs === "buy" ? t.amt : -t.amt;
      if (t.amt >= st.th) cur.count += 1;
    }
    const pre = st.flow?.pre_close;
    const rows = [...map.values()].reverse().slice(0, 60);
    for (const r of rows) {
      const chg = pre ? (r.price / pre - 1) * 100 : null;
      const tr = h("tr");
      tr.append(
        h("td", "", r.key),
        h("td", "", r.price.toFixed(2)),
        h("td", chg == null ? "" : chg > 0 ? "bo-up" : "bo-down", chg == null ? "" : pctText(chg)),
        h("td", r.net >= 0 ? "bo-up" : "bo-down", money(r.net)),
        h("td", r.count ? "bo-up" : "bo-flat", String(r.count)),
      );
      minBody.appendChild(tr);
    }
    if (!minBody.children.length) minBody.innerHTML = '<tr><td class="bo-empty" colspan="5">暂无数据</td></tr>';
  }

  /* ---------- 主图 ---------- */
  let bubbles = [];
  function drawChart() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 600;
    const hh = canvas.clientHeight || 230;
    canvas.width = w * dpr;
    canvas.height = hh * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, hh);
    bubbles = [];

    const rows = st.ticks.filter((t) => t.bs !== "auction" && t.price > 0);
    if (!rows.length) {
      ctx.fillStyle = "#7b8aa3";
      ctx.font = "11px sans-serif";
      ctx.fillText("暂无分时数据", 10, 20);
      return;
    }
    const padL = 46, padR = 8, padT = 10, padB = 14;
    const X = (t) => {
      const m = toMin(t);
      const idx = m <= 690 ? m - 570 : 120 + (m - 780);
      return padL + clamp(idx / 240, 0, 1) * (w - padL - padR);
    };
    const pre = st.flow?.pre_close;
    const ps = rows.map((r) => r.price);
    let lo = Math.min(...ps), hi = Math.max(...ps);
    if (pre) { lo = Math.min(lo, pre); hi = Math.max(hi, pre); }
    const span = Math.max(hi - lo, 0.01);
    lo -= span * 0.06; hi += span * 0.06;
    const Y = (p) => padT + (1 - (p - lo) / (hi - lo)) * (hh - padT - padB);

    ctx.strokeStyle = "#232c3f";
    for (let i = 0; i <= 4; i++) {
      const y = padT + ((hh - padT - padB) * i) / 4;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
      ctx.fillStyle = "#7b8aa3"; ctx.font = "10px Consolas,monospace";
      ctx.fillText((hi - ((hi - lo) * i) / 4).toFixed(2), 3, y + 3);
    }
    if (pre) {
      ctx.setLineDash([3, 3]); ctx.strokeStyle = "#3d4759";
      ctx.beginPath(); ctx.moveTo(padL, Y(pre)); ctx.lineTo(w - padR, Y(pre)); ctx.stroke();
      ctx.setLineDash([]);
    }

    // 均价线
    const s = st.last;
    if (s && s.avgAt.length) {
      ctx.beginPath();
      s.avgAt.forEach((p, i) => (i ? ctx.lineTo(X(p.t), Y(p.avg)) : ctx.moveTo(X(p.t), Y(p.avg))));
      ctx.strokeStyle = "#e6c35c";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.beginPath();
    rows.forEach((r, i) => (i ? ctx.lineTo(X(r.t), Y(r.price)) : ctx.moveTo(X(r.t), Y(r.price))));
    ctx.strokeStyle = "#5b8def";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    for (const r of rows) {
      if (r.amt < st.th) continue;
      const radius = clamp(Math.sqrt(r.amt / 1e4) * 0.85, 2.2, 10);
      const x = X(r.t), y = Y(r.price);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = r.bs === "buy" ? "rgba(245,69,92,.5)" : "rgba(46,230,168,.42)";
      ctx.fill();
      ctx.strokeStyle = r.bs === "buy" ? "#f5455c" : "#2ee6a8";
      ctx.lineWidth = 1; ctx.stroke();
      if (radius >= 5) {
        ctx.fillStyle = "#fff";
        ctx.font = "9px sans-serif";
        ctx.fillText(r.bs === "buy" ? "B" : "S", x - 3, y + 3);
      }
      bubbles.push({ x, y, r: radius, t: r.t, price: r.price, amt: r.amt, bs: r.bs });
    }
  }

  canvas.addEventListener("mousemove", (ev) => {
    const rect = canvas.getBoundingClientRect();
    const mx = ev.clientX - rect.left, my = ev.clientY - rect.top;
    let best = null, bestD = 1e9;
    for (const b of bubbles) {
      const d = Math.hypot(b.x - mx, b.y - my);
      if (d < b.r + 4 && d < bestD) { best = b; bestD = d; }
    }
    if (!best) { tip.style.display = "none"; return; }
    tip.style.display = "block";
    tip.style.left = Math.min(mx + 12, canvas.clientWidth - 140) + "px";
    tip.style.top = Math.max(4, my - 34) + "px";
    tip.textContent = `${best.t} ${best.bs === "buy" ? "买" : "卖"} ${money(best.amt)} @${best.price.toFixed(2)}`;
  });
  canvas.addEventListener("mouseleave", () => (tip.style.display = "none"));

  // 点击气泡 → 该分钟明细
  canvas.addEventListener("click", (ev) => {
    const rect = canvas.getBoundingClientRect();
    const mx = ev.clientX - rect.left, my = ev.clientY - rect.top;
    let best = null, bestD = 1e9;
    for (const b of bubbles) {
      const d = Math.hypot(b.x - mx, b.y - my);
      if (d < b.r + 5 && d < bestD) { best = b; bestD = d; }
    }
    if (!best) { pop.style.display = "none"; return; }
    const key = best.t.slice(0, 5);
    const list = st.ticks.filter((t) => t.bs !== "auction" && t.t.slice(0, 5) === key);
    const net = list.reduce((s2, t) => s2 + (t.bs === "buy" ? t.amt : -t.amt), 0);
    popTitle.textContent = `${best.t} 分钟大单明细 · 净额 ${money(net)}`;
    popBd.innerHTML = "";
    for (const t of list.slice().reverse().slice(0, 40)) {
      const row = h("div");
      row.append(
        h("span", "", t.t),
        h("span", t.bs === "buy" ? "bo-up" : "bo-down", t.price.toFixed(2)),
        h("span", t.bs === "buy" ? "bo-up" : "bo-down", money(t.amt)),
        h("span", "", t.bs === "buy" ? "买" : "卖"),
      );
      popBd.appendChild(row);
    }
    pop.style.display = "block";
    pop.style.left = clamp(mx + 14, 4, Math.max(4, canvas.clientWidth - 340)) + "px";
    pop.style.top = clamp(my + 14, 4, Math.max(4, canvas.clientHeight - 240)) + "px";
  });
  popClose.addEventListener("click", () => (pop.style.display = "none"));

  /* ---------- 异常 / 榜单 ---------- */
  function checkAlerts() {
    const rows = st.ticks.filter((t) => t.bs !== "auction");
    if (rows.length < 3) return null;
    const lastMin = toMin(rows[rows.length - 1].t);
    const inWin = rows.filter((t) => lastMin - toMin(t.t) <= st.win / 60 && t.amt >= st.th);
    if (inWin.length < 3) return null;
    const net = inWin.reduce((s, t) => s + (t.bs === "buy" ? t.amt : -t.amt), 0);
    if (Math.abs(net) < st.th * 3) return null;
    const major = inWin.length >= 5 && Math.abs(net) >= st.th * 10;
    return { major, count: inWin.length, net, side: net > 0 ? "买" : "卖" };
  }

  function renderAlert() {
    const hit = checkAlerts();
    if (!hit) { alertBox.className = "bo-alert"; alertBox.textContent = ""; return; }
    alertBox.className = "bo-alert " + (hit.major ? "major" : "normal");
    const text = `【${hit.major ? "重要" : "普通"}】${st.win} 秒内 ${hit.count} 笔 ≥${money(st.th)}，净${hit.side} ${money(Math.abs(hit.net))}`;
    if (alertBox.textContent !== text) {
      alertBox.textContent = text;
      st.hits.unshift({ at: new Date().toLocaleTimeString("zh-CN", { hour12: false }), text });
      st.hits = st.hits.slice(0, 30);
      renderHits();
    }
  }

  function renderHits() {
    hitCount.textContent = st.hits.length + " 条";
    hitList.innerHTML = "";
    for (const x of st.hits) hitList.appendChild(h("div", "bo-hit", x.at + "  " + x.text));
    if (!st.hits.length) hitList.innerHTML = '<div class="bo-empty">还没有触发</div>';
  }

  function renderRank() {
    rankList.innerHTML = "";
    const gem = chkBoxes["bo.f.gem"]?.checked;
    const star = chkBoxes["bo.f.star"]?.checked;
    const stx = chkBoxes["bo.f.st"]?.checked;
    let rows = st.screen.filter((r) => {
      const code = (r.symbol || "").slice(0, 6);
      if (gem && (code.startsWith("300") || code.startsWith("301"))) return false;
      if (star && (code.startsWith("688") || code.startsWith("689"))) return false;
      if (stx && /ST/i.test(r.name || "")) return false;
      return true;
    });
    const k = st.rankSort.key;
    const mul = st.rankSort.dir < 0 ? 1 : -1;
    rows = rows.sort((a, b) => {
      const av = k === "chg" ? (a.change_pct || 0) : (a.main_net || 0);
      const bv = k === "chg" ? (b.change_pct || 0) : (b.main_net || 0);
      return (bv - av) * mul;
    });
    for (const r of rows.slice(0, 80)) {
      const row = h("div", "bo-rankrow" + (r.symbol === st.symbol ? " sel" : ""));
      row.append(
        h("div", "", r.name || r.symbol),
        h("div", r.change_pct > 0 ? "bo-up" : "bo-down", pctText(r.change_pct)),
        h("div", (r.main_net || 0) >= 0 ? "bo-up" : "bo-down", money(r.main_net)),
      );
      row.addEventListener("click", () => switchSymbol(r.symbol));
      rankList.appendChild(row);
    }
    if (!st.screen.length) rankList.innerHTML = '<div class="bo-empty">等待数据…</div>';
  }

  async function loadAuction() {
    try {
      const j = await getJSON(ADAPTER + "/bigorder/auction");
      const d = j.data || {};
      if (d.state !== "ok") {
        aucCount.textContent = "-";
        aucVerdict.textContent = "未采集";
        aucVerdict.className = "v-mid";
        aucHint.textContent = d.hint || "";
        return;
      }
      aucCount.textContent = String(d.count);
      aucVerdict.textContent = d.verdict;
      aucVerdict.className = d.verdict === "能干" ? "v-strong" : d.verdict === "震荡" ? "v-mid" : "v-weak";
      aucHint.textContent = `${d.date} 采样 · 前3：` + (d.items || []).slice(0, 3).map((x) => `${x.name} ${money(x.amount)}`).join("、");
    } catch (e) {
      aucHint.textContent = "竞价数据不可用";
    }
  }

  /* ---------- 刷新 ---------- */
  function switchSymbol(sym) {
    const s = normSym(sym);
    if (!s) return;
    st.symbol = s;
    st.flow = null;
    st.ticks = [];
    st.last = null;
    input.value = s;
    localStorage.setItem("bo.symbol", s);
    sug.style.display = "none";
    pop.style.display = "none";
    tbody.innerHTML = "";
    drawChart();
    refreshFlow();
    refreshTicks();
    refreshSeal();
    renderRank();
  }

  async function refreshFlow() {
    try {
      const [thsR, emR] = await Promise.all([
        getJSON(`${ADAPTER}/bigorder/flow?symbol=${st.symbol}&source=ths`),
        getJSON(`${ADAPTER}/bigorder/flow?symbol=${st.symbol}&source=em`).catch(() => null),
      ]);
      const j = thsR;
      st.emFlow = emR?.data || null;
      if (st.disposed) return;
      st.flow = j.data;
      applyFlow(st.flow);
      setBadge(true, "ELTDX 在线");
      renderAnalysis();
      drawChart();
    } catch (e) {
      setBadge(false, "ELTDX 离线");
    }
  }

  async function refreshTicks() {
    if (st.paused) return;
    try {
      const j = await getJSON(`${ADAPTER}/bigorder/ticks?symbol=${st.symbol}&pos=0&lmt=2000`);
      if (st.disposed) return;
      st.ticks = j.data.data || [];
      renderAnalysis();
      renderTicks();
      renderMinutes();
      renderAlert();
      drawChart();
    } catch (e) { /* 下一轮重试 */ }
  }

  async function refreshScreen() {
    try {
      const j = await getJSON(`${ADAPTER}/bigorder/screen?limit=300`);
      if (st.disposed) return;
      st.screen = j.data || [];
      renderRank();
    } catch (e) { /* 忽略 */ }
  }

  /* ---------- 搜索 ---------- */
  let sugTimer = 0;
  function hideSug() { sug.style.display = "none"; }
  function showSug(items) {
    sug.innerHTML = "";
    if (!items.length) { hideSug(); return; }
    items.slice(0, 20).forEach((it, i) => {
      const row = h("div", i === 0 ? "act" : "");
      row.append(h("span", "", it.name || it.symbol), h("small", "", it.symbol));
      row.addEventListener("mousedown", (ev) => {
        ev.preventDefault();
        switchSymbol(it.symbol);
        input.value = it.symbol;
        hideSug();
      });
      sug.appendChild(row);
    });
    sug.style.display = "block";
  }
  async function search(q) {
    q = q.trim();
    if (!q) { hideSug(); return; }
    const direct = normSym(q);
    if (direct) { showSug([{ symbol: direct, name: direct }]); return; }
    try {
      const j = await getJSON(`/api/kline/instruments/search?q=${encodeURIComponent(q)}`);
      showSug(j.results || []);
    } catch (e) { hideSug(); }
  }
  input.addEventListener("input", () => {
    clearTimeout(sugTimer);
    sugTimer = setTimeout(() => search(input.value), 220);
  });
  input.addEventListener("keydown", (ev) => {
    ev.stopPropagation();
    if (ev.key === "Enter") {
      ev.preventDefault();
      const first = sug.querySelector("div");
      if (first) first.dispatchEvent(new MouseEvent("mousedown"));
      else switchSymbol(input.value);
      hideSug();
    } else if (ev.key === "Escape") hideSug();
  });
  document.addEventListener("click", (ev) => {
    if (!searchWrap.contains(ev.target)) hideSug();
  });

  function applyThresholds() {
    st.th = Math.max(1, Number(thInput.value) || 100) * 1e4;
    st.win = Math.max(10, Number(winInput.value) || 60);
    localStorage.setItem("bo.th", String(thInput.value));
    localStorage.setItem("bo.win", String(winInput.value));
    renderTicks();
    renderMinutes();
    renderAnalysis();
    drawChart();
    renderAlert();
  }
  applyBtn.addEventListener("click", applyThresholds);
  [thInput, winInput].forEach((el) => el.addEventListener("keydown", (ev) => {
    ev.stopPropagation();
    if (ev.key === "Enter") applyThresholds();
  }));

  function setSource(src) {
    st.src = src;
    localStorage.setItem("bo.src", src);
    srcThs.classList.toggle("on", src === "ths");
    srcEm.classList.toggle("on", src === "em");
    applyFlow();
    renderAnalysis();
  }
  srcThs.addEventListener("click", () => setSource("ths"));
  srcEm.addEventListener("click", () => setSource("em"));


  function drawSealSpark(d) {
    const cv = sealSpark;
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth || 400, hh = 34;
    cv.width = w * dpr; cv.height = hh * dpr;
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, hh);
    const pts = (d.samples || []).map((x) => x[1]);
    if (pts.length < 2) return;
    const mx = Math.max(...pts) || 1;
    ctx.beginPath();
    pts.forEach((v, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = hh - 3 - (v / mx) * (hh - 8);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.strokeStyle = "#5b8def"; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.lineTo(w, hh); ctx.lineTo(0, hh); ctx.closePath();
    ctx.fillStyle = "rgba(91,141,239,.14)"; ctx.fill();
  }

  function renderSeal() {
    const d = st.seal;
    if (!d || d.state !== "ok") {
      sealMain.textContent = "未采样";
      sealMid.textContent = d?.hint || "该票不在今天的封单采样池（覆盖 150 只候选）";
      sealRatio.textContent = "";
      sealDrops.textContent = "";
      sealFlags.innerHTML = "";
      drawSealSpark({ samples: [] });
      return;
    }
    sealMain.textContent = money(d.seal);
    sealMid.textContent = `峰值 ${money(d.seal_peak)} · 中位 ${money(d.seal_median)}`;
    sealRatio.textContent = `占成交 ${(d.seal_ratio * 100).toFixed(2)}%`;
    sealDrops.textContent = d.drops ? `骤降 ${d.drops} 次` : "无骤降";
    sealDrops.style.color = d.drops >= 2 ? "#f5455c" : "";
    sealFlags.innerHTML = "";
    const chip = h("span", "bo-seal-chip " + (d.verdict === "正常" ? "ok" : d.verdict === "偏弱" ? "warn" : "bad"), d.verdict);
    sealFlags.appendChild(chip);
    for (const f of (d.flags || []).slice(0, 3)) {
      if (f === d.verdict) continue;
      sealFlags.appendChild(h("span", "bo-seal-chip ", f));
      sealFlags.appendChild(document.createTextNode(" "));
    }
    drawSealSpark(d);
  }

  async function refreshSeal() {
    try {
      const j = await getJSON(`${ADAPTER}/bigorder/seal?symbol=${st.symbol}`);
      if (st.disposed) return;
      st.seal = j.data;
      renderSeal();
    } catch (e) { /* 忽略 */ }
  }


  function showSealHelp() {
    const d = st.seal;
    modalBox.innerHTML = [
      "<h4>封单质量：怎么判断假封单</h4>",
      "<p>数据来自本机封单采样（每 10 秒一次，抓买一挂单量），不依赖 L2 逐笔委托。</p>",
      "<p><b>占成交比</b>：封单金额 ÷ 当日成交额。<span class='k'>&lt;3% 判「虚板」</span>（封单连成交的零头都不够，一碰就开）；3%~10% 判「偏弱」；&gt;10% 才算真封。</p>",
      "<p><b>骤降</b>：相邻两次采样封单掉 30% 以上、但价格仍在涨停 → 判定为<span class='k'>撤单</span>（如果是被吃开，价格会离开涨停价）。累计 ≥2 次标「撤单嫌疑」。</p>",
      "<p><b>挂撤反复</b>：封单中位数不到峰值的 30%，说明大单反复挂上去又撤，属于托单行为。</p>",
      "<p>当前：封单 " + (d?.state === 'ok' ? money(d.seal) : "—") + " ｜ 峰值 " + (d?.state === 'ok' ? money(d.seal_peak) : "—") +
        " ｜ 占成交 " + (d?.state === 'ok' ? (d.seal_ratio * 100).toFixed(2) + "%" : "—") +
        " ｜ 骤降 " + (d?.state === 'ok' ? d.drops + " 次" : "—") + " → <b>" + (d?.state === 'ok' ? d.verdict : "未采样") + "</b></p>",
      "<p style='color:#7b8aa3'>采样池是每天 150 只候选，不在这池子里的票会显示「未采样」。</p>",
    ].join("");
    modal.style.display = "flex";
  }

  function showDualHelp() {
    const d = st.last?.dual;
    modalBox.innerHTML = [
      "<h4>双源校验：同花顺 realhead vs 东方财富资金流</h4>",
      "<p>两边算的都是「主力净额 = 超大单 + 大单」，但<b>分档边界不一样</b>（阈值不同、是否含集合竞价不同），所以<b>绝对值不能直接比</b>。实测同一时点偏差中位数 70%~100%，那是口径差，不是谁算错。</p>",
      "<p><span class='g'>同向</span>：两源主力净额符号一致，说明大单方向可信；偏差越大，说明大单越集中在某一档边界附近，结构偏单边。</p>",
      "<p><span class='k'>背离</span>：一个净流入一个净流出，说明在两套分档下结论相反，常见于资金在超大单与大单之间倒手（换手/对倒）。这时不应只信单一源，要看逐笔明细确认。</p>",
      "<p>当前：同花顺 " + (d ? money(d.thsMain) : "—") + " ｜ 东财 " + (d ? money(d.emMain) : "—") +
        " ｜ 偏差 " + (d ? (d.diff > 0 ? "+" : "") + d.diff.toFixed(0) + "%" : "—") +
        " → <b>" + (d ? (d.sameDir ? "同向" : "背离") : "数据不足") + "</b></p>",
      "<p style='color:#7b8aa3'>想换四档金额的汇总源，点顶部「同花顺 / 东财」按钮。</p>",
    ].join("");
    modal.style.display = "flex";
  }

  pauseBtn.addEventListener("click", () => {
    st.paused = !st.paused;
    pauseBtn.textContent = st.paused ? "继续" : "暂停";
    pauseBtn.classList.toggle("on", st.paused);
  });
  speedSel.addEventListener("change", () => {
    st.speed = Number(speedSel.value) || 2000;
    localStorage.setItem("bo.speed", speedSel.value);
    restartTicksTimer();
  });

  let tickTimer = 0;
  function restartTicksTimer() {
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = setInterval(refreshTicks, st.speed);
  }

  setSource(st.src);
  switchSymbol(st.symbol);
  refreshSeal();
  refreshScreen();
  loadAuction();
  restartTicksTimer();
  st.timers.push(setInterval(refreshFlow, 3000));
  st.timers.push(setInterval(refreshScreen, T_SCREEN));
  st.timers.push(setInterval(refreshSeal, 10000));

  return () => {
    st.disposed = true;
    st.timers.forEach(clearInterval);
    if (tickTimer) clearInterval(tickTimer);
    modal.remove();
    host.innerHTML = "";
  };
}
