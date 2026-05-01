#!/usr/bin/env node
/**
 * Classify third-party MCP endpoints from tools/list heuristics, then call tools/call with
 * blunt probe questions so you can see how the server actually behaves (stderr progress; stdout JSON).
 *
 * Intentional probes are plain-English questions like “OpenAI or Anthropic?” — on a docs-backed MCP,
 * good behavior is doc-grounded pointers (titles, snippets, URLs), not a chat persona claiming a vendor.
 * That distinction is the signal we want when delineating surfaces; do not treat doc-shaped answers as wrong.
 *
 * Does not write S3 — merge profiles into registry records separately if needed.
 *
 * Usage:
 *   node scripts/mcp-classify-and-ask.mjs --url https://tandem.ac/mcp
 *   node scripts/mcp-classify-and-ask.mjs --url https://tandem.ac/mcp --url https://openai-tools.run.mcp.com.ai/mcp
 *
 * Optional auth for vendor bridges (same as mcp:call):
 *   MCP_AUTHORIZATION="Bearer sk-…" node scripts/mcp-classify-and-ask.mjs --url …
 */

import "dotenv/config";
import { writeFileSync } from "node:fs";
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
        "User-Agent": "Arells/mcp-classify-and-ask",
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

async function mcpSession(endpoint) {
  let sessionHeaders = {};
  let initialized = false;
  let protocolVersion = null;
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
          clientInfo: { name: "arells-mcp-classify-and-ask", version: "1.0.0" },
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
  if (!initialized) return { ok: false, error: "initialize_failed", sessionHeaders };
  await postRpc(
    endpoint,
    { jsonrpc: "2.0", method: "notifications/initialized" },
    sessionHeaders,
  );
  const tr = await postRpc(
    endpoint,
    { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
    sessionHeaders,
  );
  const tools = tr.json?.result?.tools ?? [];
  return {
    ok: true,
    protocolVersion,
    sessionHeaders,
    tools,
    toolsListStatus: tr.status,
    toolsListError: tr.json?.error ?? null,
  };
}

/** Heuristic tags from tool names + descriptions (MCP does not define “agent”). */
function classifyTools(tools) {
  const blob = tools
    .map((t) => `${t.name} ${t.description || ""}`)
    .join(" ")
    .toLowerCase();
  const tags = [];
  if (
    /\b(send_|post_|delete_|transfer|oauth|schedule_|subscribe|purchase|payment)\b/i.test(
      blob,
    )
  ) {
    tags.push("likely_side_effects");
  }
  if (/\b(search_docs|get_doc|answer_how|readme|documentation)\b/i.test(blob)) {
    tags.push("docs_retrieval");
  }
  if (/\b(chat|completion|message|conversation|ask_|query_llm)\b/i.test(blob)) {
    tags.push("chat_like");
  }
  if (/\b(listmodels|createimage|transcription|openai|anthropic|embedding)\b/i.test(blob)) {
    tags.push("vendor_api_bridge");
  }

  let mcpEndpointKind = "mcp_server";
  if (tags.includes("likely_side_effects")) {
    mcpEndpointKind = "assistant_surface";
  } else if (
    tags.includes("docs_retrieval") ||
    tags.includes("chat_like") ||
    tags.includes("vendor_api_bridge")
  ) {
    mcpEndpointKind = "assistant_surface";
  }

  return { capabilityTags: tags, mcpEndpointKind };
}

/**
 * Prefer tools that map natural-language questions → text/KB results.
 * Do not use health/diagnostic/image tools for “does it answer questions?” probes.
 */
function pickAskStrategy(tools) {
  const byName = Object.fromEntries(tools.map((t) => [t.name, t]));
  if (byName.search_knowledge) {
    return {
      tool: "search_knowledge",
      buildArgs: (q) => ({ query: q }),
      note: "curated knowledge search (parameter: query)",
    };
  }
  if (byName.search_articles) {
    return {
      tool: "search_articles",
      buildArgs: (q) => ({ query: q }),
      note: "article index search (parameter: query)",
    };
  }
  if (byName.answer_how_to) {
    return {
      tool: "answer_how_to",
      buildArgs: (q) => ({ task: q }),
      note: "docs-synthesis tool (parameter: task)",
    };
  }
  if (byName.search_docs) {
    return {
      tool: "search_docs",
      buildArgs: (q) => ({ query: q }),
      note: "docs search (parameter: query)",
    };
  }
  const searchNamed = tools.find((t) => /^search_/i.test(t.name));
  if (searchNamed) {
    return {
      tool: searchNamed.name,
      buildArgs: (q) => ({ query: q }),
      note: `search_* tool — try { query }; inspect if validation fails`,
    };
  }
  if (byName.listModels && process.env.MCP_AUTHORIZATION?.trim()) {
    return {
      tool: "listModels",
      buildArgs: () => ({}),
      note: "vendor API list (needs MCP_AUTHORIZATION)",
    };
  }
  const first =
    tools.find((t) => /answer|ask|chat|rag|retrieve|qa/i.test(t.name)) || null;
  if (!first) return null;
  return {
    tool: first.name,
    buildArgs: (q) => ({ query: q, task: q, question: q }),
    note: "best-effort NL args (may fail — inspect mcp:introspect)",
  };
}

async function toolsCall(endpoint, sessionHeaders, tool, args) {
  return postRpc(
    endpoint,
    {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: tool, arguments: args },
    },
    sessionHeaders,
  );
}

