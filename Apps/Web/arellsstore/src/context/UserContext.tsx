'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';

const PREVIEW_SKIP_SESSION_DELETES = true;

interface UserContextType {
  sessionId: string;
  setSessionId: (value: string) => void;
  resetSessionId: () => string;
  sessionReady: boolean;

  email: string;
  isSignedIn: boolean;
  setEmail: (value: string) => void;
  signOut: () => void;

  openSignIn: () => void;
  closeSignIn: () => void;
  signInOpen: boolean;

  emailInvestments: any[];
  emailTotals: { acVatop: number; acdVatop: number; acVact: number; acVactTaa: number };
  emailTotalsLiquid: { acVatop: number; acdVatop: number; acVact: number; acVactTaa: number };
  emailLoading: boolean;
  refreshEmailAggregator: (asset?: string) => Promise<any>;
  addEmailInvestments: (asset: string, newInvestments: any[]) => Promise<any>;
  saveEmailInvestments: (asset: string, investments: any[]) => Promise<any>;
  saveEmailInvestmentsForAsset: (asset: string, investmentsForAsset: any[]) => Promise<any>;

  hasEmailInvestmentsForAsset: (asset: string) => boolean;
  assetsPresentInEmail: string[];
  assetsMissingInEmail: string[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);
const SESSION_KEY = 'arells_session_id';
const EMAIL_KEY = 'arells_user_email';

const generateSessionId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [sessionId, setSessionIdState] = useState<string>('');
  const [sessionReady, setSessionReady] = useState<boolean>(false);

  const [email, setEmailState] = useState<string>('');
  const [signInOpen, setSignInOpen] = useState<boolean>(false);
  const [signInDraft, setSignInDraft] = useState<string>('');
  const [emailLoading, setEmailLoading] = useState<boolean>(false);
  const [emailInvestments, setEmailInvestments] = useState<any[]>([]);
  const [emailTotals, setEmailTotals] = useState<{ acVatop: number; acdVatop: number; acVact: number; acVactTaa: number }>(
    { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 }
  );
  const [emailTotalsLiquid, setEmailTotalsLiquid] = useState<{
    acVatop: number;
    acdVatop: number;
    acVact: number;
    acVactTaa: number;
  }>({ acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 });
  const sessionBootstrapRef = useRef(false);
  const emailBootstrapRef = useRef<string | null>(null);

  const setSessionId = useCallback((value: string) => {
    setSessionIdState(value);
    if (typeof window !== 'undefined') {
      if (value) {
        window.localStorage.setItem(SESSION_KEY, value);
      } else {
        window.localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const resetSessionId = useCallback(() => {
    const next = generateSessionId();
    setSessionId(next);
    return next;
  }, [setSessionId]);

  const setEmail = useCallback((value: string) => {
    const next = (value || '').trim().toLowerCase();
    setEmailState(next);
    if (typeof window !== 'undefined') {
      if (next) {
        window.localStorage.setItem(EMAIL_KEY, next);
      } else {
        window.localStorage.removeItem(EMAIL_KEY);
      }
    }
  }, []);

  const signOut = useCallback(() => {
    setEmail('');
    setSignInOpen(false);
    setEmailInvestments([]);
    setEmailTotals({ acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 });
    setEmailTotalsLiquid({ acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 });
  }, [setEmail]);

  const openSignIn = useCallback(() => setSignInOpen(true), []);
  const closeSignIn = useCallback(() => setSignInOpen(false), []);

  const isSignedIn = Boolean(email);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(SESSION_KEY);
    if (stored) {
      setSessionIdState(stored);
    } else {
      const next = generateSessionId();
      setSessionId(next);
    }

    const storedEmail = window.localStorage.getItem(EMAIL_KEY);
    if (storedEmail) {
      setEmailState(storedEmail);
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SESSION_KEY) {
        setSessionIdState(event.newValue ?? '');
      }
      if (event.key === EMAIL_KEY) {
        setEmailState((event.newValue ?? '').trim().toLowerCase());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [setSessionId]);

  // Guest sessions are TTL-controlled server-side; do not wipe them on every route change.
  useEffect(() => {
    if (!sessionId) return;
    setSessionReady(true);
  }, [sessionId, pathname, isSignedIn]);

  // Ensure a guest session JSON exists on mount (no asset-specific filtering).
  useEffect(() => {
    if (!sessionId || sessionBootstrapRef.current) return;
    if (typeof window === 'undefined') return;
    sessionBootstrapRef.current = true;
    (async () => {
      try {
        const skipParam = PREVIEW_SKIP_SESSION_DELETES ? '&skipExpiry=1' : '';
        const res = await fetch(`/api/fetchVavityAggregator?sessionId=${encodeURIComponent(sessionId)}${skipParam}`);
        const data = await res.json();
        const hasMeta =
          typeof data?.createdAt === 'number' && Number.isFinite(data.createdAt) &&
          typeof data?.expiresAt === 'number' && Number.isFinite(data.expiresAt);
        const hasInvestments = Array.isArray(data?.investments) && data.investments.length > 0;
        if (!hasMeta && !hasInvestments) {
          await fetch('/api/saveVavityAggregator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              investments: [],
              asset: 'bitcoin',
              ...(PREVIEW_SKIP_SESSION_DELETES ? { skipExpiry: true } : {}),
            }),
          });
        }
      } catch {
        // ignore bootstrap errors
      }
    })();
  }, [sessionId]);

  const refreshEmailAggregator = useCallback(
    async (asset?: string) => {
      if (!email) return { investments: [], totals: { acVatop: 0, acVact: 0, acdVatop: 0, acVactTaa: 0 } };
      setEmailLoading(true);
      try {
        const params = new URLSearchParams({ email });
        if (asset) params.set('asset', asset);
      const res = await fetch(`/api/user/fetchUserVavityAggregator?${params.toString()}`);
        const data = await res.json();
        // Only store full (unfiltered) payload in provider state; filtered callers can use return value.
        if (!asset) {
          setEmailInvestments(Array.isArray(data?.investments) ? data.investments : []);
          setEmailTotals(
            data?.totals || { acVatop: 0, acVact: 0, acdVatop: 0, acVactTaa: 0 }
          );
          setEmailTotalsLiquid(
            data?.totalsLiquid ??
              data?.totalsReality ??
              { acVatop: 0, acVact: 0, acdVatop: 0, acVactTaa: 0 }
          );
        }
        return data;
      } finally {
        setEmailLoading(false);
      }
    },
    [email]
  );

  const addEmailInvestments = useCallback(
    async (asset: string, newInvestments: any[]) => {
      if (!email) throw new Error('Email is required');
      const res = await fetch('/api/user/addUserVavityAggregator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newInvestments, asset }),
      });
      const data = await res.json();
      await refreshEmailAggregator();
      return data;
    },
    [email, refreshEmailAggregator]
  );

