import type AWS from 'aws-sdk';

/** Count `sessions/{id}/VavityAggregate.json` objects (registered session aggregates). */
export async function countSessionAggregateKeys(s3: AWS.S3, bucket: string): Promise<number> {
  let n = 0;
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

    for (const obj of out.Contents || []) {
      if (obj.Key?.endsWith('/VavityAggregate.json')) n += 1;
    }

    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);

  return n;
}
