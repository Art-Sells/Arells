type FullscreenCapable = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  webkitRequestFullScreen?: () => Promise<void> | void;
};

type WebkitVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitCancelFullScreen?: () => void;
};

export function getFullscreenElement(): Element | null {
  const doc = document as FullscreenDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export function isNativeVideoFullscreen(video: HTMLVideoElement | null): boolean {
  return Boolean(video && (video as WebkitVideo).webkitDisplayingFullscreen);
}

export function isPlayerFullscreen(
  player: HTMLElement | null,
  video: HTMLVideoElement | null
): boolean {
  const fs = getFullscreenElement();
  if (player && fs && (fs === player || player.contains(fs) || fs.contains(player))) return true;
  return isNativeVideoFullscreen(video);
}

export async function enterPlayerFullscreen(
  player: HTMLElement,
  video: HTMLVideoElement
): Promise<void> {
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
    return;
  }
  const nativeVideo = video as WebkitVideo;
  if (typeof nativeVideo.webkitEnterFullscreen === 'function') {
    nativeVideo.webkitEnterFullscreen();
  }
}

export async function exitPlayerFullscreen(video: HTMLVideoElement | null): Promise<void> {
  const nativeVideo = video as WebkitVideo | null;
  if (nativeVideo?.webkitDisplayingFullscreen && typeof nativeVideo.webkitExitFullscreen === 'function') {
    nativeVideo.webkitExitFullscreen();
    return;
  }
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
