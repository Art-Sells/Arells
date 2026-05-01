#!/usr/bin/env node
/**
 * Verify a remote URL is a real MCP (streamable HTTP) server: JSON-RPC initialize + optional tools/list.
 *
 * You need the full MCP path from the registry (e.g. https://api.inference.sh/mcp), not just the site origin.
 *
 * Usage:
 *   node scripts/mcp-probe-handshake.mjs --url "https://api.inference.sh/mcp"
 *   node scripts/mcp-probe-handshake.mjs --url "https://tandem.ac/mcp" --tools
 *
 * Ref: https://modelcontextprotocol.io/specification/2025-03-26/basic/transports
 */

import { parseArgs } from "node:util";

const PROTOCOL_VERSIONS = ["2025-03-26", "2025-06-18", "2024-11-05"];

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
        "User-Agent": "Arells/mcp-probe-handshake",
        ...headers,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { _raw: text.slice(0, 2000) };
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
    options: {
      url: { type: "string" },
      tools: { type: "boolean", default: false },
    },
  });

  const endpoint = values.url?.trim();
  if (!endpoint) {
    console.error(
      'Usage: node scripts/mcp-probe-handshake.mjs --url "https://host/path/to/mcp" [--tools]',
    );
    process.exit(2);
  }

  let sessionHeaders = {};
  let initialized = false;

  for (const protocolVersion of PROTOCOL_VERSIONS) {
    const initBody = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion,
        capabilities: {},
        clientInfo: { name: "arells-probe", version: "0.1.0" },
      },
    };

    console.error(`Trying protocolVersion=${protocolVersion} …`);
    const r = await postRpc(endpoint, initBody, sessionHeaders);

    if (r.status === 200 && r.json?.result) {
      initialized = true;
      console.log(JSON.stringify({ step: "initialize", ok: true, protocolVersion }, null, 2));
      console.log(JSON.stringify(r.json, null, 2));
      if (r.sessionId) {
        sessionHeaders["mcp-session-id"] = r.sessionId;
        console.error(`Session: ${r.sessionId}`);
      }
      break;
    }

    if (r.json?.error) {
      console.error(`Initialize failed (${protocolVersion}):`, r.json.error);
    } else {
      console.error(`HTTP ${r.status}`, typeof r.json === "object" ? r.json : r);
    }
  }

  if (!initialized) {
    console.error(
      "\nNo successful initialize. Check: full MCP URL (often …/mcp), auth (401), or network.",
    );
    process.exit(1);
  }

  const noteBody = {
    jsonrpc: "2.0",
    method: "notifications/initialized",
  };
  await postRpc(endpoint, noteBody, sessionHeaders);

  if (values.tools) {
    const toolsBody = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    };
    const tr = await postRpc(endpoint, toolsBody, sessionHeaders);
    console.log(JSON.stringify({ step: "tools/list", status: tr.status }, null, 2));
    console.log(JSON.stringify(tr.json, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
