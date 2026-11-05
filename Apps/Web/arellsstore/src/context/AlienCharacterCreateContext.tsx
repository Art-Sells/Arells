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
  ackAlienGenerateError,
  ackAlienGenerateSuccess,
  alienCreateFailureStage,
  awaitAlienGenerateJob,
  composeAlienFromPhoto,
  createMonotonicProgress,
  failAlienGenerateJob,
  fetchAlienGenerateJob,
  isAlienGenerateJobFreshRunning,
  isAlienGenerateJobPendingError,
  isAlienGenerateJobPendingSuccess,
  isAlienGenerateJobTimedOut,
  progressForRemotePhase,
  type AlienCreateFailureStage,
  type AlienGenerateJobClient,
} from '../lib/client/alienPhotoCompose';
import { useUser } from './UserContext';

export type AlienCreateThemeStyle = React.CSSProperties;

type AlienCreateSuccess = {
  assetId: string;
  assetName: string;
  shareId: string | null;
  metaUrl: string;
  loopUrl: string | null;
  /** Job startedAt — used to ack dismiss for this exact create. */
  jobStartedAt?: string | null;
};

type AlienCreateError = {
  assetId: string;
  assetName: string;
  shareId: string | null;
  message?: string | null;
  stage?: AlienCreateFailureStage;
  /** Job startedAt — used to ack dismiss for this exact failed create. */
  jobStartedAt?: string | null;
};

