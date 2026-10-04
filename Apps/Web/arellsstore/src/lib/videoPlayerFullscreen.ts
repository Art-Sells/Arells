type FullscreenCapable = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  webkitRequestFullScreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitCancelFullScreen?: () => void;
};

type WebkitVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
};

export function canNativeVideoFullscreen(video: HTMLVideoElement): boolean {
  return typeof (video as WebkitVideo).webkitEnterFullscreen === 'function';
}

export function isNativeVideoFullscreen(video: HTMLVideoElement | null): boolean {
  return Boolean(video && (video as WebkitVideo).webkitDisplayingFullscreen);
}

export function enterNativeVideoFullscreen(video: HTMLVideoElement): void {
  try {
    (video as WebkitVideo).webkitEnterFullscreen?.();
  } catch {
    /* ignore */
  }
}

export function exitNativeVideoFullscreen(video: HTMLVideoElement | null): void {
  const nativeVideo = video as WebkitVideo | null;
  if (nativeVideo?.webkitDisplayingFullscreen) nativeVideo.webkitExitFullscreen?.();
}

export function getFullscreenElement(): Element | null {
  const doc = document as FullscreenDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export function canElementFullscreen(player: HTMLElement): boolean {
  const el = player as FullscreenCapable;
  return (
    typeof el.requestFullscreen === 'function' ||
    typeof el.webkitRequestFullscreen === 'function' ||
    typeof el.webkitRequestFullScreen === 'function'
  );
}

export function isPlayerFullscreen(player: HTMLElement | null): boolean {
  const fs = getFullscreenElement();
  return Boolean(player && fs && (fs === player || player.contains(fs) || fs.contains(player)));
}

export async function enterPlayerFullscreen(player: HTMLElement): Promise<void> {
  const el = player as FullscreenCapable;
  if (typeof el.requestFullscreen === 'function') {
    await el.requestFullscreen();
    return;
  }
  if (typeof el.webkitRequestFullscreen === 'function') {
    await el.webkitRequestFullscreen();
    return;
  }
  if (typeof el.webkitRequestFullScreen === 'function') {
    await el.webkitRequestFullScreen();
  }
}

export async function exitPlayerFullscreen(): Promise<void> {
  const doc = document as FullscreenDocument;
  if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
    await document.exitFullscreen();
    return;
  }
  if (typeof doc.webkitExitFullscreen === 'function') {
    await doc.webkitExitFullscreen();
    return;
  }
  if (typeof doc.webkitCancelFullScreen === 'function') {
    doc.webkitCancelFullScreen();
  }
}

export function waitForVideoMetadata(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onLoaded = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('Video failed to load'));
    };
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('error', onError);
    };
    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('error', onError);
  });
}
