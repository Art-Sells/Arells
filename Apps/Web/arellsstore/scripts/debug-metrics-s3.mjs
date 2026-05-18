/**
 * Debug DAUt/WAUt/MAUt vs S3 users/ touches. Run: node scripts/debug-metrics-s3.mjs
 */
import { config } from 'dotenv';
import AWS from 'aws-sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const DAY_MS = 86_400_000;
const bucket = process.env.S3_BUCKET_NAME;
if (!bucket) {
  console.error('S3_BUCKET_NAME missing in .env');
  process.exit(1);
}

const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

function isoDayKey(ts) {
  return new Date(ts).toISOString().slice(0, 10);
}

function startOfUtcDay(ts) {
  const d = new Date(ts);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function eachUtcDay(fromMs, toMs) {
  const keys = [];
  let t = startOfUtcDay(fromMs);
  const end = startOfUtcDay(toMs);
  while (t <= end) {
    keys.push(isoDayKey(t));
    t += DAY_MS;
  }
  return keys;
}

function userSpanMs(ut) {
  const times = [ut.authMs, ut.vavityMs].filter((t) => t != null);
  if (!times.length) return null;
  return { min: Math.min(...times), max: Math.max(...times) };
}

function userHadS3WriteOnUtcDay(ut, dayKey) {
  if (ut.authMs != null && isoDayKey(ut.authMs) === dayKey) return true;
  if (ut.vavityMs != null && isoDayKey(ut.vavityMs) === dayKey) return true;
  return false;
}

function sessionTouchesUtcDay(min, max, dayKey) {
  const d0 = Date.parse(`${dayKey}T00:00:00.000Z`);
  const d1 = d0 + DAY_MS - 1;
  return min <= d1 && max >= d0;
}

function userTouchesUtcDaySpan(ut, dayKey) {
  const span = userSpanMs(ut);
  if (!span) return false;
  return sessionTouchesUtcDay(span.min, span.max, dayKey);
}

function spanOverlapsRange(min, max, rangeStart, rangeEnd) {
  return max >= rangeStart && min <= rangeEnd;
}

async function loadTouchMap() {
  const map = new Map();
  let token;
  do {
    const out = await s3
      .listObjectsV2({ Bucket: bucket, Prefix: 'users/', ContinuationToken: token, MaxKeys: 1000 })
      .promise();
    for (const obj of out.Contents || []) {
      if (!obj.Key || !obj.LastModified) continue;
      const lm = obj.LastModified.getTime();
      const auth = obj.Key.match(/^users\/(.+)\/Auth\.json$/);
      if (auth) {
        const k = auth[1];
        const cur = map.get(k) || {};
        cur.authMs = cur.authMs == null ? lm : Math.max(cur.authMs, lm);
        map.set(k, cur);
      }
      const v = obj.Key.match(/^users\/(.+)\/VavityAggregate\.json$/);
      if (v) {
        const k = v[1];
        const cur = map.get(k) || {};
        cur.vavityMs = cur.vavityMs == null ? lm : Math.max(cur.vavityMs, lm);
        map.set(k, cur);
      }
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return map;
}

const nowMs = Date.now();
const todayKey = isoDayKey(nowMs);
const weekKeys = eachUtcDay(nowMs - 6 * DAY_MS, nowMs);
const monthStart = Date.UTC(new Date(nowMs).getUTCFullYear(), new Date(nowMs).getUTCMonth(), 1);
const monthKeys = eachUtcDay(monthStart, nowMs);
const weekStart = startOfUtcDay(nowMs - 6 * DAY_MS);
const weekEnd = startOfUtcDay(nowMs) + DAY_MS - 1;

const touchMap = await loadTouchMap();
console.log(`\nBucket: ${bucket}`);
console.log(`UTC now: ${new Date(nowMs).toISOString()} (today=${todayKey})`);
console.log(`Week days: ${weekKeys.join(', ')}`);
console.log(`Accounts with Auth.json listing: ${touchMap.size}\n`);

let dauWrite = 0;
let wauWrite = new Set();
let mauSpan = new Set();
let wauSpan = 0;
let dauSpan = 0;

for (const [emailKey, ut] of touchMap) {
  const span = userSpanMs(ut);
  const authDay = ut.authMs != null ? isoDayKey(ut.authMs) : '—';
  const vavityDay = ut.vavityMs != null ? isoDayKey(ut.vavityMs) : '—';
  const writeToday = userHadS3WriteOnUtcDay(ut, todayKey);
  const writeWeek = weekKeys.some((d) => userHadS3WriteOnUtcDay(ut, d));
  const spanWeek = span && spanOverlapsRange(span.min, span.max, weekStart, weekEnd);
  const spanToday = span && userTouchesUtcDaySpan(ut, todayKey);
  let spanMonth = false;
  for (const d of monthKeys) {
    if (userTouchesUtcDaySpan(ut, d)) {
      spanMonth = true;
      mauSpan.add(emailKey);
    }
  }
  if (writeToday) dauWrite += 1;
  if (writeWeek) wauWrite.add(emailKey);
  if (spanWeek) wauSpan += 1;
  if (spanToday) dauSpan += 1;

  console.log(
    `${emailKey.slice(0, 40).padEnd(42)} auth=${authDay} vavity=${vavityDay} | writeToday=${writeToday} writeWeek=${writeWeek} spanToday=${spanToday} spanWeek=${spanWeek} spanMonth=${spanMonth}`
  );
}

console.log('\n--- Counts ---');
console.log(`DAUt (write today):     ${dauWrite}`);
console.log(`DAUt (span today):      ${dauSpan}`);
console.log(`WAUt (write in 7d):     ${wauWrite.size}`);
console.log(`WAUt (span overlaps 7d): ${wauSpan}`);
console.log(`MAUt (span in month):   ${mauSpan.size}`);
console.log('');
