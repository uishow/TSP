/**
 * lib/tsp-http.mjs —— TSP 只读 HTTP 客户端
 *
 * 关键点：
 *  1. **端口自发现**：TSP 每次启动端口可能在 3018/3019/3020 之间漂移（实测重启后从 3018 变成 3019），
 *     所以不写死端口，按 candidatePorts 逐个探 /health，认 `version` + `mode` 字段。
 *  2. **只读**：本模块只有 GET；路径必须能在 /openapi.json 里找到且带 GET 方法。
 *  3. 黑名单：/api/auth/* 等。
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const PKG_ROOT = join(HERE, "..");

let CONFIG = null;
export function config() {
  if (CONFIG) return CONFIG;
  const p = process.env.TSP_CONFIG || join(PKG_ROOT, "config.json");
  const raw = readFileSync(p, "utf8").replace(/^\uFEFF/, ""); // 防 Windows 编辑器写 BOM
  CONFIG = JSON.parse(raw);
  return CONFIG;
}

const state = { base: null, spec: null, specAt: 0 };

/** 探一个端口是不是 TSP（不是我们的 ELTDX adapter，也不是别的服务） */
async function probe(host, port, timeoutMs) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), Math.min(timeoutMs, 3000));
  try {
    const res = await fetch(`http://${host}:${port}/health`, { signal: ctl.signal });
    if (!res.ok) return null;
    const j = await res.json();
    // TSP /health: {status:"ok", version:"0.3.24", mode:"free", memory:{...}}
    if (j && typeof j.version === "string" && j.status === "ok" && !("gateway" in j)) {
      return `http://${host}:${port}`;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveBase(force = false) {
  const cfg = config().tsp || {};
  if (state.base && !force) return state.base;
  const host = cfg.host || "127.0.0.1";
  const ports = cfg.candidatePorts || [3018, 3019, 3020, 3022, 3023, 3024, 3025];
  for (const port of ports) {
    const base = await probe(host, port, cfg.timeoutMs || 15000);
    if (base) {
      state.base = base;
      return base;
    }
  }
  throw new Error(
    `找不到 TSP（探测 ${host}:${ports.join("/")} 全部失败）。TSP 起了吗？` +
      `（如果你刚重启过，端口可能变了，把新端口加进 config.json 的 tsp.candidatePorts）`,
  );
}

export async function getJson(path, query) {
  const cfg = config().tsp || {};
  const base = await resolveBase();
  const url = new URL(base + path);
  for (const [k, v] of Object.entries(query || {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), cfg.timeoutMs || 15000);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json", ...(cfg.headers || {}) },
      signal: ctl.signal,
    });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    return { ok: res.ok, status: res.status, body };
  } catch (e) {
    state.base = null; // 端口可能变了，下次重新发现
    return { ok: false, status: 0, body: String(e.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

export function pathAllowed(path) {
  const mcpCfg = config().mcp || {};
  const deny = mcpCfg.denyPathPatterns || ["/api/auth/"];
  const allow = mcpCfg.allowPathPrefixes || ["/api/", "/health"];
  return typeof path === "string" && path.startsWith("/") && !deny.some((d) => path.startsWith(d)) && allow.some((a) => path.startsWith(a));
}

export async function openapi() {
  if (state.spec && Date.now() - state.specAt < 60000) return state.spec;
  const r = await getJson("/openapi.json");
  if (!r.ok || typeof r.body !== "object") throw new Error(`读 /openapi.json 失败（${r.status}）`);
  state.spec = r.body;
  state.specAt = Date.now();
  return state.spec;
}

function matchTemplate(spec, path) {
  if (!spec?.paths) return null;
  if (spec.paths[path]?.get) return path;
  const wanted = path.split("/");
  for (const key of Object.keys(spec.paths)) {
    if (!spec.paths[key].get) continue;
    const parts = key.split("/");
    if (parts.length !== wanted.length) continue;
    let hit = true;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith("{") && parts[i].endsWith("}")) continue;
      if (parts[i] !== wanted[i]) {
        hit = false;
        break;
      }
    }
    if (hit) return key;
  }
  return null;
}

/** 白名单校验后的只读 GET */
export async function safeGet(path, query) {
  if (!pathAllowed(path)) throw new Error(`不在只读白名单：${path}`);
  const spec = await openapi();
  if (!matchTemplate(spec, path)) throw new Error(`TSP 没有这个 GET 接口：${path}`);
  return getJson(path, query);
}

/** 依次试多个路径，返回第一个成功的 */
export async function getFirst(paths, query) {
  const errors = [];
  for (const p of paths) {
    const r = await getJson(p, query);
    if (r.ok) return { path: p, ...r };
    errors.push(`${p}=${r.status}`);
  }
  return { path: null, ok: false, status: 0, body: null, errors };
}

/** 从响应里挖出数组（兼容 data/items/rows/list…） */
export function rowsOf(body) {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    for (const k of ["rows", "data", "items", "list", "results", "records", "alerts"]) {
      if (Array.isArray(body[k])) return body[k];
    }
  }
  return [];
}
