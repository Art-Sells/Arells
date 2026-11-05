import type AWS from 'aws-sdk';
import sharp from 'sharp';
import {
  alienComposedKey,
  alienMetaloopSourceKey,
  isMissingS3Object,
} from './alienPhoto';
import { getServerS3 } from './awsS3';
import { s3BucketNameOrThrow } from './s3Bucket';

/** Same frame as LaunchPoster(guest).jpg. */
export const CHARACTER_METAPOSTER_WIDTH = 2000;
export const CHARACTER_METAPOSTER_HEIGHT = 1166;

const TARGET_RATIO = CHARACTER_METAPOSTER_HEIGHT / CHARACTER_METAPOSTER_WIDTH;

function isWideMetaposterSize(width: number, height: number): boolean {
  if (width < 2 || height < 2) return false;
  return Math.abs(height / width - TARGET_RATIO) < 0.02;
}

async function orientedSize(jpeg: Buffer): Promise<{ width: number; height: number }> {
  const meta = await sharp(jpeg, { failOn: 'none' }).rotate().metadata();
  return { width: meta.width || 0, height: meta.height || 0 };
}

/**
 * Character metaposter only. Full width, window starts 15.5% down, then 2000×1166.
 * The square buffer passed in is left unchanged for the metaposter loop.
 */
export async function cropCharacterMetaposter(jpeg: Buffer): Promise<Buffer> {
  const { width, height } = await orientedSize(jpeg);
  if (width < 2 || height < 2) {
    throw new Error('Character metaposter is too small to crop');
  }
  if (isWideMetaposterSize(width, height)) {
    if (width === CHARACTER_METAPOSTER_WIDTH && height === CHARACTER_METAPOSTER_HEIGHT) {
      return jpeg;
    }
    return sharp(jpeg, { failOn: 'none' })
      .rotate()
      .resize(CHARACTER_METAPOSTER_WIDTH, CHARACTER_METAPOSTER_HEIGHT, { fit: 'fill' })
      .jpeg({ quality: 95, mozjpeg: true })
      .toBuffer();
  }

  const top = Math.min(height - 1, Math.round(height * 0.155));
  let cropH = Math.round(width * TARGET_RATIO);
  if (top + cropH > height) cropH = height - top;
  cropH = Math.max(1, cropH);

  return sharp(jpeg, { failOn: 'none' })
    .rotate()
    .extract({ left: 0, top, width, height: cropH })
    .resize(CHARACTER_METAPOSTER_WIDTH, CHARACTER_METAPOSTER_HEIGHT, { fit: 'fill' })
    .jpeg({ quality: 95, mozjpeg: true })
    .toBuffer();
}

/** Save the wide metaposter, and keep the square still for loop generation. */
export async function saveCharacterMetaposter(args: {
  s3: AWS.S3;
  bucket: string;
  email: string;
  asset: string;
  staging: boolean;
  squareJpeg: Buffer;
}): Promise<void> {
  const cropped = await cropCharacterMetaposter(args.squareJpeg);
  await args.s3
    .putObject({
      Bucket: args.bucket,
      Key: alienMetaloopSourceKey(args.email, args.asset, args.staging),
      Body: args.squareJpeg,
      ContentType: 'image/jpeg',
      ACL: 'private',
    })
    .promise();
  await args.s3
    .putObject({
      Bucket: args.bucket,
      Key: alienComposedKey(args.email, args.asset, args.staging),
      Body: cropped,
      ContentType: 'image/jpeg',
      ACL: 'private',
    })
    .promise();
}

async function readJpeg(s3: AWS.S3, bucket: string, key: string): Promise<Buffer | null> {
  try {
    const obj = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    const body = obj.Body;
    if (!body) return null;
    return Buffer.isBuffer(body) ? body : Buffer.from(body as ArrayBuffer);
  } catch (err) {
    if (isMissingS3Object(err)) return null;
    throw err;
  }
}

/** Square still the metaposter loop is generated from. Never the wide crop. */
export async function loadCharacterMetaloopSource(
  s3: AWS.S3,
  bucket: string,
  email: string,
  asset: string
): Promise<Buffer> {
  for (const staging of [true, false]) {
    const source = await readJpeg(s3, bucket, alienMetaloopSourceKey(email, asset, staging));
    if (source) return source;
  }
  for (const staging of [true, false]) {
    const composed = await readJpeg(s3, bucket, alienComposedKey(email, asset, staging));
    if (!composed) continue;
    const size = await orientedSize(composed);
    if (!isWideMetaposterSize(size.width, size.height)) return composed;
  }
  throw Object.assign(new Error('Missing square metaposter for the loop'), { code: 'NoSuchKey' });
}

/**
 * Crop the metaposter already stored for this user.
 * The square is kept as the loop source. The loop file is not rewritten.
 */
export async function cropStoredCharacterMetaposter(
  email: string,
  asset = 'bitcoin'
): Promise<{ cropped: boolean; width: number; height: number }> {
  const s3 = getServerS3();
  const bucket = s3BucketNameOrThrow();
  let croppedAny = false;
  let width = 0;
  let height = 0;

  for (const staging of [false, true]) {
    const key = alienComposedKey(email, asset, staging);
    const jpeg = await readJpeg(s3, bucket, key);
    if (!jpeg) continue;
    const size = await orientedSize(jpeg);
    if (isWideMetaposterSize(size.width, size.height)) {
      width = size.width;
      height = size.height;
      continue;
    }
    const sourceKey = alienMetaloopSourceKey(email, asset, staging);
    const existingSource = await readJpeg(s3, bucket, sourceKey);
    if (!existingSource) {
      await s3
        .putObject({
          Bucket: bucket,
          Key: sourceKey,
          Body: jpeg,
          ContentType: 'image/jpeg',
          ACL: 'private',
        })
        .promise();
    }
    const cropped = await cropCharacterMetaposter(jpeg);
    await s3
      .putObject({
        Bucket: bucket,
        Key: key,
        Body: cropped,
        ContentType: 'image/jpeg',
        ACL: 'private',
      })
      .promise();
    const out = await orientedSize(cropped);
    width = out.width;
    height = out.height;
    croppedAny = true;
  }

  return { cropped: croppedAny, width, height };
}
