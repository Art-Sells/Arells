#!/usr/bin/env node
/**
 * Fast batch check: (1) Did this open agent opt in? (2) MVT token position for signer on Arells contracts.
 *
 * For **USDC balance + signed Provider/Product claims** (more general), use `yarn agents:disclosure-local`.
 *
 * Link: opt-in JSON includes `signer` (EOA). Same address is `agent` for Arells MCP / ProfitEngine position.
 *
 * Uses YOUR Arells deployment for both calls (same chain as MVT_* contracts).
 *
 * Usage:
 *   ARELLS_API_BASE=https://arells.com node scripts/agent-opt-in-and-position.mjs https://a.com https://b.com
 *   ARELLS_API_BASE=http://127.0.0.1:3000 node scripts/agent-opt-in-and-position.mjs --file ./urls.txt
 *
 * Parallelism: all origins fetched concurrently (adjust BATCH if you hit rate limits).
 */

import "dotenv/config";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

const BATCH = 25;

async function profile(base, origin) {
  const u = new URL("/api/agent/profile", base);
  u.searchParams.set("origin", origin);
  const res = await fetch(u.toString(), {
    headers: { Accept: "application/json", "User-Agent": "Arells/agent-opt-in-and-position" },
  });
  const json = await res.json();
  return json;
}

async function position(base, agentAddr) {
  const u = `${base.replace(/\/$/, "")}/api/mcp/position?agent=${encodeURIComponent(agentAddr)}`;
  const res = await fetch(u, {
    headers: { Accept: "application/json", "User-Agent": "Arells/agent-opt-in-and-position" },
  });
  const text = await res.text();
  try {
    return { status: res.status, body: JSON.parse(text) };
  } catch {
    return { status: res.status, body: text.slice(0, 400) };
  }
}

async function one(base, origin) {
  const prof = await profile(base, origin);
  const cryptoOk = prof.cryptographic?.ok === true;
  const signer = prof.cryptographic?.signer;

  if (!cryptoOk || !signer) {
    return {
      origin,
      optedIn: false,
      reason: prof.cryptographic?.reason ?? prof.error ?? "no valid opt-in",
      position: null,
    };
  }

  const pos = await position(base, signer);
  const posOk = pos.status === 200 && pos.body && typeof pos.body === "object" && !pos.body.error;

  return {
    origin,
    optedIn: true,
    signer,
    agentLabel: prof.agent?.label,
    endUserId: prof.userFromAgent?.declaredId,
    position: posOk ? pos.body : { error: pos.body?.error ?? pos.body },
  };
}

async function main() {
  const base = (process.env.ARELLS_API_BASE || "http://127.0.0.1:3000").replace(/\/$/, "");

  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { file: { type: "string" } },
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
      "Usage: ARELLS_API_BASE=https://… node scripts/agent-opt-in-and-position.mjs [--file urls.txt] https://origin …",
    );
    process.exit(2);
  }

  const chunks = [];
  for (let i = 0; i < origins.length; i += BATCH) {
    chunks.push(origins.slice(i, i + BATCH));
  }

  const results = [];
  for (const chunk of chunks) {
    const part = await Promise.all(chunk.map((o) => one(base, o)));
    results.push(...part);
  }

  console.log(JSON.stringify({ arellsApiBase: base, count: results.length, results }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
