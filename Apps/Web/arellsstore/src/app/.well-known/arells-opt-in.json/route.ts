import { NextResponse } from "next/server";

import {
  getOptInAgentLabel,
  getOptInEndUserId,
  getOptInPrivateKey,
  getOptInProductClaim,
  getOptInProviderClaim,
  signOptIn,
} from "../../../lib/protocol/opt-in";

/**
 * Machine-readable opt-in proof (EIP-191). Agents publish this at the same path.
 * @see scripts/probe-agent-opt-in.ts
 */
export async function GET() {
  const pk = getOptInPrivateKey();
  if (!pk) {
    return NextResponse.json(
      {
        error:
          "Opt-in not configured. Set ARELLS_OPT_IN_PRIVATE_KEY or ARELLS_ATTESTATION_PRIVATE_KEY, and optional ARELLS_OPT_IN_AGENT_LABEL / ARELLS_OPT_IN_END_USER_ID.",
      },
      { status: 503 },
    );
  }

  try {
    const payload = await signOptIn(pk, {
      agentLabel: getOptInAgentLabel(),
      endUserId: getOptInEndUserId(),
      providerClaim: getOptInProviderClaim(),
      productClaim: getOptInProductClaim(),
    });
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "Opt-in signing failed." }, { status: 500 });
  }
}
