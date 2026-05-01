#!/usr/bin/env node
/**
 * Ask a third-party MCP server by invoking tools/call — their backend can answer in plain language.
 *
 * Flow: initialize → notifications/initialized → tools/call
 *
 * Pick `--tool` from `yarn mcp:introspect --url …` (each server defines its own tool schemas).
 *
 * Tandem’s tools are docs-backed (search/synthesize published docs). For vendor APIs (e.g.
 * openai-tools.run.mcp.com.ai), tools like listModels need Authorization — set MCP_AUTHORIZATION
 * to the full header value, e.g. `Bearer sk-...`.
 *
 * Example (Tandem — docs synthesis; parameter is `task`):
 *   node scripts/mcp-tools-call.mjs --url "https://tandem.ac/mcp" --tool answer_how_to --arguments '{"task":"How do I install Tandem?"}'
 *
 * The reply is whatever that server returns (self-reported), not cryptographic proof.
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
  const t = setTimeout(() => ctrl.abort(), 120_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        "User-Agent": "Arells/mcp-tools-call",
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
      json = { _raw: text.slice(0, 8000) };
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
      tool: { type: "string" },
      arguments: { type: "string", default: "{}" },
    },
  });

  const endpoint = values.url?.trim();
  const toolName = values.tool?.trim();
  if (!endpoint || !toolName) {
    console.error(
      'Usage: node scripts/mcp-tools-call.mjs --url "https://host/mcp" --tool TOOL_NAME [--arguments \'{"k":"v"}\']',
    );
    process.exit(2);
  }

  let argsObj;
  try {
    argsObj = JSON.parse(values.arguments || "{}");
  } catch {
    console.error("--arguments must be valid JSON");
    process.exit(2);
  }

  let sessionHeaders = {};
  let initialized = false;

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
          clientInfo: { name: "arells-mcp-tools-call", version: "1.0.0" },
        },
      },
      sessionHeaders,
    );
    if (r.status === 200 && r.json?.result) {
      initialized = true;
      if (r.sessionId) sessionHeaders["mcp-session-id"] = r.sessionId;
      break;
    }
    if (r.sessionId) sessionHeaders["mcp-session-id"] = r.sessionId;
  }

  if (!initialized) {
    console.log(JSON.stringify({ ok: false, step: "initialize" }, null, 2));
    process.exit(1);
  }

  await postRpc(
    endpoint,
    { jsonrpc: "2.0", method: "notifications/initialized" },
    sessionHeaders,
  );

  const callRes = await postRpc(
    endpoint,
    {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: argsObj,
      },
    },
    sessionHeaders,
  );

  console.log(
    JSON.stringify(
      {
        ok: callRes.status === 200 && !callRes.json?.error,
        httpStatus: callRes.status,
        tool: toolName,
        arguments: argsObj,
        result: callRes.json,
      },
      null,
      2,
    ),
  );

  process.exit(callRes.json?.error ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
