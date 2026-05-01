/**
 * Contact a remote agent and verify off-chain opt-in (no blockchain).
 *
 * 1) HTTP: GET {origin}/.well-known/arells-opt-in.json — expect arells/opt-in/v1 + EIP-191.
 * 2) Optional MCP (streamable HTTP): --mcp-url + JSON-RPC tools/call name arells_opt_in
 *
 * Usage:
 *   yarn start
 *   ARELLS_OPT_IN_AGENT_LABEL="Claude Bot #90210" ARELLS_OPT_IN_END_USER_ID=usr_k9f2a \
 *     yarn probe:opt-in -- --base http://127.0.0.1:3000
 *
 *   yarn probe:opt-in -- --base https://other-agent.example.com
 *   yarn probe:opt-in -- --mcp-url "https://tandem.ac/mcp"   # if that server exposes arells_opt_in
 *
 * Exit: 0 = opted in (signature OK), 1 = not opted in or misconfigured, 2 = bad args
 */

import { parseArgs } from "node:util";
import { verifyOptInPayload } from "../src/lib/protocol/opt-in";

const PROTOCOL_VERSIONS = ["2025-03-26", "2025-06-18", "2024-11-05"];

function originFromBase(base: string) {
  return new URL(base).origin;
}

async function postRpc(
  url: string,
  body: object,
  sessionHeaders: Record<string, string>,
) {
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
        "User-Agent": "Arells/probe-agent-opt-in",
        ...sessionHeaders,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text) as unknown;
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

function extractPayloadFromMcpResult(result: unknown): unknown {
  if (!result || typeof result !== "object") return null;
  const r = result as Record<string, unknown>;
  if (r.structuredContent) return r.structuredContent;
  const content = r.content;
  if (Array.isArray(content) && content[0] && typeof content[0] === "object") {
    const c0 = content[0] as Record<string, unknown>;
    if (c0.type === "text" && typeof c0.text === "string") {
      try {
        return JSON.parse(c0.text) as unknown;
      } catch {
        return null;
      }
    }
  }
  return null;
}

async function fetchWellKnown(base: string) {
  const url = `${originFromBase(base)}/.well-known/arells-opt-in.json`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Arells/probe-agent-opt-in" },
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    json = null;
  }
  return { url, status: res.status, ok: res.ok, json };
}

async function probeMcp(mcpUrl: string) {
  let sessionHeaders: Record<string, string> = {};
  let initialized = false;
  let lastInit: unknown;

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
          clientInfo: { name: "arells-probe-opt-in", version: "0.1.0" },
        },
      },
      sessionHeaders,
    );
    if (r.status === 200 && (r.json as { result?: unknown })?.result) {
      initialized = true;
      lastInit = r.json;
      if (r.sessionId) {
        sessionHeaders = { "mcp-session-id": r.sessionId };
      }
      break;
    }
  }

  if (!initialized) {
    return {
      ok: false as const,
      reason: "MCP initialize failed",
      detail: lastInit,
    };
  }

  await postRpc(
    mcpUrl,
    { jsonrpc: "2.0", method: "notifications/initialized" },
    sessionHeaders,
  );

  const listR = await postRpc(
    mcpUrl,
    { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
    sessionHeaders,
  );
  const listJson = listR.json as {
    result?: { tools?: { name: string }[] };
  };
  const tools = listJson?.result?.tools ?? [];
  const has = tools.some((t) => t.name === "arells_opt_in");
  if (!has) {
    return {
      ok: false as const,
      reason: "MCP server has no tool named arells_opt_in",
      tools: tools.map((t) => t.name),
    };
  }

  const callR = await postRpc(
    mcpUrl,
    {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "arells_opt_in", arguments: {} },
    },
    sessionHeaders,
  );
  const callJson = callR.json as { result?: unknown; error?: unknown };
  if (callR.status !== 200 || callJson.error) {
    return {
      ok: false as const,
      reason: "tools/call arells_opt_in failed",
      detail: callJson,
    };
  }
  const payload = extractPayloadFromMcpResult(callJson.result);
  if (!payload) {
    return {
      ok: false as const,
      reason: "could not parse opt-in payload from tools/call result",
      raw: callJson.result,
    };
  }
  return { ok: true as const, payload, transport: "mcp" as const };
}

async function main() {
  const { values } = parseArgs({
    options: {
      base: { type: "string" },
      "mcp-url": { type: "string" },
    },
    allowPositionals: true,
  });

  const base = values.base?.trim();
  const mcpUrl = values["mcp-url"]?.trim();

  if (!base && !mcpUrl) {
    console.error(
      "Usage: yarn probe:opt-in -- --base https://agent-origin [ --mcp-url https://host/mcp ]",
    );
    process.exit(2);
  }

  const sources: unknown[] = [];
  const report = { sources };

  if (base) {
    const w = await fetchWellKnown(base);
    const wk: Record<string, unknown> = {
      kind: "well-known",
      url: w.url,
      httpStatus: w.status,
    };

    if (w.ok && w.json) {
      const v = await verifyOptInPayload(w.json);
      wk.verify = v;
      sources.push(wk);
      if (v.optedIn) {
        console.log(
          JSON.stringify(
            {
              optedIn: true,
              narrative: v.narrative,
              signer: v.signer,
              agentLabel: v.agentLabel,
              endUserId: v.endUserId,
              issuedAt: v.issuedAt,
              source: "well-known",
              detail: report,
            },
            null,
            2,
          ),
        );
        process.exit(0);
      }
    } else {
      wk.error = !w.ok ? `HTTP ${w.status}` : "invalid JSON body";
      sources.push(wk);
      if (!mcpUrl) {
        console.log(
          JSON.stringify(
            {
              optedIn: false,
              reason: `well-known not available (${w.status})`,
              detail: report,
            },
            null,
            2,
          ),
        );
        process.exit(1);
      }
    }
  }

  if (base && !mcpUrl) {
    const wkSource = (
      sources as Array<{
        kind?: string;
        verify?: { optedIn: boolean; reason?: string };
      }>
    ).find((s) => s.kind === "well-known");
    if (wkSource?.verify && wkSource.verify.optedIn === false) {
      console.log(
        JSON.stringify(
          {
            optedIn: false,
            reason: wkSource.verify.reason,
            detail: report,
          },
          null,
          2,
        ),
      );
      process.exit(1);
    }
  }

  if (mcpUrl) {
    const m = await probeMcp(mcpUrl);
    sources.push({ kind: "mcp", url: mcpUrl, ...m });

    if (!m.ok) {
      console.log(
        JSON.stringify(
          {
            optedIn: false,
            reason: (m as { reason: string }).reason,
            detail: report,
          },
          null,
          2,
        ),
      );
      process.exit(1);
    }

    const v = await verifyOptInPayload(m.payload);
    if (!v.optedIn) {
      console.log(
        JSON.stringify(
          { optedIn: false, reason: v.reason, detail: report },
          null,
          2,
        ),
      );
      process.exit(1);
    }

    console.log(
      JSON.stringify(
        {
          optedIn: true,
          narrative: v.narrative,
          signer: v.signer,
          agentLabel: v.agentLabel,
          endUserId: v.endUserId,
          issuedAt: v.issuedAt,
          source: "mcp",
          detail: report,
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
