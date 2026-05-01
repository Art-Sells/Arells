#!/usr/bin/env node
/**
 * Automated ingest: POST /api/agent/registry/ingest (Arells contacts each agent, verifies opt-in, writes S3).
 *
 * Requires: ARELLS_REGISTRY_INGEST_SECRET, INGEST_BASE_URL (default http://127.0.0.1:3000), S3 on the server.
 *
 * Usage:
 *   ARELLS_REGISTRY_INGEST_SECRET=… INGEST_BASE_URL=https://arells.com \
 *     node scripts/arells-ingest-agents.mjs -- https://a.com https://b.com
 *
 * Or one per line from file:
 *   node scripts/arells-ingest-agents.mjs --file ./out/agent-urls.txt
 */

import "dotenv/config";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

async function main() {
  const secret = process.env.ARELLS_REGISTRY_INGEST_SECRET?.trim();
  if (!secret) {
    console.error("Set ARELLS_REGISTRY_INGEST_SECRET");
    process.exit(2);
  }

  const base = (process.env.INGEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      file: { type: "string" },
    },
  });

  const origins = [];
  if (values.file) {
    const text = readFileSync(values.file, "utf8");
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (t && !t.startsWith("#")) origins.push(t);
    }
  }
  for (const p of positionals) {
    if (p.trim()) origins.push(p.trim());
  }

  if (origins.length === 0) {
    console.error(
      "Usage: node scripts/arells-ingest-agents.mjs [--file urls.txt] https://origin1 …",
    );
    process.exit(2);
  }

  const url = `${base}/api/agent/registry/ingest`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ origins }),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.error(text);
    process.exit(1);
  }

  console.log(JSON.stringify(json, null, 2));
  if (!res.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
