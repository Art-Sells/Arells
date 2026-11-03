import dotenv from 'dotenv';
dotenv.config();
import { getServerS3 } from '../src/lib/server/awsS3';
import { normalizeEmailKey } from '../src/lib/auth/normalize';

async function main() {
  const s3 = getServerS3();
  const bucket = process.env.S3_BUCKET_NAME!;
  const region = process.env.AWS_REGION || 'us-west-1';
  for (const email of ['jeyakatsa@gmail.com', 'brink1111111@outlook.com']) {
    const ek = normalizeEmailKey(email);
    const prefixes = [
      `users/${ek}/aliens/`,
      `users/${encodeURIComponent(email.toLowerCase())}/aliens/`,
      `users/${email.toLowerCase()}/aliens/`,
    ];
    for (const Prefix of prefixes) {
      const r = await s3.listObjectsV2({ Bucket: bucket, Prefix, MaxKeys: 50 }).promise();
      for (const o of r.Contents || []) {
        if (!o.Key) continue;
        if (!/metaloop|seasonone-loop|seasononeloop/i.test(o.Key)) continue;
        console.log(JSON.stringify({
          email,
          key: o.Key,
          url: `https://${bucket}.s3.${region}.amazonaws.com/${o.Key.split('/').map(encodeURIComponent).join('/')}`,
          size: o.Size,
          updated: o.LastModified,
        }));
      }
    }
  }
}
main();