type AlienCharacterCreateContextValue = {
  status: 'idle' | 'creating' | 'success' | 'error';
  creatingAssetId: string | null;
  creatingAssetName: string | null;
  /** 0–100 once upload starts; null = hide % (pre-upload). */
  createProgress: number | null;
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
  dismissSuccess: () => Promise<void>;
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
  const [createProgress, setCreateProgress] = useState<number | null>(null);
  const [success, setSuccess] = useState<AlienCreateSuccess | null>(null);
  const successRef = useRef<AlienCreateSuccess | null>(null);
  successRef.current = success;
  const [error, setError] = useState<AlienCreateError | null>(null);
  const [errorOpen, setErrorOpen] = useState(false);
  const [overlayStyle, setOverlayStyle] = useState<AlienCreateThemeStyle>({});
  const creatingRef = useRef(false);
  const creatingNameRef = useRef<string | null>(null);
  /** Job startedAt currently shown as success — skip re-opening the same modal. */
  const successJobStartedAtRef = useRef<string | null>(null);
  /** Job startedAt currently shown as error — skip re-opening the same modal. */
  const errorJobStartedAtRef = useRef<string | null>(null);
  /** Stable across pathname/session churn so remote-resume isn't cancelled mid-create. */
  const shareIdRef = useRef(shareId);
  shareIdRef.current = shareId;
  const emailRef = useRef(email);
  emailRef.current = email;

  const dismissSuccess = useCallback(async () => {
    const prev = successRef.current;
    successRef.current = null;
    successJobStartedAtRef.current = null;
    setSuccess(null);
    setStatus((statusPrev) => (statusPrev === 'success' ? 'idle' : statusPrev));
    if (!prev) return;
    revokeIfBlob(prev.metaUrl);
    revokeIfBlob(prev.loopUrl);
    const ackEmail = emailRef.current;
    if (!ackEmail) return;
    try {
      await ackAlienGenerateSuccess({
        email: ackEmail,
        assetId: prev.assetId,
        startedAt: prev.jobStartedAt,
      });
    } catch (err) {
      console.error('alien success ack', err);
    }
  }, []);

  const dismissError = useCallback(() => {
    setError((prev) => {
      if (prev) {
        const ackEmail = emailRef.current;
        if (ackEmail) {
          void ackAlienGenerateError({
            email: ackEmail,
            assetId: prev.assetId,
            startedAt: prev.jobStartedAt,
          }).catch((err) => console.error('alien error ack', err));
        }
      }
      errorJobStartedAtRef.current = null;
      return null;
    });
    setErrorOpen(false);
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
      jobStartedAt?: string | null;
    }) => {
      const jobStartedAt = args.jobStartedAt?.trim() || null;
      successJobStartedAtRef.current = jobStartedAt;
      setSuccess({
        assetId: args.assetId,
        assetName: args.assetName,
        shareId: args.shareId ?? null,
        metaUrl: args.metaUrl,
        loopUrl: args.loopUrl,
        jobStartedAt,
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
      stage?: AlienCreateFailureStage;
      jobStartedAt?: string | null;
    }) => {
      const jobStartedAt = args.jobStartedAt?.trim() || null;
      errorJobStartedAtRef.current = jobStartedAt;
      setError({
        assetId: args.assetId,
        assetName: args.assetName,
        shareId: args.shareId ?? null,
        message: args.message ?? null,
        stage: args.stage ?? 'generate',
        jobStartedAt,
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
    setCreateProgress(null);
    /* Always drop creating — otherwise the sitewide badge sticks until full reload. */
    setStatus((prev) => (prev === 'creating' ? 'idle' : prev));
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
      setCreateProgress(1);
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
        let jobStartedAt: string | null = null;
        const onProgress = createMonotonicProgress(setCreateProgress);
        try {
          const result = await composeAlienFromPhoto({
            email: args.email,
            assetId: args.assetId,
            file: args.file,
            shareId: args.shareId,
            onProgress,
          });
          try {
            const job = await fetchAlienGenerateJob(args.email, args.assetId);
            jobStartedAt =
              typeof job?.startedAt === 'string' && job.startedAt.trim()
                ? job.startedAt.trim()
                : null;
          } catch {
            /* success UI still works without ack key */
          }
          const metaUrl = URL.createObjectURL(result.metaBlob);
          const loopUrl =
            result.loopUrl ||
            (result.loopBlob ? URL.createObjectURL(result.loopBlob) : null);
          finishCreateSuccess({
            assetId: args.assetId,
            assetName: name,
            shareId: args.shareId,
            metaUrl,
            loopUrl,
            jobStartedAt,
          });
        } catch (err) {
          console.error('alien character create', err);
          if (!jobStartedAt) {
            try {
              const job = await fetchAlienGenerateJob(args.email, args.assetId);
              jobStartedAt =
                typeof job?.startedAt === 'string' && job.startedAt.trim()
                  ? job.startedAt.trim()
                  : null;
            } catch {
              /* ack still optional */
            }
          }
          finishCreateError({
            assetId: args.assetId,
            assetName: name,
            shareId: args.shareId,
            message: err instanceof Error ? err.message : 'Unknown create error',
            stage: alienCreateFailureStage(err),
            jobStartedAt,
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
   * Other browser / tab / return visit:
   * - fresh running job → creating modal, then success
   * - complete job never dismissed → reopen success modal
   * Do NOT depend on shareId — session refetch on navigate was cancelling resume
   * and skipping clearCreatingSlot, leaving “Creating Character” stuck sitewide.
   */
  useEffect(() => {
    if (authSessionLoading || !isSignedIn || !email) return;
    let cancelled = false;

    const resumeRemote = async () => {
      if (creatingRef.current || cancelled) return;
      for (const asset of REMOTE_WATCH) {
        if (creatingRef.current || cancelled) return;
        let job: AlienGenerateJobClient | null;
        try {
          job = await fetchAlienGenerateJob(email, asset.id);
        } catch {
          continue;
        }
        /* Local create claimed the slot while we were fetching — do not steal it. */
        if (creatingRef.current || cancelled) return;
        if (!job) continue;

        const name = asset.name;
        const resumeShareId = shareIdRef.current;
        const jobStartedAt =
          typeof job.startedAt === 'string' && job.startedAt.trim()
            ? job.startedAt.trim()
            : null;

        if (isAlienGenerateJobPendingSuccess(job)) {
          if (
            jobStartedAt &&
            successJobStartedAtRef.current &&
            successJobStartedAtRef.current === jobStartedAt
          ) {
            return;
          }
          creatingRef.current = true;
          creatingNameRef.current = name;
          setCreatingAssetId(asset.id);
          setCreatingAssetName(name);
          setCreateProgress(100);
          setOverlayStyle(overlayStyleForAsset(asset.id));
          setWaitModalOpen(false);
          setErrorOpen(false);
          setError(null);
          try {
            const result = await awaitAlienGenerateJob({
              email,
              assetId: asset.id,
              shareId: resumeShareId,
              initialJob: job,
              onProgress: createMonotonicProgress(setCreateProgress),
            });
            if (cancelled) return;
            const metaUrl = URL.createObjectURL(result.metaBlob);
            const loopUrl =
              result.loopUrl ||
              (result.loopBlob ? URL.createObjectURL(result.loopBlob) : null);
            finishCreateSuccess({
              assetId: asset.id,
              assetName: name,
              shareId: resumeShareId,
              metaUrl,
              loopUrl,
              jobStartedAt,
            });
          } catch (err) {
            if (cancelled) return;
            console.error('alien character pending success', err);
            finishCreateError({
              assetId: asset.id,
              assetName: name,
              shareId: resumeShareId,
              message: err instanceof Error ? err.message : 'Unknown create error',
              stage: 'generate',
              jobStartedAt,
            });
          } finally {
            clearCreatingSlot();
          }
          return;
        }

        if (isAlienGenerateJobPendingError(job) || isAlienGenerateJobTimedOut(job)) {
          if (
            jobStartedAt &&
            errorJobStartedAtRef.current &&
            errorJobStartedAtRef.current === jobStartedAt
          ) {
            return;
          }
          let message =
            typeof job.error === 'string' && job.error.trim()
              ? job.error.trim()
              : 'Couldn’t finish character create';
          if (isAlienGenerateJobTimedOut(job)) {
            message = 'Character creation timed out after 15 minutes — try again';
            await failAlienGenerateJob({
              email,
              assetId: asset.id,
              error: message,
              startedAt: jobStartedAt,
            }).catch(() => undefined);
          }
          finishCreateError({
            assetId: asset.id,
            assetName: name,
            shareId: resumeShareId,
            message,
            stage: 'generate',
            jobStartedAt,
          });
          return;
        }

        if (!isAlienGenerateJobFreshRunning(job)) continue;

        creatingRef.current = true;
        creatingNameRef.current = name;
        setCreatingAssetId(asset.id);
        setCreatingAssetName(name);
        setCreateProgress(progressForRemotePhase(job));
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
          successJobStartedAtRef.current = null;
          return null;
        });

        try {
          const result = await awaitAlienGenerateJob({
            email,
            assetId: asset.id,
            shareId: resumeShareId,
            initialJob: job,
            onProgress: createMonotonicProgress(setCreateProgress),
          });
          if (cancelled) return;
          const metaUrl = URL.createObjectURL(result.metaBlob);
          const loopUrl =
            result.loopUrl ||
            (result.loopBlob ? URL.createObjectURL(result.loopBlob) : null);
          finishCreateSuccess({
            assetId: asset.id,
            assetName: name,
            shareId: resumeShareId,
            metaUrl,
            loopUrl,
            jobStartedAt,
          });
        } catch (err) {
          if (cancelled) return;
          console.error('alien character remote resume', err);
          finishCreateError({
            assetId: asset.id,
            assetName: name,
            shareId: resumeShareId,
            message: err instanceof Error ? err.message : 'Unknown create error',
            stage: 'generate',
            jobStartedAt,
          });
        } finally {
          /* Always clear — cancelled resume used to skip this and freeze the badge. */
          clearCreatingSlot();
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
      createProgress,
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
      createProgress,
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
