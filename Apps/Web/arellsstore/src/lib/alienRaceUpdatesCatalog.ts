import { ALIEN_RACE_UPDATES_PREFIX } from './bitcoinAlienRaceUpdates';

/** Date folder `mm.dd.yy` plus files under that folder. Upload to S3 first, then add them here. */
export type AlienRaceUpdatesDayCatalog = {
  folder: string;
  files: string[];
};

/**
 * What the app shows. S3 uploads do not appear until they are listed here and deployed
 * (or the local catalog is saved while you run the app).
 */
export const ALIEN_RACE_UPDATES_CATALOG: AlienRaceUpdatesDayCatalog[] = [
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

export function alienRaceUpdatesObjectKey(folder: string, relativeFile: string): string {
  const name = relativeFile.replace(/^\/+/, '');
  return `${ALIEN_RACE_UPDATES_PREFIX}${folder}/${name}`;
}
