/**
 * bigorder-watch.mjs —— 连续大单异常巡检
 *
 * 链路：
 *   1) 每 SCAN_MS 调 ELTDX 适配器 /bigorder/screen（东财全市场主力净额榜，600 只）
 *   2) 与上一轮对比，挑出「主力净额变化 ≥ CANDIDATE_DELTA」的票（全市场初筛，只花 4~6 个请求）
 *   3) 对候选逐个拉 /bigorder/flow（同花顺超/大/中/小）+ /bigorder/ticks（东财逐笔）
 *   4) 按两档口径判定「连续大单」：普通 / 重要
 *   5) 命中 → 去重（同一标的同一档 COOLDOWN_MS 内只报一次）→ 推 QQ + 落 jsonl
 *
 * 用法：
 *   node bigorder-watch.mjs            # 常驻，交易时段内自动巡检，收盘退出
 *   node bigorder-watch.mjs --once     # 只跑一轮（盘后自测用，不推送）
 *   node bigorder-watch.mjs --dry      # 常驻但不推送
 */

import { existsSync, mkdirSync, readFileSync, appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PKG_ROOT } from "./lib/tsp-http.mjs";
import { pushPrivate } from "./lib/qq-push.mjs";

const ADAPTER = process.env.BIGORDER_ADAPTER || "http://127.0.0.1:3021";
const SCAN_MS = Number(process.env.BIGORDER_SCAN_MS || 15000);
const CANDIDATE_DELTA = Number(process.env.BIGORDER_DELTA || 300e4);
const MAX_CANDIDATES = Number(process.env.BIGORDER_MAX || 12);
const COOLDOWN_MS = Number(process.env.BIGORDER_COOLDOWN_MIN || 15) * 60 * 1000;

const ONCE = process.argv.includes("--once");
const DRY = process.argv.includes("--dry") || ONCE;

/** 两档口径：与页面上的一致 */
const RULES = [
  { level: "major", label: "重要大单", window: 60, minCount: 5, minEach: 300e4, minNet: 1000e4 },
  { level: "normal", label: "普通大单", window: 60, minCount: 3, minEach: 100e4, minNet: 300e4 },
];

const DIR = join(PKG_ROOT, "大单提醒");
if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
const STATE_FILE = join(DIR, "状态.json");
const LOG_FILE = join(DIR, `${new Date().toISOString().slice(0, 10)}.jsonl`);

const state = existsSync(STATE_FILE)
  ? JSON.parse(readFileSync(STATE_FILE, "utf8"))
  : { lastNet: {}, cooldown: {}, seal: {} };
if (!state.seal) state.seal = {};

function saveState() {
  writeFileSync(STATE_FILE, JSON.stringify(state));
}

function nowShanghai() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour12: false,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t)?.value || "";
  return { weekday: get("weekday"), hhmm: `${get("hour")}:${get("minute")}` };
}

function inTradingWindow() {
  const { weekday, hhmm } = nowShanghai();
  if (/六|日|Sat|Sun/.test(weekday)) return false;
  return hhmm >= "09:25" && hhmm <= "15:05";
}

function money(v) {
  const abs = Math.abs(v || 0);
  if (abs >= 1e8) return (v / 1e8).toFixed(2) + "亿";
  if (abs >= 1e4) return (v / 1e4).toFixed(0) + "万";
  return String(Math.round(v || 0));
}

