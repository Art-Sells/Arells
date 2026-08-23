export function captureVideoFrame(video: HTMLVideoElement, quality = 0.72): string | null {
  if (!video.videoWidth || !video.videoHeight) return null;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0);
  try {
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return null;
  }
}

export function midVideoFrameTime(video: HTMLVideoElement): number {
  const duration = video.duration;
  if (!Number.isFinite(duration) || duration <= 0) return 0.1;
  return duration / 2;
}
