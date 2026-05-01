/**
 * Integration tests against **live public agents** — network required.
 *
 * - MCP: hits a real streamable HTTP MCP (default: Tandem production MCP).
 * - Opt-in: only runs when AGENTS_LIVE_OPT_IN_ORIGIN points at a host that serves
 *   `/.well-known/arells-opt-in.json` (e.g. your deployed Arells with keys configured).
 *
 * Run:
 *   yarn test:agents:live
 *
 * Optional:
 *   AGENTS_LIVE_MCP_URL=https://tandem.ac/mcp
 *   AGENTS_LIVE_OPT_IN_ORIGIN=https://your-deploy.com
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { fetchWellKnownAndVerify } from "../../src/lib/agent-registry/fetch-verify";

const PROTOCOL_VERSIONS = ["2025-03-26", "2025-06-18", "2024-11-05"];

/** Production MCP used as default — not a placeholder domain. */
const DEFAULT_LIVE_MCP = "https://tandem.ac/mcp";

function envMcpUrl() {
  return (
    process.env.AGENTS_LIVE_MCP_URL?.trim() || DEFAULT_LIVE_MCP
  );
}

function envOptInOrigin() {
  return process.env.AGENTS_LIVE_OPT_IN_ORIGIN?.trim() || "";
}

async function postRpc(
  url: string,
  body: object,
  sessionHeaders: Record<string, string>,
) {
  const res = await fetch(url, {
    method: "POST",
    redirect: "follow",
    signal: AbortSignal.timeout(35_000),
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
      "User-Agent": "Arells/agents-live-test",
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

async function mcpInitializeOk(endpoint: string) {
  let sessionHeaders: Record<string, string> = {};
  for (const protocolVersion of PROTOCOL_VERSIONS) {
    const r = await postRpc(
      endpoint,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion,
          capabilities: {},
          clientInfo: { name: "arells-live-test", version: "1.0.0" },
        },
      },
      sessionHeaders,
    );
    if (r.status === 200 && (r.json as { result?: unknown })?.result) {
      return { ok: true as const, protocolVersion };
    }
    if (r.sessionId) {
      sessionHeaders = { "mcp-session-id": r.sessionId };
    }
  }
  return { ok: false as const };
}

describe("live open agents (integration)", () => {
  it("streamable MCP server responds to initialize (real remote endpoint)", async () => {
    const url = envMcpUrl();
    const r = await mcpInitializeOk(url);
    assert.equal(
      r.ok,
      true,
      `expected MCP initialize to succeed at ${url} — check network or set AGENTS_LIVE_MCP_URL`,
    );
    if (r.ok) {
      assert.ok(r.protocolVersion, "protocol version returned");
    }
  });

  it(
    "optional: origin publishes verifiable Arells opt-in",
    { skip: !envOptInOrigin() },
    async () => {
      const origin = envOptInOrigin();
      const r = await fetchWellKnownAndVerify(origin);
      assert.equal(
        r.ok,
        true,
        r.ok === false
          ? `opt-in failed: ${r.reason} — set AGENTS_LIVE_OPT_IN_ORIGIN to a host that serves /.well-known/arells-opt-in.json`
          : "unexpected",
      );
      if (r.ok) {
        assert.ok(r.verified.signer.startsWith("0x"));
        assert.ok(r.verified.agentLabel.length > 0);
      }
    },
  );
});
