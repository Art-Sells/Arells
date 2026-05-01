import { NextRequest, NextResponse } from "next/server";

import { fetchWellKnownAndVerify } from "../../../../../lib/agent-registry/fetch-verify";
import { putAgentRegistryRecord } from "../../../../../lib/agent-registry/s3-store";

export const dynamic = "force-dynamic";

const MAX_ORIGINS = 40;

type Body = { origins?: string[] };

/**
 * POST /api/agent/registry/ingest
 * Automated job: Arells contacts each open agent origin, verifies opt-in, persists to S3.
 *
 * Authorization: Bearer ${ARELLS_REGISTRY_INGEST_SECRET}
 * Body: { "origins": [ "https://a.example.com", "https://b.example.com" ] }
 */
export async function POST(request: NextRequest) {
  const secret = process.env.ARELLS_REGISTRY_INGEST_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      {
        error:
          "Set ARELLS_REGISTRY_INGEST_SECRET and S3 bucket credentials for registry ingest.",
      },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const origins = Array.isArray(body.origins)
    ? body.origins.map((o) => String(o).trim()).filter(Boolean)
    : [];
  if (origins.length === 0) {
    return NextResponse.json(
      { error: 'Body must include origins: string[] (at least one URL)' },
      { status: 400 },
    );
  }
  if (origins.length > MAX_ORIGINS) {
    return NextResponse.json(
      { error: `At most ${MAX_ORIGINS} origins per request` },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const results: Array<{
    origin: string;
    stored: boolean;
    optedIn: boolean;
    error?: string;
  }> = [];

  for (const origin of origins) {
    const r = await fetchWellKnownAndVerify(origin);
    if (r.ok) {
      const put = await putAgentRegistryRecord({
        origin: r.origin,
        lastVerifiedAt: now,
        optedIn: true,
        signer: r.verified.signer,
        agentLabel: r.verified.agentLabel,
        endUserId: r.verified.endUserId,
        issuedAt: r.verified.issuedAt,
        narrative: r.verified.narrative,
        providerClaim: r.verified.providerClaim,
        productClaim: r.verified.productClaim,
        wellKnownUrl: r.wellKnownUrl,
        httpStatus: r.httpStatus,
      });
      results.push({
        origin: r.origin,
        stored: put.ok,
        optedIn: true,
        error: put.ok ? undefined : put.reason,
      });
    } else {
      const put = await putAgentRegistryRecord({
        origin: r.origin,
        lastVerifiedAt: now,
        optedIn: false,
        wellKnownUrl: r.wellKnownUrl,
        httpStatus: r.httpStatus,
        error: r.reason,
      });
      results.push({
        origin: r.origin,
        stored: put.ok,
        optedIn: false,
        error: put.ok ? r.reason : put.reason,
      });
    }
  }

  return NextResponse.json({
    schema: "arells/registry-ingest/v1",
    processedAt: now,
    count: results.length,
    results,
  });
}
