import { TBAR_PREFIX } from './media';

/** Date folder `mm.dd.yy` plus files under that folder. Upload to S3 first, then add them here. */
export type TBARCatalog = {
  folder: string;
  files: string[];
};

/**
 * What the app shows. S3 uploads do not appear until they are listed here and deployed
 * (or the local catalog is saved while you run the app).
 */
export const THE_BITCOIN_ALIEN_REPORT: TBARCatalog[] = [
  {
    folder: '10.30.26',
    files: [
      'TBARS1E2W4(preview).jpg',
      'TBARS1E2W4(480p).mp4',
      'TBARS1E2W4(720p).mp4',
      'TBARS1E2W4(1080p).mp4',
    ],
  },
  {
    folder: '10.23.26',
    files: [
      'TBARS1E2W3(preview).jpg',
      'TBARS1E2W3(480p).mp4',
      'TBARS1E2W3(720p).mp4',
      'TBARS1E2W3(1080p).mp4',
    ],
  },
  {
    folder: '10.16.26',
    files: [
      'TBARS1E2W2(preview).jpg',
      'TBARS1E2W2(480p).mp4',
      'TBARS1E2W2(720p).mp4',
      'TBARS1E2W2(1080p).mp4',
    ],
  },
  {
    folder: '10.09.26',
    files: [
      'TBARS1E2W1(preview).jpg',
      'TBARS1E2W1(480p).mp4',
      'TBARS1E2W1(720p).mp4',
      'TBARS1E2W1(1080p).mp4',
    ],
  },
  {
    folder: '10.02.26',
    files: [
      'TBARS1E1W5(preview).png',
      'TBARS1E1W5(480p).mp4',
      'TBARS1E1W5(720p).mp4',
      'TBARS1E1W5(1080p).mp4',
    ],
  },
  {
    folder: '09.25.26',
    files: [
      'TBARS1E1W4(preview).jpg',
      'TBARS1E1W4(480p).mp4',
      'TBARS1E1W4(720p).mp4',
      'TBARS1E1W4(1080p).mp4',
    ],
  },
  {
    folder: '09.18.26',
    files: [
      'TBARS1E1W3(preview).jpg',
      'TBARS1E1W3(480p).mp4',
      'TBARS1E1W3(720p).mp4',
      'TBARS1E1W3(1080p).mp4',
    ],
  },
  {
    folder: '09.13.26',
    files: [
      'TBARS1E1W2(preview).jpg',
      'TBARS1E1W2(480p).mp4',
      'TBARS1E1W2(720p).mp4',
      'TBARS1E1W2(1080p).mp4',
    ],
  },
  {
    folder: '09.09.26',
    files: [
      'SneakPeak4Preview.jpg',
      'SneakPeek4(480p).mp4',
      'SneakPeek4(720p).mp4',
      'SneakPeek4(1080p).mp4',
    ],
  },
  {
    folder: '08.31.26',
    files: [
      'SneakPeak3Preview.jpg',
      'SneakPeek3(480p).mp4',
      'SneakPeek3(720p).mp4',
      'SneakPeek3(1080p).mp4',
    ],
  },
  {
    folder: '08.24.26',
    files: ['TheBitcoinMemoriam.jpg'],
  },
  {
    folder: '08.23.26',
    files: [
      'LeilaCharacterProfileWeb.jpg',
      'SamCharacterProfileWeb.jpg',
      'previews/LeilaPreview.jpg',
      'previews/SamPreview.jpg',
      'TelepathyAnnouncement480p.mp4',
      'TelepathyAnnouncement720p.mp4',
      'TelepathyAnnouncement1080p.mp4',
    ],
  },
];

export function tbarObjectKey(folder: string, relativeFile: string): string {
  const name = relativeFile.replace(/^\/+/, '');
  return `${TBAR_PREFIX}${folder}/${name}`;
}
