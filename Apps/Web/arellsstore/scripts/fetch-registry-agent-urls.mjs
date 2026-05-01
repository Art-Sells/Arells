#!/usr/bin/env node
/**
 * List public MCP "remote" HTTP origins from the official MCP Registry (read-only).
 * Source: GET https://registry.modelcontextprotocol.io/v0.1/servers
 *
 * Usage:
 *   node scripts/fetch-registry-agent-urls.mjs
 *   node scripts/fetch-registry-agent-urls.mjs --limit 50
 *   node scripts/fetch-registry-agent-urls.mjs --limit 20 --write urls-from-registry.txt
 *
 * Does not ping — use ping-agent-location.mjs on the written file (--file).
 */

import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

const REGISTRY = "https://registry.modelcontextprotocol.io/v0.1/servers";

function originFromRemoteUrl(u) {
  try {
    const x = new URL(u);
    return x.origin;
  } catch {
    return null;
  }
}

async function fetchPage(cursor, limit) {
  const u = new URL(REGISTRY);
  u.searchParams.set("limit", String(limit));
  if (cursor) u.searchParams.set("cursor", cursor);
  const res = await fetch(u, {
    headers: { Accept: "application/json", "User-Agent": "Arells/fetch-registry" },
  });
  if (!res.ok) throw new Error(`Registry ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  const { values } = parseArgs({
    options: {
      limit: { type: "string", default: "30" },
      write: { type: "string" },
      pages: { type: "string", default: "1" },
    },
  });

  const perPage = Math.min(100, Math.max(1, Number(values.limit) || 30));
  const maxPages = Math.min(20, Math.max(1, Number(values.pages) || 1));

  const origins = new Set();
  const details = [];
  let cursor = undefined;

  for (let p = 0; p < maxPages; p++) {
    const data = await fetchPage(cursor, perPage);
    const list = data.servers || [];
    for (const item of list) {
      const s = item.server;
      if (!s?.remotes) continue;
      for (const r of s.remotes) {
        if (r.type !== "streamable-http" && r.type !== "sse") continue;
        if (!r.url) continue;
        const o = originFromRemoteUrl(r.url);
        if (!o) continue;
        if (!origins.has(o)) {
          origins.add(o);
          details.push({ origin: o, name: s.name, remote: r.url, type: r.type });
        }
      }
    }
    cursor = data.metadata?.nextCursor;
    if (!cursor || list.length === 0) break;
  }

  const sorted = [...origins].sort();
  console.error(`Unique origins from registry (this run): ${sorted.length}\n`);
  for (const line of sorted) console.log(line);

  if (values.write) {
    writeFileSync(values.write, sorted.join("\n") + "\n", "utf8");
    console.error(`\nWrote ${sorted.length} lines → ${values.write}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
