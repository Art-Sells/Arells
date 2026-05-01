"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

type RegistryAgent = {
  origin: string;
  lastVerifiedAt: string;
  agentLabel?: string;
  endUserId?: string;
  signer?: string;
  narrative?: string;
  issuedAt?: string;
  providerClaim?: string | null;
  productClaim?: string | null;
};

type RegistryResponse = {
  configured?: boolean;
  error?: string;
  agents?: RegistryAgent[];
};

export default function AgentsRegistryPage() {
  const [data, setData] = useState<RegistryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/agent/registry", {
          headers: { Accept: "application/json" },
        });
        const json = (await res.json()) as RegistryResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData({ error: "Failed to load registry" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const agents = data?.agents ?? [];

  return (
    <main className={styles.main}>
      <div className={styles.inner}>
        <Link href="/" className={styles.back}>
          ← Arells home
        </Link>

        <h1 className={styles.title}>Open agents — registry</h1>
        <p className={styles.subtitle}>
          Arells reaches out to each open agent (HTTP), verifies its published opt-in signature, and
          stores the result in S3. This table is the read-out for humans — no manual “operator” step.
          Agents choose whether to publish{" "}
          <span className={styles.mono}>/.well-known/arells-opt-in.json</span>; if they do and the
          signature checks out, they land here after automated ingest.
        </p>

        {loading && <p className={styles.loading}>Loading registry…</p>}

        {!loading && data?.error && (
          <div className={styles.warn} role="status">
            {data.error} Configure <span className={styles.mono}>S3_BUCKET_NAME</span> and AWS
            credentials so verified rows can be stored. Until then the list stays empty.
          </div>
        )}

        {!loading && !data?.error && agents.length === 0 && (
          <div className={styles.empty}>
            No opted-in agents in S3 yet. Run automated ingest (see{" "}
            <span className={styles.mono}>yarn ingest:agents</span>) with origins from your discovery
            pipeline.
          </div>
        )}

        {!loading && agents.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Agent (signed)</th>
                  <th className={styles.th}>User id (signed)</th>
                  <th className={styles.th}>Provider / product</th>
                  <th className={styles.th}>Origin</th>
                  <th className={styles.th}>Verified</th>
                  <th className={styles.th} />
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.origin}>
                    <td className={styles.td}>{a.agentLabel ?? "—"}</td>
                    <td className={styles.td}>
                      <span className={styles.mono}>{a.endUserId ?? "—"}</span>
                    </td>
                    <td className={styles.td} style={{ fontSize: "0.82rem" }}>
                      {a.providerClaim || a.productClaim ? (
                        <>
                          {a.providerClaim ?? "—"}
                          <br />
                          {a.productClaim ?? "—"}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={styles.td}>
                      <span className={styles.mono}>{a.origin}</span>
                    </td>
                    <td className={styles.td}>
                      {a.lastVerifiedAt
                        ? new Date(a.lastVerifiedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className={styles.td}>
                      <Link
                        className={styles.link}
                        href={`/verify-agent?origin=${encodeURIComponent(a.origin)}`}
                      >
                        Live check
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