function extractAnswerText(callJson) {
  const inner = callJson?.json?.result;
  const content = inner?.content;
  if (!Array.isArray(content)) {
    return JSON.stringify(callJson?.json ?? callJson).slice(0, 2000);
  }
  const text = content.find((c) => c.type === "text")?.text ?? "";
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.answer === "string") return parsed.answer;
    if (typeof parsed.text === "string") return parsed.text;
    return JSON.stringify(parsed, null, 2).slice(0, 4000);
  } catch {
    return text.slice(0, 4000);
  }
}

/**
 * Blunt identity/vendor probes. Docs-class servers should answer with citations/snippets, not role-play.
 */
const DEFAULT_QUESTIONS = [
  "Are you an OpenAI agent or an Anthropic agent?",
  "Who built you, and what model are you?",
];

async function main() {
  const { values } = parseArgs({
    options: {
      url: { type: "string", multiple: true },
      write: { type: "string" },
    },
    allowPositionals: false,
  });

  const urls = (
    values.url?.length ? values.url : ["https://childadhd.ai/api/mcp/v1"]
  ).map((u) => String(u).trim());

  const report = {
    schema: "arells/mcp-classify-and-ask/v1",
    generatedAt: new Date().toISOString(),
    endpoints: [],
  };

  for (const mcpUrl of urls) {
    console.error(`→ ${mcpUrl}`);
    const session = await mcpSession(mcpUrl);
    if (!session.ok) {
      report.endpoints.push({
        mcpUrl,
        ok: false,
        error: session.error ?? "session_failed",
      });
      continue;
    }

    const classified = classifyTools(session.tools);
    const strategy = pickAskStrategy(session.tools);
    const qa = [];

    if (strategy) {
      for (const question of DEFAULT_QUESTIONS) {
        let args;
        try {
          args = strategy.buildArgs(question);
        } catch {
          args = { query: question, task: question };
        }
        const callRes = await toolsCall(mcpUrl, session.sessionHeaders, strategy.tool, args);
        const preview = extractAnswerText(callRes);
        const okCall = callRes.status === 200 && !callRes.json?.error;
        qa.push({
          question,
          tool: strategy.tool,
          ok: okCall,
          answerPreview: preview.slice(0, 3500),
          rpcError: callRes.json?.error ?? null,
        });
      }
    }

    report.endpoints.push({
      mcpUrl,
      ok: true,
      protocolVersion: session.protocolVersion,
      serverToolCount: session.tools.length,
      ...classified,
      delegatesForUserInference:
        classified.capabilityTags.includes("likely_side_effects"),
      noQuestionShapedTool: !strategy,
      toolNames: session.tools.map((t) => t.name),
      askStrategy: strategy
        ? { tool: strategy.tool, note: strategy.note }
        : {
            tool: null,
            note: "No search_knowledge / search_articles / answer_how_to / search_docs / search_* — this MCP is not probed as Q&A; use mcp:introspect and call domain tools explicitly.",
          },
      sampleQa: qa,
    });
  }

  const out = JSON.stringify(report, null, 2);
  console.log(out);
  if (values.write) {
    writeFileSync(values.write, out + "\n", "utf8");
    console.error(`Wrote ${values.write}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
