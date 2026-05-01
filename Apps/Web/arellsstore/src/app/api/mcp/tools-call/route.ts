import { NextRequest, NextResponse } from "next/server";

import {
  ATTESTATION_CHALLENGE_RE,
  getAttestationPrivateKey,
  signAttestation,
} from "../../../../lib/protocol/attestation";
import {
  getOptInAgentLabel,
  getOptInEndUserId,
  getOptInPrivateKey,
  getOptInProductClaim,
  getOptInProviderClaim,
  signOptIn,
} from "../../../../lib/protocol/opt-in";

/**
 * MCP-shaped tool invocation (subset): `attest` (challenge), `arells_opt_in` (opt-in proof).
 * POST JSON: { "name": "attest", "arguments": { "challenge": "..." } }
 * POST JSON: { "name": "arells_opt_in", "arguments": {} }
 */

type Body = {
  name?: string;
  arguments?: { challenge?: string };
};

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim();

  if (name === "arells_opt_in") {
    const pk = getOptInPrivateKey();
    if (!pk) {
      return NextResponse.json(
        {
          error:
            "Opt-in not configured. Set ARELLS_OPT_IN_PRIVATE_KEY or ARELLS_ATTESTATION_PRIVATE_KEY.",
        },
        { status: 503 },
      );
    }
    try {
      const optIn = await signOptIn(pk, {
        agentLabel: getOptInAgentLabel(),
        endUserId: getOptInEndUserId(),
        providerClaim: getOptInProviderClaim(),
        productClaim: getOptInProductClaim(),
      });
      const text = JSON.stringify(optIn);
      return NextResponse.json({
        schema: "arells/tools-call/v1",
        tool: "arells_opt_in",
        result: {
          content: [{ type: "text", text }],
          structuredContent: optIn,
          isError: false,
        },
        optIn,
      });
    } catch {
      return NextResponse.json(
        { error: "Opt-in signing failed." },
        { status: 500 },
      );
    }
  }

  if (name !== "attest") {
    return NextResponse.json(
      {
        error:
          'Unknown tool. Supported: attest | arells_opt_in — see /api/mcp/offering',
      },
      { status: 400 },
    );
  }

  const challenge = body.arguments?.challenge?.trim() ?? "";
  if (!challenge || !ATTESTATION_CHALLENGE_RE.test(challenge)) {
    return NextResponse.json(
      {
        error:
          "Invalid challenge in arguments.challenge (8-512 chars; allowed: alnum._:=+-)",
      },
      { status: 400 },
    );
  }

  const pk = getAttestationPrivateKey();
  if (!pk) {
    return NextResponse.json(
      {
        error:
          "Attestation not configured. Set ARELLS_ATTESTATION_PRIVATE_KEY.",
      },
      { status: 503 },
    );
  }

  try {
    const attestation = await signAttestation(challenge, pk);
    const text = JSON.stringify(attestation);

    return NextResponse.json({
      schema: "arells/tools-call/v1",
      tool: "attest",
      result: {
        content: [{ type: "text", text }],
        structuredContent: attestation,
        isError: false,
      },
      attestation,
    });
  } catch {
    return NextResponse.json(
      { error: "Signing failed. Check ARELLS_ATTESTATION_PRIVATE_KEY." },
      { status: 500 },
    );
  }
}
