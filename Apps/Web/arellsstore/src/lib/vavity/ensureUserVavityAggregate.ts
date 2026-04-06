import AWS from 'aws-sdk';

const emptyTotals = { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 };

const normalizeEmailKey = (raw: string) => encodeURIComponent(raw.trim().toLowerCase());

/**
 * If the user has no Vavity aggregate in S3 yet, writes an empty document.
 * Used after email verification so the object exists before the client loads.
 */
export async function ensureUserVavityAggregateExists(email: string): Promise<void> {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) return;

  const key = `users/${normalizeEmailKey(email)}/VavityAggregate.json`;
  const s3 = new AWS.S3();

  try {
    await s3.headObject({ Bucket: bucket, Key: key }).promise();
  } catch (err: any) {
    if (err?.code !== 'NotFound' && err?.statusCode !== 404 && err?.code !== 'NoSuchKey') {
      console.error('[vavity] ensureUserVavityAggregateExists headObject:', err);
      return;
    }
    const body = JSON.stringify({
      investments: [],
      totals: { ...emptyTotals },
      totalsLiquid: { ...emptyTotals },
    });
    try {
      await s3
        .putObject({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: 'application/json',
          ACL: 'private',
        })
        .promise();
    } catch (putErr) {
      console.error('[vavity] ensureUserVavityAggregateExists putObject:', putErr);
    }
  }
}
