import dotenv from 'dotenv';
dotenv.config();
import { getServerS3 } from '../src/lib/server/awsS3';
import {
  buildMetricsActivityDebug,
  aggregateSignedInUserTraffic,
} from '../src/lib/metrics/metricsPageMounts';

async function main() {
  const s3 = getServerS3();
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) throw new Error('S3_BUCKET_NAME missing');
  const now = Date.now();
  const [counts, debug] = await Promise.all([
    aggregateSignedInUserTraffic(s3, bucket, now),
    buildMetricsActivityDebug(s3, bucket, now),
  ]);
  const today = counts.utcToday;
  const y = new Date(
    Date.UTC(
      Number(today.slice(0, 4)),
      Number(today.slice(5, 7)) - 1,
      Number(today.slice(8, 10))
    )
  );
  y.setUTCDate(y.getUTCDate() - 1);
  const yKey = y.toISOString().slice(0, 10);

  const dauUsers = debug.accounts.filter((a) => {
    if (a.activeToday || a.activeYesterday) return true;
    return a.mountDaysLast7.includes(today) || a.mountDaysLast7.includes(yKey);
  });

  console.log(
    JSON.stringify(
      {
        utcToday: counts.utcToday,
        dauWindow: [yKey, today],
        dauCount: counts.dau,
        listed: dauUsers.length,
        users: dauUsers
          .map((a) => ({
            email: decodeURIComponent(a.emailKey),
            activeToday: a.activeToday,
            activeYesterday: a.activeYesterday,
            mountDaysInWindow: a.mountDaysLast7.filter(
              (d) => d === today || d === yKey
            ),
            authDay: a.authDay,
            vavityDay: a.vavityDay,
          }))
          .sort((a, b) => a.email.localeCompare(b.email)),
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
