'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { overlayStyleForAsset } from '../lib/client/alienCreateTheme';
import {
  awaitAlienGenerateJob,
  composeAlienFromPhoto,
  fetchAlienGenerateJob,
  isAlienGenerateJobFreshRunning,
} from '../lib/client/alienPhotoCompose';
import { useUser } from './UserContext';

export type AlienCreateThemeStyle = React.CSSProperties;

type AlienCreateSuccess = {
  assetId: string;
  assetName: string;
  shareId: string | null;
  metaUrl: string;
  loopUrl: string | null;
};

type AlienCreateError = {
  assetId: string;
  assetName: string;
  shareId: string | null;
  message?: string | null;
};

type AlienCharacterCreateContextValue = {
  status: 'idle' | 'creating' | 'success' | 'error';
  creatingAssetId: string | null;
  creatingAssetName: string | null;
  creatingModalOpen: boolean;
  waitModalOpen: boolean;
  waitAssetName: string | null;
  success: AlienCreateSuccess | null;
  error: AlienCreateError | null;
  errorOpen: boolean;
  overlayStyle: AlienCreateThemeStyle;
  isCreating: boolean;
  isCreatingAsset: (assetId: string) => boolean;
  /** If a create is in flight, open the wait modal and return true. */
  blockIfCreating: (overlayStyle?: AlienCreateThemeStyle) => boolean;
  startCreate: (args: {
    email: string;
    assetId: string;
    assetName: string;
    file: File;
    shareId?: string | null;
    overlayStyle?: AlienCreateThemeStyle;
  }) => boolean;
  dismissCreatingModal: () => void;
  dismissWaitModal: () => void;
  dismissSuccess: () => void;
  dismissError: () => void;
};

const AlienCharacterCreateContext = createContext<AlienCharacterCreateContextValue | undefined>(
  undefined
);

/** Assets we resume across browsers when a server job is already running. */
const REMOTE_WATCH = [{ id: 'bitcoin', name: 'Bitcoin' }] as const;
const REMOTE_POLL_MS = 4000;

function revokeIfBlob(url: string | null | undefined) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}

