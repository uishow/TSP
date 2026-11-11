/**
 * lib/qq-push.mjs —— 通过 SnowLuma 的 OneBot HTTP 接口给主人发 QQ 私聊
 *
 * 实测：POST http://127.0.0.1:3000/send_private_msg
 *       Header: Authorization: Bearer <accessToken>
 *       Body:   {"user_id":1971998097,"message":"..."}
 *       → {"status":"ok","retcode":0,"data":{"message_id":-544459652}}
 *
 * token 默认从 SnowLuma 的 onebot_<uin>.json 里读（配置文件位置见 config.json）。
 */

import { readFileSync } from "node:fs";
import { config } from "./tsp-http.mjs";

let cachedToken = null;

function loadToken() {
  if (cachedToken) return cachedToken;
  const qq = config().qq || {};
  if (qq.token) {
    cachedToken = String(qq.token);
    return cachedToken;
  }
  if (qq.tokenFile) {
    const raw = JSON.parse(readFileSync(qq.tokenFile, "utf8"));
    const servers = raw?.networks?.httpServers || [];
    const tok = servers[0]?.accessToken;
    if (tok) {
      cachedToken = tok;
      return cachedToken;
    }
  }
  throw new Error("找不到 OneBot accessToken（config.json qq.token / qq.tokenFile）");
}

export async function pushPrivate(message) {
  const qq = config().qq || {};
  if (qq.enabled === false) return { skipped: true, reason: "qq.enabled=false" };
  const url = (qq.onebotUrl || "http://127.0.0.1:3000").replace(/\/+$/, "") + "/send_private_msg";
  const body = JSON.stringify({ user_id: Number(qq.ownerQQ), message: String(message) });
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${loadToken()}`,
      },
      body,
      signal: AbortSignal.timeout(qq.timeoutMs || 15000),
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
    const ok = json?.status === "ok" && json?.retcode === 0;
    return { ok, status: res.status, messageId: json?.data?.message_id, raw: ok ? undefined : json };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}
