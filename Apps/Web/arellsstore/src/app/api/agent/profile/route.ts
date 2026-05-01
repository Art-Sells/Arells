import { NextRequest, NextResponse } from "next/server";

import { fetchWellKnownAndVerify } from "../../../../lib/agent-registry/fetch-verify";

/**
 * GET /api/agent/profile?origin=https://agent.example.com
 * Live check: Arells contacts the agent and verifies opt-in (same logic as automated ingest).
 */
export async function GET(request: NextRequest) {
  const originParam = request.nextUrl.searchParams.get("origin")?.trim();
  if (!originParam) {
    return NextResponse.json(
      { error: "Missing query parameter: origin (e.g. https://agent.example.com)" },
      { status: 400 },
    );
  }

  const r = await fetchWellKnownAndVerify(originParam);

  if (!r.ok) {
    return NextResponse.json(
      {
        origin: r.origin,
        wellKnownUrl: r.wellKnownUrl,
        httpStatus: r.httpStatus,
        cryptographic: { ok: false, reason: r.reason },
        modelProvider: { status: "unverified" as const },
        disclosure: modelProviderDisclosure(),
      },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      origin: r.origin,
      wellKnownUrl: r.wellKnownUrl,
      httpStatus: r.httpStatus,
      cryptographic: {
        ok: true,
        signer: r.verified.signer,
        issuedAt: r.verified.issuedAt,
        narrative: r.verified.narrative,
      },
      agent: {
        label: r.verified.agentLabel,
        /** Written into the signed message by whoever controls the agent’s signing key. */
        labelScope: "signed_by_agent_key",
      },
      /** End-user id the agent chose to include in its signed opt-in message. */
      userFromAgent: {
        declaredId: r.verified.endUserId,
        idScope: "signed_by_agent_key",
      },
      disclosuresFromAgent: {
        /** Self-attested in signed message — not vendor-verified. */
        providerClaim: r.verified.providerClaim ?? null,
        productClaim: r.verified.productClaim ?? null,
      },
      modelProvider: {
        status: "unverified" as const,
        summary:
          "Claude, ChatGPT, etc. are not proven by this signature alone. The agent’s key signed this text — it can say anything in the message.",
      },
      disclosure: modelProviderDisclosure(),
    },
    { status: 200 },
  );
}

function modelProviderDisclosure() {
  return {
    provenNow: [
      "The open agent returned `/.well-known/arells-opt-in.json` and the EIP-191 signature verifies.",
      "The signed plaintext includes Agent and EndUser lines — committed by whoever controls that agent signing key.",
    ],
    notProvenBySignatureAlone: [
      "That the stack behind the URL actually calls Anthropic, OpenAI, or any named API.",
      "That the EndUser string maps to a specific real-world person without separate identity checks.",
    ],
    pathToStrongProviderAssurance: [
      "Later: link a provider account or route inference through Arells so the UI can show a provider-backed badge.",
    ],
  };
}
