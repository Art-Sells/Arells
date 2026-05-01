"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "./page.module.css";

type ProfileResponse = {
  error?: string;
  origin?: string;
  wellKnownUrl?: string;
  httpStatus?: number;
  cryptographic?: {
    ok: boolean;
    reason?: string;
    signer?: string;
    issuedAt?: string;
    narrative?: string;
  };
  agent?: { label: string; labelScope: string };
  userFromAgent?: { declaredId: string; idScope: string };
  disclosuresFromAgent?: {
    providerClaim: string | null;
    productClaim: string | null;
  };
  modelProvider?: { status: string; summary?: string };
  disclosure?: {
    provenNow: string[];
    notProvenBySignatureAlone: string[];
    pathToStrongProviderAssurance: string[];
  };
};

export default function VerifyAgentPage() {
  const [originInput, setOriginInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const load = useCallback(async (origin: string) => {
    if (!origin) {
      setData(null);
      setFetchError(null);
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      const u = new URL("/api/agent/profile", window.location.origin);
      u.searchParams.set("origin", origin);
      const res = await fetch(u.toString(), { headers: { Accept: "application/json" } });
      const json = (await res.json()) as ProfileResponse;
      setData(json);
      if (json.error && !json.cryptographic) {
        setFetchError(json.error);
      }
    } catch (e) {
      setData(null);
      setFetchError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const o = p.get("origin")?.trim() ?? "";
    if (o) {
      setOriginInput(o);
      void load(o);
    }
  }, [load]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const o = originInput.trim();
    if (!o) return;
    const url = new URL(window.location.pathname, window.location.origin);
    url.searchParams.set("origin", o);
    window.history.replaceState(null, "", url.toString());
    void load(o);
  };

  const cryptoOk = data?.cryptographic?.ok === true;

  return (
    <main className={styles.main}>
      <div className={styles.inner}>
        <Link href="/" className={styles.back}>
          ← Arells home
        </Link>

        <h1 className={styles.title}>Verify agent</h1>
        <p className={styles.subtitle}>
          Arells contacts the open agent, reads its opt-in document, and verifies the signature.
          Opted-in agents also appear on the{" "}
          <Link href="/agents" style={{ color: "#c4b8a8" }}>
            agent registry
          </Link>{" "}
          after an automated ingest run.
        </p>

        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.label} htmlFor="origin">
            Agent site origin
          </label>
          <div className={styles.inputRow}>
            <input
              id="origin"
              className={styles.input}
              type="url"
              placeholder="https://your-agent.example.com"
              value={originInput}
              onChange={(e) => setOriginInput(e.target.value)}
              autoComplete="url"
              spellCheck={false}
            />
            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? "Checking…" : "Verify"}
            </button>
          </div>
        </form>

        {fetchError && !data?.cryptographic && (
          <div className={styles.error} role="alert">
            {fetchError}
          </div>
        )}

        {loading && !data && <p className={styles.loading}>Contacting agent…</p>}

        {data && (
          <>
            {data.error && data.httpStatus === undefined && (
              <div className={styles.error} role="alert">
                {data.error}
              </div>
            )}

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Cryptographic check</h2>
              {cryptoOk ? (
                <>
                  <p className={styles.row}>
                    <span className={styles.badgeOk}>Signature verified</span>
                  </p>
                  {data.cryptographic?.narrative && (
                    <p className={styles.row}>{data.cryptographic.narrative}</p>
                  )}
                  {data.cryptographic?.signer && (
                    <p className={styles.row}>
                      <strong>Signer</strong>
                      <br />
                      <span className={styles.mono}>{data.cryptographic.signer}</span>
                    </p>
                  )}
                  {data.cryptographic?.issuedAt && (
                    <p className={styles.row}>
                      <strong>Signed at</strong> {data.cryptographic.issuedAt}
                    </p>
                  )}
                </>
              ) : (
                <p className={styles.row}>
                  <span className={styles.badgeWarn}>Not verified</span>
                  {data.cryptographic?.reason ? ` — ${data.cryptographic.reason}` : null}
                </p>
              )}
              {data.wellKnownUrl && (
                <p className={styles.row}>
                  <strong>Source URL</strong>
                  <br />
                  <span className={styles.mono}>{data.wellKnownUrl}</span>
                </p>
              )}
            </section>

            {cryptoOk && data.agent && (
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Agent (from signed message)</h2>
                <p className={styles.row}>
                  <strong>Label</strong> {data.agent.label}
                </p>
                <p className={`${styles.row} ${styles.mono}`} style={{ fontSize: "0.8rem", color: "#9a9590" }}>
                  Scope: {data.agent.labelScope.replace(/_/g, " ")}
                </p>
              </section>
            )}

            {cryptoOk && data.disclosuresFromAgent && (
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Provider / product (signed by agent)</h2>
                <p className={styles.row}>
                  Self-attested in the message — not verified by Anthropic/OpenAI.
                </p>
                <p className={styles.row}>
                  <strong>Provider</strong>{" "}
                  {data.disclosuresFromAgent.providerClaim ?? "—"}
                </p>
                <p className={styles.row}>
                  <strong>Product / chatbot</strong>{" "}
                  {data.disclosuresFromAgent.productClaim ?? "—"}
                </p>
              </section>
            )}

            {cryptoOk && data.userFromAgent && (
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>User id (from agent&apos;s signed message)</h2>
                <p className={styles.row}>
                  <strong>Declared id</strong>{" "}
                  <span className={styles.mono}>{data.userFromAgent.declaredId}</span>
                </p>
                <p className={`${styles.row} ${styles.mono}`} style={{ fontSize: "0.8rem", color: "#9a9590" }}>
                  Scope: {data.userFromAgent.idScope.replace(/_/g, " ")}
                </p>
              </section>
            )}

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Model provider (Claude / ChatGPT / …)</h2>
              <p className={styles.row}>
                <span className={styles.badgeWarn}>Not verified by provider</span>
              </p>
              {data.modelProvider?.summary && (
                <p className={styles.row}>{data.modelProvider.summary}</p>
              )}
              {data.disclosure && (
                <>
                  <p className={styles.cardTitle} style={{ marginTop: "1rem" }}>
                    What this page proves
                  </p>
                  <ul className={styles.list}>
                    {data.disclosure.provenNow.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <p className={styles.cardTitle} style={{ marginTop: "1rem" }}>
                    What is not proven by the signature alone
                  </p>
                  <ul className={styles.list}>
                    {data.disclosure.notProvenBySignatureAlone.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <p className={styles.cardTitle} style={{ marginTop: "1rem" }}>
                    How you can add real Claude / OpenAI assurance
                  </p>
                  <ul className={styles.list}>
                    {data.disclosure.pathToStrongProviderAssurance.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
