import { verifyMessage } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { getAttestationPrivateKey } from "./attestation";

export const OPT_IN_TERMS = "arells/terms/v1";
export const OPT_IN_SCHEMA = "arells/opt-in/v1" as const;

/** Published by agents at GET /.well-known/arells-opt-in.json (and optionally MCP tool arells_opt_in). */
export type OptInPayload = {
  schema: typeof OPT_IN_SCHEMA;
  scheme: "eth_personal_sign";
  message: string;
  signature: `0x${string}`;
  signer: `0x${string}`;
  issuedAt: string;
  /** Duplicated from signed message for consumers that do not re-parse `message`. */
  agentLabel: string;
  endUserId: string;
  nonce: string;
  terms: string;
  /** Optional self-attested labels (signed as part of `message`). Not proof of external vendor. */
  providerClaim?: string;
  productClaim?: string;
};

export function getOptInPrivateKey(): `0x${string}` | null {
  const o = process.env.ARELLS_OPT_IN_PRIVATE_KEY?.trim();
  if (o && o.startsWith("0x") && o.length >= 66) {
    return o as `0x${string}`;
  }
  return getAttestationPrivateKey();
}

export function getOptInAgentLabel(): string {
  return process.env.ARELLS_OPT_IN_AGENT_LABEL?.trim() || "Arells MCP";
}

export function getOptInEndUserId(): string {
  return process.env.ARELLS_OPT_IN_END_USER_ID?.trim() || "unattributed";
}

/** Optional: e.g. anthropic, openai, google — signed disclosure only. */
export function getOptInProviderClaim(): string | undefined {
  const v = process.env.ARELLS_OPT_IN_PROVIDER?.trim();
  return v || undefined;
}

/** Optional: e.g. Claude, ChatGPT, custom MCP — signed disclosure only. */
export function getOptInProductClaim(): string | undefined {
  const v = process.env.ARELLS_OPT_IN_PRODUCT?.trim();
  return v || undefined;
}

export function buildOptInMessage(input: {
  agentLabel: string;
  endUserId: string;
  nonce: string;
  issuedAt: string;
  providerClaim?: string;
  productClaim?: string;
}) {
  const {
    agentLabel,
    endUserId,
    nonce,
    issuedAt,
    providerClaim,
    productClaim,
  } = input;
  const lines = [
    "Arells Opt-In v1",
    `Agent: ${agentLabel}`,
    `EndUser: ${endUserId}`,
  ];
  if (providerClaim) {
    lines.push(`Provider: ${providerClaim}`);
  }
  if (productClaim) {
    lines.push(`Product: ${productClaim}`);
  }
  lines.push(
    `Terms: ${OPT_IN_TERMS}`,
    `IssuedAt: ${issuedAt}`,
    `Nonce: ${nonce}`,
  );
  return lines.join("\n");
}

export async function signOptIn(
  privateKey: `0x${string}`,
  input: {
    agentLabel: string;
    endUserId: string;
    providerClaim?: string;
    productClaim?: string;
  },
): Promise<OptInPayload> {
  const account = privateKeyToAccount(privateKey);
  const issuedAt = new Date().toISOString();
  const nonce = `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 18)}`;
  const message = buildOptInMessage({
    agentLabel: input.agentLabel,
    endUserId: input.endUserId,
    nonce,
    issuedAt,
    providerClaim: input.providerClaim,
    productClaim: input.productClaim,
  });
  const signature = await account.signMessage({ message });
  const payload: OptInPayload = {
    schema: OPT_IN_SCHEMA,
    scheme: "eth_personal_sign",
    message,
    signature,
    signer: account.address,
    issuedAt,
    agentLabel: input.agentLabel,
    endUserId: input.endUserId,
    nonce,
    terms: OPT_IN_TERMS,
  };
  if (input.providerClaim) payload.providerClaim = input.providerClaim;
  if (input.productClaim) payload.productClaim = input.productClaim;
  return payload;
}

