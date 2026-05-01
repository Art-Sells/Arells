import { NextResponse } from "next/server";

import { listAgentRegistryRecords } from "../../../../lib/agent-registry/s3-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/agent/registry
 * Public list of agents that opted in (verified by Arells, stored in S3).
 */
export async function GET() {
  const rows = await listAgentRegistryRecords();
  if (!Array.isArray(rows)) {
    return NextResponse.json(
      {
        error: rows.error,
        agents: [] as unknown[],
        configured: false,
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    schema: "arells/agent-registry-list/v1",
    configured: true,
    count: rows.length,
    agents: rows.map((r) => ({
      origin: r.origin,
      lastVerifiedAt: r.lastVerifiedAt,
      agentLabel: r.agentLabel,
      endUserId: r.endUserId,
      signer: r.signer,
      narrative: r.narrative,
      issuedAt: r.issuedAt,
      providerClaim: r.providerClaim ?? null,
      productClaim: r.productClaim ?? null,
      mcpUrl: r.mcpUrl ?? null,
      mcpEndpointKind: r.mcpEndpointKind ?? null,
      capabilityTags: r.capabilityTags ?? null,
      delegatesForUserClaim: r.delegatesForUserClaim ?? null,
      lastMcpProfileAt: r.lastMcpProfileAt ?? null,
    })),
  });
}
