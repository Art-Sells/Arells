import { randomUUID } from 'crypto';
import { normalizeEmailKey } from '../auth/normalize';
import { getServerS3 } from './awsS3';
import { s3BucketNameOrThrow } from './s3Bucket';

export type CharacterGenerationCreditStatus = 'pending' | 'paid' | 'consumed';

export type CharacterGenerationCredit = {
  creditId: string;
  email: string;
  assetId: string;
  status: CharacterGenerationCreditStatus;
  amountCents: number;
  currency: string;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string | null;
  createdAt: string;
  paidAt?: string;
  consumedAt?: string;
};

const AMOUNT_CENTS = 249;

function creditsPrefix(email: string): string {
  return `users/${normalizeEmailKey(email)}/payments/character-generation/`;
}

function creditKey(email: string, creditId: string): string {
  return `${creditsPrefix(email)}${creditId}.json`;
}

function isMissing(err: unknown): boolean {
  const e = err as { code?: string; statusCode?: number };
  return e?.code === 'NoSuchKey' || e?.statusCode === 404;
}

async function readCredit(
  email: string,
  creditId: string
): Promise<CharacterGenerationCredit | null> {
  const s3 = getServerS3();
  const bucket = s3BucketNameOrThrow();
  try {
    const obj = await s3.getObject({ Bucket: bucket, Key: creditKey(email, creditId) }).promise();
    const body = obj.Body;
    if (!body) return null;
    const text = Buffer.isBuffer(body) ? body.toString('utf8') : String(body);
    return JSON.parse(text) as CharacterGenerationCredit;
  } catch (err) {
    if (isMissing(err)) return null;
    throw err;
  }
}

async function writeCredit(credit: CharacterGenerationCredit): Promise<void> {
  const s3 = getServerS3();
  const bucket = s3BucketNameOrThrow();
  await s3
    .putObject({
      Bucket: bucket,
      Key: creditKey(credit.email, credit.creditId),
      Body: JSON.stringify(credit),
      ContentType: 'application/json',
    })
    .promise();
}

export async function listCreditsForUser(email: string): Promise<CharacterGenerationCredit[]> {
  const s3 = getServerS3();
  const bucket = s3BucketNameOrThrow();
  const prefix = creditsPrefix(email);
  const out: CharacterGenerationCredit[] = [];
  let token: string | undefined;
  do {
    const page = await s3
      .listObjectsV2({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      })
      .promise();
    for (const item of page.Contents || []) {
      if (!item.Key?.endsWith('.json')) continue;
      try {
        const obj = await s3.getObject({ Bucket: bucket, Key: item.Key }).promise();
        const body = obj.Body;
        if (!body) continue;
        const text = Buffer.isBuffer(body) ? body.toString('utf8') : String(body);
        out.push(JSON.parse(text) as CharacterGenerationCredit);
      } catch {
        /* skip bad objects */
      }
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return out;
}

export async function findPaidUnusedCredit(
  email: string,
  assetId: string
): Promise<CharacterGenerationCredit | null> {
  const credits = await listCreditsForUser(email);
  const matches = credits
    .filter((c) => c.assetId === assetId && c.status === 'paid')
    .sort((a, b) => (a.paidAt || a.createdAt).localeCompare(b.paidAt || b.createdAt));
  return matches[0] || null;
}

export async function createPendingCredit(args: {
  email: string;
  assetId: string;
}): Promise<CharacterGenerationCredit> {
  const credit: CharacterGenerationCredit = {
    creditId: randomUUID(),
    email: args.email.trim().toLowerCase(),
    assetId: args.assetId,
    status: 'pending',
    amountCents: AMOUNT_CENTS,
    currency: 'usd',
    createdAt: new Date().toISOString(),
  };
  await writeCredit(credit);
  return credit;
}

export async function attachCheckoutSession(
  email: string,
  creditId: string,
  sessionId: string
): Promise<CharacterGenerationCredit | null> {
  const credit = await readCredit(email, creditId);
  if (!credit) return null;
  credit.stripeCheckoutSessionId = sessionId;
  await writeCredit(credit);
  return credit;
}

export async function markCreditPaid(args: {
  email: string;
  creditId: string;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string | null;
}): Promise<CharacterGenerationCredit | null> {
  const credit = await readCredit(args.email, args.creditId);
  if (!credit) return null;
  if (credit.status === 'consumed') return credit;
  credit.status = 'paid';
  credit.paidAt = credit.paidAt || new Date().toISOString();
  if (args.stripeCheckoutSessionId) {
    credit.stripeCheckoutSessionId = args.stripeCheckoutSessionId;
  }
  if (args.stripePaymentIntentId !== undefined) {
    credit.stripePaymentIntentId = args.stripePaymentIntentId;
  }
  await writeCredit(credit);
  return credit;
}

export async function markCreditPaidBySession(
  email: string,
  sessionId: string,
  paymentIntentId?: string | null
): Promise<CharacterGenerationCredit | null> {
  const credits = await listCreditsForUser(email);
  const credit = credits.find((c) => c.stripeCheckoutSessionId === sessionId);
  if (!credit) return null;
  return markCreditPaid({
    email,
    creditId: credit.creditId,
    stripeCheckoutSessionId: sessionId,
    stripePaymentIntentId: paymentIntentId,
  });
}

export async function consumePaidCredit(
  email: string,
  assetId: string
): Promise<CharacterGenerationCredit | null> {
  const credit = await findPaidUnusedCredit(email, assetId);
  if (!credit) return null;
  credit.status = 'consumed';
  credit.consumedAt = new Date().toISOString();
  await writeCredit(credit);
  return credit;
}
