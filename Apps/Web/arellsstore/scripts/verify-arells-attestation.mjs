#!/usr/bin/env node
/**
 * Cryptographic proof: random challenge → GET /api/mcp/attestation → viem verifyMessage
 * Second layer: same challenge → POST /api/mcp/tools-call (MCP-shaped attest tool) → verify.
 *
 * Usage:
 *   node scripts/verify-arells-attestation.mjs --base http://localhost:3000
 */

import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import { verifyMessage } from "viem";

function randomChallenge() {
  return `prove-${randomBytes(16).toString("hex")}`;
}

async function verifyPayload(body, challenge, label) {
  const ok = await verifyMessage({
    address: body.signer,
    message: body.message,
    signature: body.signature,
  });
  if (!ok) {
    console.error(`${label}: verifyMessage returned false`);
    return false;
  }
  if (!body.message.includes(challenge)) {
    console.error(`${label}: challenge not in signed message`);
    return false;
  }
  console.error(`${label}: OK`);
  return true;
}

async function main() {
  const { values } = parseArgs({
    options: {
      base: { type: "string", default: "http://localhost:3000" },
    },
  });

  const base = values.base.replace(/\/$/, "");
  const challenge = randomChallenge();

  console.error(`Challenge: ${challenge}\n`);

  const urlGet = `${base}/api/mcp/attestation?challenge=${encodeURIComponent(challenge)}`;
  console.error(`1) GET ${urlGet}`);
  const res = await fetch(urlGet, {
    headers: { Accept: "application/json" },
  });
  const getBody = await res.json();

  if (!res.ok) {
    console.error(JSON.stringify(getBody, null, 2));
    process.exit(1);
  }

  let ok = await verifyPayload(getBody, challenge, "GET attestation");
  if (!ok) process.exit(2);

  const urlPost = `${base}/api/mcp/tools-call`;
  console.error(`\n2) POST ${urlPost}`);
  const res2 = await fetch(urlPost, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "attest",
      arguments: { challenge },
    }),
  });
  const postBody = await res2.json();

  if (!res2.ok) {
    console.error(JSON.stringify(postBody, null, 2));
    process.exit(3);
  }

  const att = postBody.attestation ?? postBody.result?.structuredContent;
  if (!att?.signer || !att?.message || !att?.signature) {
    console.error("POST response missing attestation payload");
    process.exit(4);
  }

  ok = await verifyPayload(att, challenge, "POST tools-call");
  if (!ok) process.exit(5);

  console.log(
    JSON.stringify(
      {
        verified: true,
        signer: att.signer,
        layers: ["GET /api/mcp/attestation", "POST /api/mcp/tools-call"],
      },
      null,
      2),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
