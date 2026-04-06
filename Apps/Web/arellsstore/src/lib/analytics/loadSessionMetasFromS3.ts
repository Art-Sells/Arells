import type AWS from 'aws-sdk';
import type { AnalyticsSessionMeta } from './types';
import { ANALYTICS_META_PREFIX } from './types';

export async function loadAllSessionMetasFromS3(
  s3: AWS.S3,
  bucket: string
): Promise<AnalyticsSessionMeta[]> {
  const metas: AnalyticsSessionMeta[] = [];
  let token: string | undefined;

  do {
    const out = await s3
      .listObjectsV2({
        Bucket: bucket,
        Prefix: ANALYTICS_META_PREFIX,
        ContinuationToken: token,
        MaxKeys: 500,
      })
      .promise();

    const keys = (out.Contents || [])
      .map((o) => o.Key)
      .filter((k): k is string => Boolean(k && k.endsWith('.json')));

    const batch = await Promise.all(
      keys.map(async (key) => {
        try {
          const obj = await s3.getObject({ Bucket: bucket, Key: key }).promise();
          if (!obj.Body) return null;
          return JSON.parse(obj.Body.toString()) as AnalyticsSessionMeta;
        } catch {
          return null;
        }
      })
    );

    for (const m of batch) {
      if (m && typeof m.sessionId === 'string' && typeof m.firstSeenAt === 'number') {
        metas.push(m);
      }
    }

    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);

  return metas;
}
