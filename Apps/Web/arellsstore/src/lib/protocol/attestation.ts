import { privateKeyToAccount } from "viem/accounts";

/** Client-supplied challenge (fresh nonce). */
export const ATTESTATION_CHALLENGE_RE =
  /^[a-zA-Z0-9._:=+-]{8,512}$/;

export function buildAttestationMessage(challenge: string, issuedAt: string) {
  return [
    "Arells MCP Attestation v1",
    `Challenge: ${challenge}`,
    `IssuedAt: ${issuedAt}`,
  ].join("\n");
}

export type AttestationPayload = {
  schema: "arells/attestation/v1";
  scheme: "eth_personal_sign";
  message: string;
  signature: `0x${string}`;
  signer: `0x${string}`;
  issuedAt: string;
  chainContext: string;
};

export async function signAttestation(
  challenge: string,
  privateKey: `0x${string}`,
): Promise<AttestationPayload> {
  const issuedAt = new Date().toISOString();
  const message = buildAttestationMessage(challenge, issuedAt);
  const account = privateKeyToAccount(privateKey);
  const signature = await account.signMessage({ message });
  return {
    schema: "arells/attestation/v1",
    scheme: "eth_personal_sign",
    message,
    signature,
    signer: account.address,
    issuedAt,
    chainContext:
      "Signature proves control of signer EOA at IssuedAt; verify with viem verifyMessage.",
  };
}

export function getAttestationPrivateKey(): `0x${string}` | null {
  const pk = process.env.ARELLS_ATTESTATION_PRIVATE_KEY?.trim();
  if (!pk || !pk.startsWith("0x") || pk.length < 66) return null;
  return pk as `0x${string}`;
}
