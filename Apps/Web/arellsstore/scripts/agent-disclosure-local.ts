/**
 * Local one-shot: for each agent origin,
 * 1) Verify Arells opt-in (same as ingest / profile)
 * 2) Read USDC balance on Base or Base Sepolia for the opt-in signer (real on-chain fact)
 * 3) Surface Provider/Product lines from the signed message (self-attested)
 *
 * Uses .env: MVT_NETWORK, BASE_RPC_URL / BASE_SEPOLIA_RPC_URL, MVT_USDC_ADDRESS (same as the app).
 *
 * Usage (from repo root, no deployed Arells required for step 1 if agents are reachable):
 *   yarn agents:disclosure-local -- --origin https://agent.example.com
 *   yarn agents:disclosure-local -- --file ./urls.txt
 */

import "dotenv/config";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { erc20Abi } from "viem";

import { fetchWellKnownAndVerify } from "../src/lib/agent-registry/fetch-verify";
import { ARELLS_ADDRESSES } from "../src/lib/protocol/addresses";
import { publicClient } from "../src/lib/protocol/client";

async function usdcBalance(wallet: `0x${string}`) {
  const usdc = ARELLS_ADDRESSES.usdc;
  if (!usdc) {
    return {
      skipped: true as const,
      reason: "MVT_USDC_ADDRESS not set in .env",
    };
  }
  const raw = await publicClient.readContract({
    address: usdc,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [wallet],
  });
  const decimals = await publicClient.readContract({
    address: usdc,
    abi: erc20Abi,
    functionName: "decimals",
  });
  return {
    skipped: false as const,
    usdcContract: usdc,
    balanceRaw: raw.toString(),
    decimals: Number(decimals),
  };
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      origin: { type: "string" },
      file: { type: "string" },
    },
  });

  const origins: string[] = [];
  if (values.file) {
    const text = readFileSync(values.file, "utf8");
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (t && !t.startsWith("#")) origins.push(t);
    }
  }
  if (values.origin?.trim()) origins.push(values.origin.trim());
  for (const p of positionals) {
    if (p.trim()) origins.push(p.trim());
  }

  if (origins.length === 0) {
    console.error(
      "Usage: yarn agents:disclosure-local -- --origin https://…   or   --file urls.txt",
    );
    process.exit(2);
  }

  const network = (process.env.MVT_NETWORK || "base").toLowerCase();

  const results = [];
  for (const origin of origins) {
    const r = await fetchWellKnownAndVerify(origin);
    if (!r.ok) {
      results.push({
        origin,
        optedIn: false,
        reason: r.reason,
        disclosuresFromAgent: null,
        usdc: null,
      });
      continue;
    }

    const bal = await usdcBalance(r.verified.signer);
    results.push({
      origin: r.origin,
      optedIn: true,
      signer: r.verified.signer,
      disclosuresFromAgent: {
        providerClaim: r.verified.providerClaim ?? null,
        productClaim: r.verified.productClaim ?? null,
        note:
          "Provider/Product come from the signed message — self-attested by whoever controls the agent key.",
      },
      usdc: bal.skipped ? bal : { ...bal },
      chainHint: network.includes("sepolia") ? "base-sepolia" : "base",
    });
  }

  console.log(JSON.stringify({ network, results }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