export function AlienCharacterCreateProvider({ children }: { children: ReactNode }) {
  const { email, shareId, isSignedIn, authSessionLoading } = useUser();
  const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [creatingAssetId, setCreatingAssetId] = useState<string | null>(null);
  const [creatingAssetName, setCreatingAssetName] = useState<string | null>(null);
  const [creatingModalOpen, setCreatingModalOpen] = useState(false);
  const [waitModalOpen, setWaitModalOpen] = useState(false);
  const [waitAssetName, setWaitAssetName] = useState<string | null>(null);
  const [success, setSuccess] = useState<AlienCreateSuccess | null>(null);
  const [error, setError] = useState<AlienCreateError | null>(null);
  const [errorOpen, setErrorOpen] = useState(false);
  const [overlayStyle, setOverlayStyle] = useState<AlienCreateThemeStyle>({});
  const creatingRef = useRef(false);
  const creatingNameRef = useRef<string | null>(null);

  const dismissSuccess = useCallback(() => {
    setSuccess((prev) => {
      if (prev) {
        revokeIfBlob(prev.metaUrl);
        revokeIfBlob(prev.loopUrl);
      }
      return null;
    });
    setStatus((prev) => (prev === 'success' ? 'idle' : prev));
  }, []);

  const dismissError = useCallback(() => {
    setErrorOpen(false);
    setError(null);
    setStatus((prev) => (prev === 'error' ? 'idle' : prev));
  }, []);

  const dismissCreatingModal = useCallback(() => {
    setCreatingModalOpen(false);
  }, []);

  const dismissWaitModal = useCallback(() => {
    setWaitModalOpen(false);
  }, []);

  const blockIfCreating = useCallback((style?: AlienCreateThemeStyle) => {
    if (!creatingRef.current) return false;
    const assetId = creatingAssetId || 'bitcoin';
    setOverlayStyle(overlayStyleForAsset(assetId, style));
    setWaitAssetName(creatingNameRef.current);
    setWaitModalOpen(true);
    return true;
  }, [creatingAssetId]);

  const finishCreateSuccess = useCallback(
    (args: {
      assetId: string;
      assetName: string;
      shareId?: string | null;
      metaUrl: string;
      loopUrl: string | null;
    }) => {
      setSuccess({
        assetId: args.assetId,
        assetName: args.assetName,
        shareId: args.shareId ?? null,
        metaUrl: args.metaUrl,
        loopUrl: args.loopUrl,
      });
      setStatus('success');
      setCreatingModalOpen(false);
    },
    []
  );

  const finishCreateError = useCallback(
    (args: {
      assetId: string;
      assetName: string;
      shareId?: string | null;
      message?: string | null;
    }) => {
      setError({
        assetId: args.assetId,
        assetName: args.assetName,
        shareId: args.shareId ?? null,
        message: args.message ?? null,
      });
      setErrorOpen(true);
      setStatus('error');
      setCreatingModalOpen(false);
    },
    []
  );

  const clearCreatingSlot = useCallback(() => {
    creatingRef.current = false;
    creatingNameRef.current = null;
    setCreatingAssetId(null);
    setCreatingAssetName(null);
  }, []);

  const startCreate = useCallback(
    (args: {
      email: string;
      assetId: string;
      assetName: string;
      file: File;
      shareId?: string | null;
      overlayStyle?: AlienCreateThemeStyle;
    }) => {
      const name = args.assetName.trim() || args.assetId;
      setOverlayStyle(overlayStyleForAsset(args.assetId, args.overlayStyle));

      if (creatingRef.current) {
        setWaitAssetName(creatingNameRef.current || name);
        setWaitModalOpen(true);
        return false;
      }

      creatingRef.current = true;
      creatingNameRef.current = name;
      setCreatingAssetId(args.assetId);
      setCreatingAssetName(name);
      setStatus('creating');
      setCreatingModalOpen(true);
      setWaitModalOpen(false);
      setErrorOpen(false);
      setError(null);
      setSuccess((prev) => {
        if (prev) {
          revokeIfBlob(prev.metaUrl);
          revokeIfBlob(prev.loopUrl);
        }
        return null;
      });

      void (async () => {
        try {
          const result = await composeAlienFromPhoto({
            email: args.email,
            assetId: args.assetId,
            file: args.file,
            shareId: args.shareId,
          });
          const metaUrl = URL.createObjectURL(result.metaBlob);
          const loopUrl = result.loopBlob ? URL.createObjectURL(result.loopBlob) : null;
          finishCreateSuccess({
            assetId: args.assetId,
            assetName: name,
            shareId: args.shareId,
            metaUrl,
            loopUrl,
          });
        } catch (err) {
          console.error('alien character create', err);
          finishCreateError({
            assetId: args.assetId,
            assetName: name,
            shareId: args.shareId,
            message: err instanceof Error ? err.message : null,
          });
        } finally {
          clearCreatingSlot();
        }
      })();

      return true;
    },
    [clearCreatingSlot, finishCreateError, finishCreateSuccess]
  );

  /**
   * Other browser / tab: if the server already has a fresh running job, show the
   * same creating modal and follow it to success/error.
   */
  useEffect(() => {
    if (authSessionLoading || !isSignedIn || !email) return;
    let cancelled = false;

    const resumeRemote = async () => {
      if (creatingRef.current || cancelled) return;
      for (const asset of REMOTE_WATCH) {
        if (creatingRef.current || cancelled) return;
        let job;
        try {
          job = await fetchAlienGenerateJob(email, asset.id);
        } catch {
          continue;
        }
        if (!isAlienGenerateJobFreshRunning(job) || !job) continue;

        const name = asset.name;
        creatingRef.current = true;
        creatingNameRef.current = name;
        setCreatingAssetId(asset.id);
        setCreatingAssetName(name);
        setOverlayStyle(overlayStyleForAsset(asset.id));
        setStatus('creating');
        setCreatingModalOpen(true);
        setWaitModalOpen(false);
        setErrorOpen(false);
        setError(null);
        setSuccess((prev) => {
          if (prev) {
            revokeIfBlob(prev.metaUrl);
            revokeIfBlob(prev.loopUrl);
          }
          return null;
        });

        try {
          const result = await awaitAlienGenerateJob({
            email,
            assetId: asset.id,
            shareId,
            initialJob: job,
          });
          if (cancelled) return;
          const metaUrl = URL.createObjectURL(result.metaBlob);
          const loopUrl = result.loopBlob ? URL.createObjectURL(result.loopBlob) : null;
          finishCreateSuccess({
            assetId: asset.id,
            assetName: name,
            shareId,
            metaUrl,
            loopUrl,
          });
        } catch (err) {
          if (cancelled) return;
          console.error('alien character remote resume', err);
          finishCreateError({
            assetId: asset.id,
            assetName: name,
            shareId,
            message: err instanceof Error ? err.message : null,
          });
        } finally {
          if (!cancelled) clearCreatingSlot();
        }
        return;
      }
    };

    void resumeRemote();
    const interval = window.setInterval(() => {
      void resumeRemote();
    }, REMOTE_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [
    authSessionLoading,
    isSignedIn,
    email,
    shareId,
    clearCreatingSlot,
    finishCreateError,
    finishCreateSuccess,
  ]);

  const isCreatingAsset = useCallback(
    (assetId: string) => status === 'creating' && creatingAssetId === assetId,
    [status, creatingAssetId]
  );

  const value = useMemo<AlienCharacterCreateContextValue>(
    () => ({
      status,
      creatingAssetId,
      creatingAssetName,
      creatingModalOpen,
      waitModalOpen,
      waitAssetName,
      success,
      error,
      errorOpen,
      overlayStyle,
      isCreating: status === 'creating',
      isCreatingAsset,
      blockIfCreating,
      startCreate,
      dismissCreatingModal,
      dismissWaitModal,
      dismissSuccess,
      dismissError,
    }),
    [
      status,
      creatingAssetId,
      creatingAssetName,
      creatingModalOpen,
      waitModalOpen,
      waitAssetName,
      success,
      error,
      errorOpen,
      overlayStyle,
      isCreatingAsset,
      blockIfCreating,
      startCreate,
      dismissCreatingModal,
      dismissWaitModal,
      dismissSuccess,
      dismissError,
    ]
  );

  return (
    <AlienCharacterCreateContext.Provider value={value}>
      {children}
    </AlienCharacterCreateContext.Provider>
  );
}

export function useAlienCharacterCreate() {
  const ctx = useContext(AlienCharacterCreateContext);
  if (!ctx) {
    throw new Error('useAlienCharacterCreate must be used within AlienCharacterCreateProvider');
  }
  return ctx;
}
