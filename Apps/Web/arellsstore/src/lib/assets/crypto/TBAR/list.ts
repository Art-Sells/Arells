import { s3BucketNameOrThrow } from '../../../server/s3Bucket';
import { THE_BITCOIN_ALIEN_REPORT, tbarObjectKey } from './catalog';
import {
  fileKind,
  formatTBARDayLabel,
  groupTBARMedia,
  parseTBARFolder,
  publicS3ObjectUrl,
  type TBARDay,
  type TBARMedia,
} from './media';

function s3Region(): string {
  return (
    process.env.WS_REGION?.trim() ||
    process.env.AWS_REGION?.trim() ||
    process.env.AWS_DEFAULT_REGION?.trim() ||
    'us-west-1'
  );
}

export async function listTBAR(): Promise<TBARDay[]> {
  let bucket: string;
  try {
    bucket = s3BucketNameOrThrow();
  } catch {
    return [];
  }

  const region = s3Region();
  const days: TBARDay[] = [];

  for (const entry of THE_BITCOIN_ALIEN_REPORT) {
    if (!parseTBARFolder(entry.folder)) continue;
    const label = formatTBARDayLabel(entry.folder);
    if (!label) continue;

    const files: TBARMedia[] = [];
    for (const relative of entry.files) {
      const name = relative.replace(/^\/+/, '');
      if (!name) continue;
      const fileName = name.split('/').filter(Boolean).pop() || name;
      const kind = fileKind(fileName);
      if (!kind) continue;
      const key = tbarObjectKey(entry.folder, name);
      files.push({
        key,
        url: publicS3ObjectUrl(bucket, region, key),
        name,
        kind,
      });
    }

    const media = groupTBARMedia(files);
    days.push({
      folder: entry.folder,
      label,
      images: media.filter((item) => item.kind === 'image'),
      media,
    });
  }

  days.sort((a, b) => {
    const pa = parseTBARFolder(a.folder)!;
    const pb = parseTBARFolder(b.folder)!;
    return Date.UTC(pb.year, pb.month - 1, pb.day) - Date.UTC(pa.year, pa.month - 1, pa.day);
  });

  return days;
}