function parseOptInMessage(message: string): {
  ok: true;
  agentLabel: string;
  endUserId: string;
  terms: string;
  providerClaim?: string;
  productClaim?: string;
} | { ok: false; reason: string } {
  const lines = message.split("\n");
  if (lines[0]?.trim() !== "Arells Opt-In v1") {
    return { ok: false, reason: "message does not start with Arells Opt-In v1" };
  }
  const map: Record<string, string> = {};
  for (const line of lines.slice(1)) {
    const m = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (m) map[m[1]] = m[2].trim();
  }
  if (!map.Agent) return { ok: false, reason: "missing Agent: line" };
  if (!map.EndUser) return { ok: false, reason: "missing EndUser: line" };
  if (!map.Terms) return { ok: false, reason: "missing Terms: line" };
  if (map.Terms !== OPT_IN_TERMS) {
    return { ok: false, reason: `Terms mismatch (expected ${OPT_IN_TERMS})` };
  }
  const out: {
    ok: true;
    agentLabel: string;
    endUserId: string;
    terms: string;
    providerClaim?: string;
    productClaim?: string;
  } = {
    ok: true,
    agentLabel: map.Agent,
    endUserId: map.EndUser,
    terms: map.Terms,
  };
  if (map.Provider) out.providerClaim = map.Provider;
  if (map.Product) out.productClaim = map.Product;
  return out;
}

export type OptInVerifyResult =
  | {
      optedIn: true;
      signer: `0x${string}`;
      agentLabel: string;
      endUserId: string;
      issuedAt: string;
      narrative: string;
      /** Signed by agent key — self-attested, not vendor-proof. */
      providerClaim?: string;
      productClaim?: string;
    }
  | { optedIn: false; reason: string };

export async function verifyOptInPayload(
  body: unknown,
): Promise<OptInVerifyResult> {
  if (!body || typeof body !== "object") {
    return { optedIn: false, reason: "payload is not an object" };
  }
  const p = body as Partial<OptInPayload>;
  if (p.schema !== OPT_IN_SCHEMA) {
    return { optedIn: false, reason: `schema is not ${OPT_IN_SCHEMA}` };
  }
  if (
    !p.message ||
    !p.signature ||
    !p.signer ||
    typeof p.message !== "string" ||
    typeof p.signature !== "string" ||
    typeof p.signer !== "string"
  ) {
    return { optedIn: false, reason: "missing message, signature, or signer" };
  }
  const parsed = parseOptInMessage(p.message);
  if (!parsed.ok) {
    return { optedIn: false, reason: parsed.reason };
  }
  const ok = await verifyMessage({
    address: p.signer as `0x${string}`,
    message: p.message,
    signature: p.signature as `0x${string}`,
  });
  if (!ok) {
    return { optedIn: false, reason: "verifyMessage failed" };
  }
  if (p.agentLabel && p.agentLabel !== parsed.agentLabel) {
    return {
      optedIn: false,
      reason: "agentLabel field does not match signed message",
    };
  }
  if (p.endUserId && p.endUserId !== parsed.endUserId) {
    return {
      optedIn: false,
      reason: "endUserId field does not match signed message",
    };
  }
  if (
    p.providerClaim !== undefined &&
    p.providerClaim !== parsed.providerClaim
  ) {
    return {
      optedIn: false,
      reason: "providerClaim field does not match signed message",
    };
  }
  if (p.productClaim !== undefined && p.productClaim !== parsed.productClaim) {
    return {
      optedIn: false,
      reason: "productClaim field does not match signed message",
    };
  }
  const issuedAt =
    typeof p.issuedAt === "string" ? p.issuedAt : "(from message only)";
  const narrative = `Agent ${parsed.agentLabel}, used by end-user id ${parsed.endUserId}, has opted in (verified signer ${p.signer}).`;
  const success: Extract<OptInVerifyResult, { optedIn: true }> = {
    optedIn: true,
    signer: p.signer as `0x${string}`,
    agentLabel: parsed.agentLabel,
    endUserId: parsed.endUserId,
    issuedAt,
    narrative,
  };
  if (parsed.providerClaim) success.providerClaim = parsed.providerClaim;
  if (parsed.productClaim) success.productClaim = parsed.productClaim;
  return success;
}
