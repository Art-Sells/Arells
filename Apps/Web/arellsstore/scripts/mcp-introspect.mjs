#!/usr/bin/env node
/**
 * One third-party MCP URL → full initialize result + tools/list (names + descriptions).
 * Use this to see if the server advertises a model in serverInfo or tool text (not standardized).
 *
 *   node scripts/mcp-introspect.mjs --url "https://tandem.ac/mcp"
 */

import { parseArgs } from "node:util";

const PROTOCOL_VERSIONS = ["2025-03-26", "2025-06-18", "2024-11-05"];

function extraHeadersFromEnv() {
  const raw = process.env.MCP_AUTHORIZATION?.trim();
  if (!raw) return {};
  return { Authorization: raw };
}

async function postRpc(url, body, headers = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        "User-Agent": "Arells/mcp-introspect",
        ...extraHeadersFromEnv(),
        ...headers,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { _raw: text.slice(0, 4000) };
    }
    return {
      status: res.status,
      sessionId: res.headers.get("mcp-session-id") || res.headers.get("Mcp-Session-Id"),
      json,
    };
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  const { values } = parseArgs({
    options: { url: { type: "string" } },
  });
  const endpoint = values.url?.trim();
  if (!endpoint) {
    console.error('Usage: node scripts/mcp-introspect.mjs --url "https://host/…/mcp"');
    process.exit(2);
  }

  let sessionHeaders = {};
  let initResult = null;
  let protocolVersion = null;

  for (const pv of PROTOCOL_VERSIONS) {
    const r = await postRpc(
      endpoint,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: pv,
          capabilities: {},
          clientInfo: { name: "arells-introspect", version: "1.0.0" },
        },
      },
      sessionHeaders,
    );
    if (r.status === 200 && r.json?.result) {
      initResult = r.json.result;
      protocolVersion = pv;
      if (r.sessionId) sessionHeaders["mcp-session-id"] = r.sessionId;
      break;
    }
    if (r.sessionId) sessionHeaders["mcp-session-id"] = r.sessionId;
  }

  if (!initResult) {
    console.log(JSON.stringify({ ok: false, error: "initialize failed" }, null, 2));
    process.exit(1);
  }

  await postRpc(
    endpoint,
    { jsonrpc: "2.0", method: "notifications/initialized" },
    sessionHeaders,
  );

  const tr = await postRpc(
    endpoint,
    { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
    sessionHeaders,
  );

  const tools = tr.json?.result?.tools ?? null;
  const toolsSummary = Array.isArray(tools)
    ? tools.map((t) => ({
        name: t.name,
        description: (t.description || "").slice(0, 300),
      }))
    : tr.json?.error ?? null;

  const serverInfo = initResult?.serverInfo ?? null;

  console.log(
    JSON.stringify(
      {
        ok: true,
        mcpUrl: endpoint,
        protocolVersionNegotiated: protocolVersion,
        /** Sometimes includes name/version; rarely includes model id — vendor-specific. */
        serverInfo,
        initializeResultKeys: initResult ? Object.keys(initResult) : [],
        toolsListHttpStatus: tr.status,
        toolsListError: tr.json?.error ?? null,
        tools: toolsSummary,
        hints: {
          llm:
            "MCP does not standardize “which LLM”. Check serverInfo + tool descriptions for strings like GPT/Claude; otherwise unknown without OAuth or their docs.",
          usdc:
            "Not in MCP handshake. Need a wallet address (on-chain balanceOf) or a tool that returns balance.",
        },
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
