import { s3BucketNameOrThrow } from './s3Bucket';
import { getServerS3 } from './awsS3';
import {
  ALIEN_RACE_UPDATES_PREFIX,
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

  const s3 = getServerS3();
  const region = s3Region();
  const byFolder = new Map<string, AlienRaceMedia[]>();
  let token: string | undefined;

  do {
    const out = await s3
      .listObjectsV2({
        Bucket: bucket,
        Prefix: ALIEN_RACE_UPDATES_PREFIX,
        ContinuationToken: token,
        MaxKeys: 1000,
      })
      .promise();

    for (const obj of out.Contents || []) {
      if (!obj.Key || obj.Key.endsWith('/')) continue;
      const rest = obj.Key.slice(ALIEN_RACE_UPDATES_PREFIX.length);
      const slash = rest.indexOf('/');
      if (slash <= 0) continue;
      const folder = rest.slice(0, slash);
      if (!parseAlienRaceFolder(folder)) continue;
      const relative = rest.slice(slash + 1);
      if (!relative) continue;
      const name = relative.split('/').filter(Boolean).pop() || relative;
      const kind = fileKind(name);
      if (!kind) continue;
      const list = byFolder.get(folder) || [];
      list.push({
        key: obj.Key,
        url: publicS3ObjectUrl(bucket, region, obj.Key),
        name: relative,
        kind,
      });
      byFolder.set(folder, list);
    }

    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);

  const days: AlienRaceDay[] = [];
  for (const [folder, files] of byFolder) {
    const label = formatAlienRaceDayLabel(folder);
    if (!label) continue;
    const media = groupAlienRaceMedia(files);
    const images = media.filter((item) => item.kind === 'image');
    days.push({
      folder,
      label,
      images,
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
