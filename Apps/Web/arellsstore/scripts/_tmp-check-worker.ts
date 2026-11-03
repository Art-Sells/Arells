import dotenv from 'dotenv';
dotenv.config();
import AWS from 'aws-sdk';
import { getServerS3 } from '../src/lib/server/awsS3';
import { normalizeEmailKey } from '../src/lib/auth/normalize';
import {
  isAlienGenerateWorkerConfigured,
  alienGenerateWorkerTarget,
} from '../src/lib/server/alienGenerateWorkerEnqueue';

async function main() {
  console.log(
    'workerConfigured',
    isAlienGenerateWorkerConfigured(),
    alienGenerateWorkerTarget()
  );
  const region = process.env.WS_REGION || 'us-west-1';
  const lambda = new AWS.Lambda({
    region,
    accessKeyId: process.env.WS_ACCESS_KEY_ID,
    secretAccessKey: process.env.WS_SECRET_ACCESS_KEY,
  });
  try {
    const fn = await lambda.getFunction({ FunctionName: 'arells-alien-generate-worker' }).promise();
    const c = fn.Configuration || {};
    console.log(
      JSON.stringify(
        {
          name: c.FunctionName,
          runtime: c.Runtime,
          timeout: c.Timeout,
          state: c.State,
          lastModified: c.LastModified,
          role: c.Role,
          envKeys: Object.keys(c.Environment?.Variables || {}),
          hasGrok: Boolean(c.Environment?.Variables?.GROK_API_KEY),
          hasBucket: Boolean(c.Environment?.Variables?.S3_BUCKET_NAME),
        },
        null,
        2
      )
    );
  } catch (e: unknown) {
    const err = e as { code?: string; name?: string; message?: string };
    console.log('getFunction error', err.code || err.name, err.message);
  }

  const s3 = getServerS3();
  const bucket = process.env.S3_BUCKET_NAME!;
  const key = `users/${normalizeEmailKey('brink1111111@outlook.com')}/aliens/bitcoin-generate-job.json`;
  try {
    const obj = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    console.log('job', obj.Body?.toString('utf8'));
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    console.log('job read error', err.code || err.message);
  }
}

main();
