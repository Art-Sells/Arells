import { NextRequest, NextResponse } from "next/server";

import {
  ATTESTATION_CHALLENGE_RE,
  getAttestationPrivateKey,
  signAttestation,
} from "../../../../lib/protocol/attestation";

/** EIP-191 personal_sign attestation — proves possession of ARELLS_ATTESTATION_PRIVATE_KEY at request time. */

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("challenge")?.trim() ?? "";
  if (!raw || !ATTESTATION_CHALLENGE_RE.test(raw)) {
    return NextResponse.json(
      {
        error:
          "Invalid or missing challenge. Use ?challenge=<8-512 chars alnum._:=+->",
      },
      { status: 400 },
    );
  }

  const pk = getAttestationPrivateKey();
  if (!pk) {
    return NextResponse.json(
      {
        error:
          "Attestation not configured. Set ARELLS_ATTESTATION_PRIVATE_KEY (0x-prefixed secp256k1 private key, dedicated key — not user funds).",
      },
      { status: 503 },
    );
  }

  try {
    const out = await signAttestation(raw, pk);
    return NextResponse.json(out);
  } catch {
    return NextResponse.json(
      { error: "Signing failed. Check ARELLS_ATTESTATION_PRIVATE_KEY." },
      { status: 500 },
    );
  }
}