  const saveEmailInvestments = useCallback(
    async (asset: string, investments: any[]) => {
      if (!email) throw new Error('Email is required');
      const res = await fetch('/api/user/saveUserVavityAggregator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, investments, asset }),
      });
      const data = await res.json();
      await refreshEmailAggregator();
      return data;
    },
    [email, refreshEmailAggregator]
  );

  const saveEmailInvestmentsForAsset = useCallback(
    async (assetId: string, investmentsForAsset: any[]) => {
      const a = (assetId || '').toLowerCase();
      const merged = [
        ...emailInvestments.filter((inv) => ((inv?.asset || 'bitcoin') as string).toLowerCase() !== a),
        ...(Array.isArray(investmentsForAsset) ? investmentsForAsset.map((inv) => ({ ...inv, asset: a })) : []),
      ];
      return await saveEmailInvestments(a, merged);
    },
    [emailInvestments, saveEmailInvestments]
  );

  // Keep email state hydrated when email changes.
  useEffect(() => {
    if (!email) return;
    refreshEmailAggregator();
  }, [email, refreshEmailAggregator]);

  // Ensure an email JSON exists on mount (all assets).
  useEffect(() => {
    if (!email) return;
    if (emailBootstrapRef.current === email) return;
    if (typeof window === 'undefined') return;
    emailBootstrapRef.current = email;
    (async () => {
      try {
        const res = await fetch(`/api/user/fetchUserVavityAggregator?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        const hasInvestments = Array.isArray(data?.investments) && data.investments.length > 0;
        const totals = data?.totals;
        const hasTotals =
          totals &&
          typeof totals.acVatop === 'number' &&
          typeof totals.acVact === 'number' &&
          typeof totals.acdVatop === 'number' &&
          typeof totals.acVactTaa === 'number';
        if (!hasInvestments && !hasTotals) {
          await fetch('/api/user/saveUserVavityAggregator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, investments: [], asset: 'bitcoin' }),
          });
        }
      } catch {
        // ignore bootstrap errors
      }
    })();
  }, [email]);

  useEffect(() => {
    if (!signInOpen) return;
    setSignInDraft(email || '');
  }, [signInOpen, email]);

  const supportedAssets = useMemo(() => ['bitcoin', 'ethereum'], []);

  const hasEmailInvestmentsForAsset = useCallback(
    (assetId: string) => {
      const a = (assetId || '').toLowerCase();
      return emailInvestments.some((inv) => (inv?.asset || 'bitcoin') === a);
    },
    [emailInvestments]
  );

  const assetsPresentInEmail = useMemo(() => {
    const set = new Set<string>();
    for (const inv of emailInvestments) {
      const a = ((inv?.asset || 'bitcoin') as string).toLowerCase();
      if (supportedAssets.includes(a)) set.add(a);
    }
    return supportedAssets.filter((a) => set.has(a));
  }, [emailInvestments, supportedAssets]);

  const assetsMissingInEmail = useMemo(() => supportedAssets.filter((a) => !assetsPresentInEmail.includes(a)), [
    supportedAssets,
    assetsPresentInEmail,
  ]);

  return (
    <UserContext.Provider
      value={{
        sessionId,
        setSessionId,
        resetSessionId,
        sessionReady,

        email,
        isSignedIn,
        setEmail,
        signOut,

        openSignIn,
        closeSignIn,
        signInOpen,

        emailInvestments,
        emailTotals,
        emailTotalsLiquid,
        emailLoading,
        refreshEmailAggregator,
        addEmailInvestments,
        saveEmailInvestments,
        saveEmailInvestmentsForAsset,
        hasEmailInvestmentsForAsset,
        assetsPresentInEmail,
        assetsMissingInEmail,
      }}
    >
      {children}
      {signInOpen && (
        <div
          className="arells-signin-overlay"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeSignIn();
          }}
        >
          <div className="arells-signin-modal">
            <div className="arells-signin-title">Sign in to Save Investments</div>
            <div className="arells-signin-subtitle">Enter your email to save investments.</div>
            <input
              className="arells-signin-input"
              value={signInDraft}
              onChange={(e) => setSignInDraft(e.target.value)}
              placeholder="email@example.com"
              inputMode="email"
              autoComplete="email"
            />
            <div className="arells-signin-actions">
              <button type="button" className="arells-signin-cancel" onClick={closeSignIn}>
                Cancel
              </button>
              <button
                type="button"
                className="arells-signin-confirm"
                onClick={() => {
                  setEmail(signInDraft);
                  closeSignIn();
                }}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};