#!/usr/bin/env node
/**
 * Broadest public sweep: walk the official MCP Registry until the cursor ends (or --max-pages).
 * Emits every unique streamable-http / sse remote URL plus server metadata — bigger than
 * fetch-registry-agent-urls.mjs (which collapses to origins only).
 *
 * Source (same as other scripts): GET https://registry.modelcontextprotocol.io/v0.1/servers
 *
 * Usage:
 *   node scripts/registry-catalog-broad.mjs
 *   node scripts/registry-catalog-broad.mjs --max-pages 80 --per-page 100
 *   node scripts/registry-catalog-broad.mjs --write registry-endpoints.json
 *   node scripts/registry-catalog-broad.mjs --text   # one URL per line only
 *   node scripts/registry-catalog-broad.mjs --concrete-only   # drop template URLs like https://{host}/mcp
 */

import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

const REGISTRY = "https://registry.modelcontextprotocol.io/v0.1/servers";

async function fetchRegistryPage(cursor, limit) {
  const u = new URL(REGISTRY);
  u.searchParams.set("limit", String(limit));
  if (cursor) u.searchParams.set("cursor", cursor);
  const res = await fetch(u, {
    headers: { Accept: "application/json", "User-Agent": "Arells/registry-catalog-broad" },
  });
  if (!res.ok) throw new Error(`Registry ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Registry sometimes lists install templates, not live HTTPS origins (e.g. https://{host}/mcp). */
function isConcreteMcpUrl(url) {
  if (!/^https:\/\//i.test(url)) return false;
  if (/[{][^}]*[}]/.test(url)) return false;
  return true;
}

/** Dedupe by full MCP URL; collect metadata per URL (first occurrence wins). */
function mergePage(byUrl, data, concreteOnly) {
  let added = 0;
  for (const item of data.servers || []) {
    const s = item.server;
    if (!s?.remotes) continue;
    for (const r of s.remotes) {
      if (r.type !== "streamable-http" && r.type !== "sse") continue;
      if (!r.url) continue;
      if (concreteOnly && !isConcreteMcpUrl(r.url)) continue;
      try {
        new URL(r.url);
      } catch {
        continue;
      }
      if (byUrl.has(r.url)) continue;
      byUrl.set(r.url, {
        mcpUrl: r.url,
        type: r.type,
        serverName: s.name || "",
        serverTitle: s.title || "",
      });
      added++;
    }
  }
  return added;
}

async function main() {
  const { values } = parseArgs({
    options: {
      "per-page": { type: "string", default: "100" },
      "max-pages": { type: "string", default: "500" },
      write: { type: "string" },
      text: { type: "boolean", default: false },
      "concrete-only": { type: "boolean", default: false },
    },
  });

  const perPage = Math.min(100, Math.max(1, Number(values["per-page"]) || 100));
  const maxPages = Math.min(2000, Math.max(1, Number(values["max-pages"]) || 500));

  const byUrl = new Map();
  let cursor = undefined;
  let pageCount = 0;
  let serverRows = 0;
  /** @type {"registry-exhausted"|"max-pages"|"empty-page"} */
  let stoppedBecause = "registry-exhausted";

  while (pageCount < maxPages) {
    let data;
    try {
      data = await fetchRegistryPage(cursor, perPage);
    } catch (e) {
      console.error(
        JSON.stringify(
          {
            ok: false,
            step: "registry_fetch",
            page: pageCount,
            detail: e instanceof Error ? e.message : String(e),
          },
          null,
          2,
        ),
      );
      process.exit(1);
    }
    pageCount++;
    serverRows += (data.servers || []).length;
    mergePage(byUrl, data, values["concrete-only"]);
    cursor = data.metadata?.nextCursor;
    if ((data.servers || []).length === 0) {
      stoppedBecause = "empty-page";
      break;
    }
    if (!cursor) {
      stoppedBecause = "registry-exhausted";
      break;
    }
  }

  if (pageCount >= maxPages && cursor) stoppedBecause = "max-pages";

  const endpoints = [...byUrl.values()].sort((a, b) => a.mcpUrl.localeCompare(b.mcpUrl));

  const summary = {
    ok: true,
    registry: REGISTRY,
    pagesFetched: pageCount,
    stoppedBecause,
    perPage,
    maxPages,
    concreteOnly: Boolean(values["concrete-only"]),
    registryServerRowsSeen: serverRows,
    uniqueStreamableEndpoints: endpoints.length,
    endpoints,
  };

  if (values.text) {
    for (const e of endpoints) console.log(e.mcpUrl);
    console.error(
      `# ${endpoints.length} unique MCP endpoint URLs (${summary.stoppedBecause}; ${pageCount} page(s) read)`,
    );
    process.exit(0);
  }

  const out = JSON.stringify(summary, null, 2);
  console.log(out);

  if (values.write) {
    writeFileSync(values.write, out + "\n", "utf8");
    console.error(`Wrote ${values.write}`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
