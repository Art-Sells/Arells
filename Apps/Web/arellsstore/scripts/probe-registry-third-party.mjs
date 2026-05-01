#!/usr/bin/env node
/**
 * Third-party agents only: pull MCP remote URLs from the public MCP Registry, then
 * JSON-RPC initialize (+ optional tools/list). No Arells URLs, no /.well-known/arells-opt-in.json.
 *
 * Usage:
 *   node scripts/probe-registry-third-party.mjs --limit 15 --max-probes 8 --tools
 *   node scripts/probe-registry-third-party.mjs --max-probes 15 --skip 40 --tools   # probe a different slice (skip first 40 URLs)
 *
 * Env:
 *   REGISTRY_PAGES=2   # minimum registry pages to walk; script may fetch more pages when --skip needs more rows
 */

import { parseArgs } from "node:util";

const REGISTRY = "https://registry.modelcontextprotocol.io/v0.1/servers";
const PROTOCOL_VERSIONS = ["2025-03-26", "2025-06-18", "2024-11-05"];

async function fetchRegistryPage(cursor, limit) {
  const u = new URL(REGISTRY);
  u.searchParams.set("limit", String(limit));
  if (cursor) u.searchParams.set("cursor", cursor);
  const res = await fetch(u, {
    headers: { Accept: "application/json", "User-Agent": "Arells/probe-registry-third-party" },
  });
  if (!res.ok) throw new Error(`Registry ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Collect unique streamable-http / sse remote MCP URLs (full path, not just origin). */
function collectRemoteUrls(data) {
  const urls = new Set();
  const meta = [];
  for (const item of data.servers || []) {
    const s = item.server;
    if (!s?.remotes) continue;
    for (const r of s.remotes) {
      if (r.type !== "streamable-http" && r.type !== "sse") continue;
      if (!r.url) continue;
      try {
        new URL(r.url);
      } catch {
        continue;
      }
      if (!urls.has(r.url)) {
        urls.add(r.url);
        meta.push({
          mcpUrl: r.url,
          type: r.type,
          serverName: s.name || "",
          serverTitle: s.title || "",
        });
      }
    }
  }
  return { urls: [...urls], meta };
}

async function postRpc(url, body, headers = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        "User-Agent": "Arells/probe-registry-third-party",
        ...headers,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { _parseError: text.slice(0, 400) };
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

async function probeOne(mcpUrl, wantTools) {
  let sessionHeaders = {};
  let protocolVersion = null;
  let initialized = false;

  for (const pv of PROTOCOL_VERSIONS) {
    const r = await postRpc(
      mcpUrl,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: pv,
          capabilities: {},
          clientInfo: { name: "arells-third-party-probe", version: "1.0.0" },
        },
      },
      sessionHeaders,
    );
    if (r.status === 200 && r.json?.result) {
      initialized = true;
      protocolVersion = pv;
      if (r.sessionId) sessionHeaders["mcp-session-id"] = r.sessionId;
      break;
    }
    if (r.sessionId) sessionHeaders["mcp-session-id"] = r.sessionId;
  }

  if (!initialized) {
    return {
      mcpUrl,
      ok: false,
      step: "initialize",
      detail: "no protocol version succeeded",
    };
  }

  await postRpc(
    mcpUrl,
    { jsonrpc: "2.0", method: "notifications/initialized" },
    sessionHeaders,
  );

  let toolsPreview = null;
  let toolsListError = null;
  if (wantTools) {
    const tr = await postRpc(
      mcpUrl,
      { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
      sessionHeaders,
    );
    if (tr.json?.result?.tools) {
      toolsPreview = tr.json.result.tools.map((x) => x.name).slice(0, 40);
    } else if (tr.json?.error) {
      toolsListError = tr.json.error;
    }
  }

  return {
    mcpUrl,
    ok: true,
    protocolVersion,
    toolsPreview,
    toolsListError,
  };
}

async function main() {
  const { values } = parseArgs({
    options: {
      limit: { type: "string", default: "40" },
      "max-probes": { type: "string", default: "12" },
      skip: { type: "string", default: "0" },
      tools: { type: "boolean", default: false },
      pages: { type: "string", default: "1" },
    },
  });

  const perPage = Math.min(100, Math.max(1, Number(values.limit) || 40));
  const maxProbes = Math.min(50, Math.max(1, Number(values["max-probes"]) || 12));
  const skip = Math.min(10_000, Math.max(0, Number(values.skip) || 0));
  const pagesFloor = Math.min(
    100,
    Math.max(1, Number(process.env.REGISTRY_PAGES || values.pages) || 1),
  );
  /** Need enough unique MCP URLs to skip then probe. */
  const needUnique = skip + maxProbes;
  /** Walk at least `pages` pages, and enough pages to cover `needUnique` rows (plus buffer). */
  const maxPagesWalk = Math.min(
    100,
    Math.max(pagesFloor, Math.ceil(needUnique / Math.max(1, perPage)) + 3),
  );

  const orderedUnique = [];
  const seen = new Set();
  let cursor = undefined;
  let pagesWalked = 0;

  while (orderedUnique.length < needUnique && pagesWalked < maxPagesWalk) {
    let data;
    try {
      data = await fetchRegistryPage(cursor, perPage);
    } catch (e) {
      console.error(
        JSON.stringify(
          {
            ok: false,
            step: "registry_fetch",
            page: pagesWalked,
            cursor: cursor ?? null,
            detail: e instanceof Error ? e.message : String(e),
          },
          null,
          2,
        ),
      );
      process.exit(1);
    }
    const { meta } = collectRemoteUrls(data);
    for (const m of meta) {
      if (seen.has(m.mcpUrl)) continue;
      seen.add(m.mcpUrl);
      orderedUnique.push(m);
      if (orderedUnique.length >= needUnique) break;
    }
    cursor = data.metadata?.nextCursor;
    pagesWalked++;
    if (!cursor || (data.servers || []).length === 0) break;
  }

  const queue = orderedUnique.slice(skip, skip + maxProbes);

  console.error(
    `Registry → ${queue.length} endpoint(s) to probe (skip=${skip}, max-probes=${maxProbes}, unique-collected=${orderedUnique.length}, pages-walked=${pagesWalked})\n`,
  );

  const results = [];
  for (const row of queue) {
    try {
      const r = await probeOne(row.mcpUrl, values.tools);
      results.push({
        ...row,
        ...r,
      });
    } catch (e) {
      results.push({
        ...row,
        mcpUrl: row.mcpUrl,
        ok: false,
        step: "probe",
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const okCount = results.filter((x) => x.ok).length;
  console.log(
    JSON.stringify(
      {
        source: REGISTRY,
        thirdPartyOnly: true,
        noArellsOptInRequired: true,
        skip,
        uniqueUrlsCollected: orderedUnique.length,
        registryPagesWalked: pagesWalked,
        probed: results.length,
        initializeOk: okCount,
        results,
      },
      null,
      2,
    ),
  );

  process.exit(okCount > 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
