import { s3BucketNameOrThrow } from './s3Bucket';
import {
  ALIEN_RACE_UPDATES_CATALOG,
  alienRaceUpdatesObjectKey,
} from '../alienRaceUpdatesCatalog';
import {
  fileKind,
  formatAlienRaceDayLabel,
  groupAlienRaceMedia,
  parseAlienRaceFolder,
  publicS3ObjectUrl,
  type AlienRaceDay,
  type AlienRaceMedia,
} from '../bitcoinAlienRaceUpdates';

function s3Region(): string {
  return (
    process.env.WS_REGION?.trim() ||
    process.env.AWS_REGION?.trim() ||
    process.env.AWS_DEFAULT_REGION?.trim() ||
    'us-west-1'
  );
}

export async function listBitcoinAlienRaceUpdates(): Promise<AlienRaceDay[]> {
  let bucket: string;
  try {
    bucket = s3BucketNameOrThrow();
  } catch {
    return [];
  }

  const region = s3Region();
  const days: AlienRaceDay[] = [];

  for (const entry of ALIEN_RACE_UPDATES_CATALOG) {
    if (!parseAlienRaceFolder(entry.folder)) continue;
    const label = formatAlienRaceDayLabel(entry.folder);
    if (!label) continue;

    const files: AlienRaceMedia[] = [];
    for (const relative of entry.files) {
      const name = relative.replace(/^\/+/, '');
      if (!name) continue;
      const fileName = name.split('/').filter(Boolean).pop() || name;
      const kind = fileKind(fileName);
      if (!kind) continue;
      const key = alienRaceUpdatesObjectKey(entry.folder, name);
      files.push({
        key,
        url: publicS3ObjectUrl(bucket, region, key),
        name,
        kind,
      });
    }

    const media = groupAlienRaceMedia(files);
    days.push({
      folder: entry.folder,
      label,
      images: media.filter((item) => item.kind === 'image'),
      media,
    });
  }

  days.sort((a, b) => {
    const pa = parseAlienRaceFolder(a.folder)!;
    const pb = parseAlienRaceFolder(b.folder)!;
    return Date.UTC(pb.year, pb.month - 1, pb.day) - Date.UTC(pa.year, pa.month - 1, pa.day);
  });

  return days;
}
