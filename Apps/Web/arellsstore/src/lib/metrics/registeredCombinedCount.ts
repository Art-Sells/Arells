import type AWS from 'aws-sdk';
import { countSessionAggregateKeys } from './countSessionKeysInS3';
import { listUserS3Touches } from './listUserS3Touches';

/** Same headline total as Growth → All → “New User Traffic” (`registeredUserKeys + registeredSessionKeys`). */
export async function computeMetricsRegisteredCombined(s3: AWS.S3, bucket: string): Promise<number> {
  const [touchMap, registeredSessionKeys] = await Promise.all([
    listUserS3Touches(s3, bucket),
    countSessionAggregateKeys(s3, bucket),
  ]);
  return touchMap.size + registeredSessionKeys;
}
