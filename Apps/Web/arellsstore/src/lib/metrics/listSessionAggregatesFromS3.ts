import type AWS from 'aws-sdk';

export type SessionAggregateRow = {
  sessionId: string;
  lastModifiedMs: number;
};

/** Every `sessions/{id}/VavityAggregate.json` with LastModified (for metrics when analytics/session-meta is missing). */
export async function listSessionAggregatesFromS3(
  s3: AWS.S3,
  bucket: string
): Promise<SessionAggregateRow[]> {
  const best = new Map<string, number>();
  let token: string | undefined;

  do {
    const out = await s3
      .listObjectsV2({
        Bucket: bucket,
        Prefix: 'sessions/',
        ContinuationToken: token,
        MaxKeys: 1000,
      })
      .promise();

    for (const o of out.Contents || []) {
      const k = o.Key;
      if (!k?.endsWith('/VavityAggregate.json')) continue;
      const parts = k.split('/').filter(Boolean);
      const sessionId = parts[1];
      if (!sessionId) continue;
      const lm = o.LastModified?.getTime() ?? 0;
      const prev = best.get(sessionId);
      if (prev == null || lm > prev) best.set(sessionId, lm);
    }

    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);

  return [...best.entries()].map(([sessionId, lastModifiedMs]) => ({ sessionId, lastModifiedMs }));
}