async function getJSON(path) {
  const res = await fetch(ADAPTER + path, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`);
  return res.json();
}

/** 用逐笔算「最近 window 秒内 ≥minEach 的笔数 + 净额」 */
function evaluate(ticks, rule) {
  const rows = ticks.filter((t) => t.bs !== "auction");
  if (rows.length < rule.minCount) return null;
  const last = rows[rows.length - 1].t;
  const [h, m, s] = last.split(":").map(Number);
  const lastMin = h * 60 + m + s / 60;
  const picked = rows.filter((t) => {
    const [h2, m2, s2] = t.t.split(":").map(Number);
    return lastMin - (h2 * 60 + m2 + s2 / 60) <= rule.window / 60 && t.amt >= rule.minEach;
  });
  const net = picked.reduce((sum, t) => sum + (t.bs === "buy" ? t.amt : -t.amt), 0);
  if (picked.length >= rule.minCount && Math.abs(net) >= rule.minNet) {
    return { count: picked.length, net, side: net > 0 ? "买" : "卖" };
  }
  return null;
}

/** 封单质量巡检：涨停股封单 10 秒级骤降 = 撤单嫌疑 */
async function scanSeal() {
  let rank = [];
  try {
    const j = await getJSON("/bigorder/seal/rank?limit=50");
    rank = j.data || [];
  } catch (e) {
    return;
  }
  const now = Date.now();
  for (const r of rank) {
    const prev = state.seal[r.symbol];
    state.seal[r.symbol] = r.seal;
    if (prev == null || prev < 5e6) continue;
    const drop = 1 - r.seal / prev;
    if (drop < 0.3) continue;
    const key = `${r.symbol}|seal`;
    if (now - (state.cooldown[key] || 0) < COOLDOWN_MS) continue;
    state.cooldown[key] = now;
    const hit = {
      symbol: r.symbol, name: r.name, level: "seal", label: "封单骤降",
      drop: +(drop * 100).toFixed(0), seal: r.seal, prev, ratio: r.seal_ratio, verdict: r.verdict,
      at: new Date().toISOString(),
    };
    appendFileSync(LOG_FILE, JSON.stringify(hit) + "\n", "utf8");
    const text = `【封单骤降】${r.name}(${r.symbol})\n封单 ${money(prev)} → ${money(r.seal)}（-${hit.drop}%）\n占成交 ${(r.seal_ratio * 100).toFixed(2)}% · ${r.verdict}`;
    console.log(text.replace(/\n/g, " | "));
    if (!DRY) {
      try { await pushPrivate(text); } catch (e) { console.error("[qq] 封单推送失败", e.message); }
    }
  }
  saveState();
}

async function scanOnce() {
  const screen =
    (await getJSON("/bigorder/screen?limit=300").catch(() => null))?.data || [];
  if (!screen.length) {
    console.log("[warn] 榜单为空");
    return [];
  }

  const candidates = [];
  for (const row of screen) {
    const prev = state.lastNet[row.symbol];
    const delta = prev == null ? 0 : row.main_net - prev;
    state.lastNet[row.symbol] = row.main_net;
    if (Math.abs(delta) >= CANDIDATE_DELTA) {
      candidates.push({ ...row, delta });
    }
  }
  candidates.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const picked = candidates.slice(0, MAX_CANDIDATES);
  saveState();

  const hits = [];
  for (const cand of picked) {
    const [flow, ticks] = await Promise.all([
      getJSON(`/bigorder/flow?symbol=${cand.symbol}`).then((r) => r.data).catch(() => null),
      getJSON(`/bigorder/ticks?symbol=${cand.symbol}&pos=0&lmt=2000`).then((r) => r.data?.data || []).catch(() => []),
    ]);
    for (const rule of RULES) {
      const hit = evaluate(ticks, rule);
      if (!hit) continue;
      const key = `${cand.symbol}|${rule.level}`;
      const lastAt = state.cooldown[key] || 0;
      if (Date.now() - lastAt < COOLDOWN_MS) continue;
      state.cooldown[key] = Date.now();
      hits.push({
        symbol: cand.symbol,
        name: cand.name || flow?.name || cand.symbol,
        level: rule.level,
        label: rule.label,
        count: hit.count,
        net: hit.net,
        side: hit.side,
        delta: cand.delta,
        price: cand.price,
        change_pct: cand.change_pct,
        at: new Date().toISOString(),
      });
      break; // 同一标的只报最高档
    }
  }
  saveState();

  for (const hit of hits) {
    appendFileSync(LOG_FILE, JSON.stringify(hit) + "\n", "utf8");
    const text =
      `【${hit.label}】${hit.name}(${hit.symbol}) ${hit.price ?? ""} ${hit.change_pct >= 0 ? "+" : ""}${hit.change_pct?.toFixed?.(2) ?? ""}%\n` +
      `${RULES.find((r) => r.level === hit.level).window} 秒内 ${hit.count} 笔大单，净${hit.side} ${money(Math.abs(hit.net))}\n` +
      `本轮主力净额变化 ${money(hit.delta)}`;
    console.log(text.replace(/\n/g, " | "));
    if (!DRY) {
      try {
        await pushPrivate(text);
      } catch (e) {
        console.error("[qq] 推送失败", e.message);
      }
    }
  }
  if (!hits.length) console.log(`[scan] 候选 ${picked.length}，无命中 ${nowShanghai().hhmm}`);
  return hits;
}

/** 09:26 采一次全市场「竞价成交额 ≥5000 万」名单（窗口外无法回补） */
async function captureAuctionIfNeeded() {
  const { hhmm } = nowShanghai();
  const day = new Date().toISOString().slice(0, 10);
  const file = join(DIR, `竞价强度-${day}.json`);
  if (existsSync(file)) return;
  if (hhmm < "09:26" || hhmm > "09:30") return;

  try {
    const res = await fetch("http://127.0.0.1:3018/api/screener/market-snapshot", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const payload = await res.json();
    const rows = payload.rows || payload.data || payload;
    const big = rows
      .filter((r) => (r.amount || 0) >= 5e7)
      .map((r) => ({ symbol: r.symbol, name: r.name, amount: r.amount, change_pct: r.change_pct }))
      .sort((a, b) => b.amount - a.amount);
    const count = big.length;
    const verdict = count >= 4 ? "能干" : count >= 1 ? "震荡" : "空仓";
    const payloadOut = { date: day, captured_at: new Date().toISOString(), threshold: 5e7, count, verdict, items: big.slice(0, 20) };
    writeFileSync(file, JSON.stringify(payloadOut, null, 0));
    console.log(`[auction] 竞价≥5000万 ${count} 只 → ${verdict}`);
  } catch (e) {
    console.error("[auction] 采集失败", e.message);
  }
}

async function main() {
  console.log(`[bigorder] 启动 适配器=${ADAPTER} 间隔=${SCAN_MS}ms 候选阈值=${money(CANDIDATE_DELTA)}`);
  if (ONCE) {
    const hits = await scanOnce();
    console.log(`[bigorder] 单轮结束，命中 ${hits.length}`);
    return;
  }
  while (true) {
    if (inTradingWindow()) {
      await captureAuctionIfNeeded();
      await scanSeal();
      await scanOnce().catch((e) => console.error("[scan]", e.message));
    } else {
      const { hhmm } = nowShanghai();
      if (hhmm > "15:05" && hhmm < "23:59") {
        console.log("[bigorder] 已过收盘窗口，退出");
        return;
      }
    }
    await new Promise((r) => setTimeout(r, SCAN_MS));
  }
}

main().catch((e) => {
  console.error("[fatal]", e);
  process.exit(1);
});
