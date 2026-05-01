import { assertAgentOriginAllowedForFetch } from "../protocol/agent-profile-fetch";
import { verifyOptInPayload } from "../protocol/opt-in";

const FETCH_MS = 15_000;

export type FetchVerifySuccess = {
  ok: true;
  origin: string;
  wellKnownUrl: string;
  httpStatus: number;
  payload: unknown;
  verified: {
    signer: `0x${string}`;
    agentLabel: string;
    endUserId: string;
    issuedAt: string;
    narrative: string;
    providerClaim?: string;
    productClaim?: string;
  };
};

export type FetchVerifyFailure = {
  ok: false;
  origin: string;
  wellKnownUrl?: string;
  httpStatus?: number;
  reason: string;
};

export type FetchVerifyResult = FetchVerifySuccess | FetchVerifyFailure;

/**
 * Arells contacts an open agent at GET /.well-known/arells-opt-in.json and verifies EIP-191.
 * Fully automatable (used by registry ingest + live profile API).
 */
export async function fetchWellKnownAndVerify(
  originParam: string,
): Promise<FetchVerifyResult> {
  let base: URL;
  try {
    base = new URL(originParam);
    if (!base.pathname.endsWith("/")) {
      base.pathname += "/";
    }
  } catch {
    return { ok: false, origin: originParam, reason: "Invalid origin URL." };
  }

  const originOnly = new URL(base.origin);
  const block = assertAgentOriginAllowedForFetch(originOnly);
  if (block) {
    return { ok: false, origin: originOnly.origin, reason: block };
  }

  const wellKnown = new URL("/.well-known/arells-opt-in.json", originOnly).href;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_MS);

  let rawText: string;
  let status: number;
  try {
    const res = await fetch(wellKnown, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        Accept: "application/json",
        "User-Agent": "Arells/agent-registry/1.0",
      },
    });
    status = res.status;
    rawText = await res.text();
  } catch (e) {
    clearTimeout(t);
    const msg = e instanceof Error ? e.message : "fetch failed";
    return {
      ok: false,
      origin: originOnly.origin,
      wellKnownUrl: wellKnown,
      reason: `Could not reach agent: ${msg}`,
    };
  } finally {
    clearTimeout(t);
  }

  let json: unknown;
  try {
    json = JSON.parse(rawText) as unknown;
  } catch {
    return {
      ok: false,
      origin: originOnly.origin,
      wellKnownUrl: wellKnown,
      httpStatus: status,
      reason: "Response is not valid JSON.",
    };
  }

  const verified = await verifyOptInPayload(json);
  if (!verified.optedIn) {
    return {
      ok: false,
      origin: originOnly.origin,
      wellKnownUrl: wellKnown,
      httpStatus: status,
      reason: verified.reason,
    };
  }

  return {
    ok: true,
    origin: originOnly.origin,
    wellKnownUrl: wellKnown,
    httpStatus: status,
    payload: json,
    verified: {
      signer: verified.signer,
      agentLabel: verified.agentLabel,
      endUserId: verified.endUserId,
      issuedAt: verified.issuedAt,
      narrative: verified.narrative,
      ...(verified.providerClaim !== undefined && {
        providerClaim: verified.providerClaim,
      }),
      ...(verified.productClaim !== undefined && {
        productClaim: verified.productClaim,
      }),
    },
  };
}
