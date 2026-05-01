#!/usr/bin/env node
/**
 * Local end-to-end: Next app (this repo) verifies opt-in on given origin(s), writes JSON to S3,
 * then reads GET /api/agent/registry — no production deploy required.
 *
 * Prerequisites:
 *   1. `.env` has S3_BUCKET_NAME, WS_REGION, WS_ACCESS_KEY_ID, WS_SECRET_ACCESS_KEY (same as Amplify).
 *   2. `.env` has ARELLS_REGISTRY_INGEST_SECRET (any strong random string).
 *   3. For agent origin `http://127.0.0.1:3000`, set ALLOW_AGENT_PROFILE_LOCALHOST=1 so the server can fetch loopback.
 *   4. Run `yarn build && yarn start` (or `yarn dev`) so /.well-known/arells-opt-in.json is served with keys set.
 *
 * Usage:
 *   yarn test:registry:s3-local http://127.0.0.1:3000
 *   yarn test:registry:s3-local https://some-remote-agent.example.com
 */

import "dotenv/config";

function requireEnv(name) {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(`Missing ${name} in environment (.env)`);
    process.exit(2);
  }
  return v;
}

async function main() {
  const bucket = process.env.S3_BUCKET_NAME?.trim();
  const region = process.env.WS_REGION?.trim() || process.env.AWS_REGION?.trim();
  const ak = process.env.WS_ACCESS_KEY_ID?.trim();
  const sk = process.env.WS_SECRET_ACCESS_KEY?.trim();

  if (!bucket || !region || !ak || !sk) {
    console.error(
      "Need S3_BUCKET_NAME, WS_REGION, WS_ACCESS_KEY_ID, WS_SECRET_ACCESS_KEY in .env for registry ingest.",
    );
    process.exit(2);
  }

  const secret = requireEnv("ARELLS_REGISTRY_INGEST_SECRET");
  const base = (process.env.INGEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

  const origins = process.argv.slice(2).map((s) => s.trim()).filter(Boolean);
  if (origins.length === 0) {
    console.error(
      "Usage: yarn test:registry:s3-local <origin> [origin …]\n  Example: yarn test:registry:s3-local http://127.0.0.1:3000",
    );
    process.exit(2);
  }

  console.error(`S3 bucket: ${bucket} (${region})\nIngest API: ${base}\nOrigins: ${origins.join(", ")}\n`);

  const ingestUrl = `${base}/api/agent/registry/ingest`;
  const ingestRes = await fetch(ingestUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ origins }),
  });

  const ingestText = await ingestRes.text();
  let ingestJson;
  try {
    ingestJson = JSON.parse(ingestText);
  } catch {
    console.error("Ingest non-JSON:", ingestText.slice(0, 800));
    process.exit(1);
  }

  console.log(JSON.stringify({ step: "ingest", httpStatus: ingestRes.status, body: ingestJson }, null, 2));

  if (!ingestRes.ok) {
    process.exit(1);
  }

  const listUrl = `${base}/api/agent/registry`;
  const listRes = await fetch(listUrl, { headers: { Accept: "application/json" } });
  const listText = await listRes.text();
  let listJson;
  try {
    listJson = JSON.parse(listText);
  } catch {
    console.error("Registry list non-JSON:", listText.slice(0, 800));
    process.exit(1);
  }

  console.log(JSON.stringify({ step: "registry_list", httpStatus: listRes.status, body: listJson }, null, 2));

  if (!listRes.ok || listJson.configured === false) {
    console.error("\nRegistry returned not configured — ensure Next process loaded S3 env vars.");
    process.exit(1);
  }

  console.error("\nOK: ingest ran and registry JSON was returned (S3-backed list).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
