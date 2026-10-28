'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { composeAlienFromPhoto } from '../lib/client/alienPhotoCompose';

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

function revokeIfBlob(url: string | null | undefined) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}

export function AlienCharacterCreateProvider({ children }: { children: ReactNode }) {
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
    if (style) setOverlayStyle(style);
    setWaitAssetName(creatingNameRef.current);
    setWaitModalOpen(true);
    return true;
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
      if (args.overlayStyle) setOverlayStyle(args.overlayStyle);

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
          setSuccess({
            assetId: args.assetId,
            assetName: name,
            shareId: args.shareId ?? null,
            metaUrl,
            loopUrl,
          });
          setStatus('success');
          setCreatingModalOpen(false);
        } catch (err) {
          console.error('alien character create', err);
          setError({
            assetId: args.assetId,
            assetName: name,
            shareId: args.shareId ?? null,
          });
          setErrorOpen(true);
          setStatus('error');
          setCreatingModalOpen(false);
        } finally {
          creatingRef.current = false;
          creatingNameRef.current = null;
          setCreatingAssetId(null);
          setCreatingAssetName(null);
        }
      })();

      return true;
    },
    []
  );

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
