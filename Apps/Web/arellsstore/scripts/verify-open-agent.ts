/**
 * Test whether a URL looks like a real *open agent* (not just a static site):
 * 1) Arells opt-in signature verifies (agent chose to publish + sign)
 * 2) Common discovery: /.well-known/agent.json or mcp.json
 * 3) Optional: --mcp-url full MCP path → JSON-RPC initialize succeeds
 *
 * Exit 0 only if (1) passes. Use summary.strongProtocolEvidence for extra trust in “agent surfaces.”
 * Localhost: set NODE_ENV=development or ALLOW_AGENT_PROFILE_LOCALHOST=1 (same as other probes).
 *
 * Usage:
 *   yarn verify:open-agent -- --base https://example.com
 *   yarn verify:open-agent -- --base https://tandem.ac --mcp-url "https://tandem.ac/mcp"
 */

import { parseArgs } from "node:util";

import { fetchWellKnownAndVerify } from "../src/lib/agent-registry/fetch-verify";

const PROTOCOL_VERSIONS = ["2025-03-26", "2025-06-18", "2024-11-05"];

async function headDiscovery(origin: string) {
  const base = origin.replace(/\/$/, "");
  const paths = [
    "/.well-known/agent.json",
    "/.well-known/mcp.json",
  ] as const;
  const out: Record<string, { ok: boolean; status: number }> = {};
  for (const p of paths) {
    const url = `${base}${p}`;
    try {
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(12_000),
        headers: {
          Accept: "application/json",
          "User-Agent": "Arells/verify-open-agent",
        },
      });
      out[p] = { ok: res.ok, status: res.status };
    } catch {
      out[p] = { ok: false, status: 0 };
    }
  }
  return out;
}

async function postRpc(
  url: string,
  body: object,
  sessionHeaders: Record<string, string>,
) {
  const res = await fetch(url, {
    method: "POST",
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
      "User-Agent": "Arells/verify-open-agent",
      ...sessionHeaders,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    json = { _raw: text.slice(0, 500) };
  }
  return {
    status: res.status,
    sessionId: res.headers.get("mcp-session-id") || res.headers.get("Mcp-Session-Id"),
    json,
  };
}

async function tryMcpInitialize(mcpUrl: string) {
  let sessionHeaders: Record<string, string> = {};
  for (const protocolVersion of PROTOCOL_VERSIONS) {
    const r = await postRpc(
      mcpUrl,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion,
          capabilities: {},
          clientInfo: { name: "arells-verify-open-agent", version: "0.1.0" },
        },
      },
      sessionHeaders,
    );
    if (r.status === 200 && (r.json as { result?: unknown })?.result) {
      return {
        ok: true as const,
        protocolVersion,
        sessionId: r.sessionId,
      };
    }
    if (r.sessionId) {
      sessionHeaders = { "mcp-session-id": r.sessionId };
    }
  }
  return { ok: false as const, reason: "initialize never returned 200 with result" };
}

async function main() {
  const { values } = parseArgs({
    options: {
      base: { type: "string" },
      "mcp-url": { type: "string" },
    },
  });

  const baseIn = values.base?.trim();
  if (!baseIn) {
    console.error(
      'Usage: yarn verify:open-agent -- --base https://agent.example.com [--mcp-url "https://host/mcp"]',
    );
    process.exit(2);
  }

  let origin: string;
  try {
    origin = new URL(baseIn).origin;
  } catch {
    console.error("Invalid --base URL");
    process.exit(2);
  }

  const mcpUrl = values["mcp-url"]?.trim();

  const [optIn, discovery] = await Promise.all([
    fetchWellKnownAndVerify(baseIn),
    headDiscovery(origin),
  ]);

  const hasAgentJson = discovery["/.well-known/agent.json"]?.ok;
  const hasMcpJson = discovery["/.well-known/mcp.json"]?.ok;
  const mcpProbe = mcpUrl ? await tryMcpInitialize(mcpUrl) : null;

  const optInOk = optIn.ok;
  const strongProtocolEvidence = hasAgentJson || hasMcpJson || mcpProbe?.ok;

  const summary = {
    /** Cryptographic: this host published a valid Arells opt-in (the bar for your registry). */
    arellsOptInVerified: optInOk,
    /** At least one of: A2A-style agent.json, mcp.json, or (if you passed --mcp-url) MCP initialize. */
    hasStandardAgentMetadata: hasAgentJson || hasMcpJson,
    /** You passed --mcp-url and MCP streamable HTTP initialize returned 200 + result. */
    mcpStreamableHttpOk: mcpProbe?.ok === true,
    /**
     * Extra confidence the host is a “real” agent surface, not only a static opt-in file.
     * False is OK: some agents only expose Arells opt-in + their own API.
     */
    strongProtocolEvidence,
  };

  if (!optInOk) {
    (summary as Record<string, unknown>).optInFailure =
      optIn.ok === false ? optIn.reason : undefined;
  }

  console.log(
    JSON.stringify(
      {
        origin,
        wellKnownArellsOptIn: optIn,
        discovery,
        mcpInitialize: mcpProbe,
        summary,
        note:
          "This does not prove which LLM is behind the agent — only protocol reachability + Arells opt-in crypto + optional MCP handshake.",
      },
      null,
      2,
    ),
  );

  process.exit(optInOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
