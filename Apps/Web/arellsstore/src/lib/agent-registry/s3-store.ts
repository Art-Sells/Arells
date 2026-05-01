import { createHash } from "node:crypto";

import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import type { AgentRegistryRecord } from "./types";
import { AGENT_REGISTRY_SCHEMA } from "./types";

const PREFIX = "agent-registry/records/";

function getBucketName(): string | null {
  return (
    process.env.S3_BUCKET_NAME?.trim() ||
    process.env.AWS_S3_BUCKET?.trim() ||
    process.env.S3_BUCKET?.trim() ||
    null
  );
}

function getRegion(): string {
  return (
    process.env.WS_REGION?.trim() ||
    process.env.AWS_REGION?.trim() ||
    "us-east-1"
  );
}

function getS3Client(): S3Client | null {
  const bucket = getBucketName();
  if (!bucket) return null;
  const accessKeyId = process.env.WS_ACCESS_KEY_ID?.trim() || process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey =
    process.env.WS_SECRET_ACCESS_KEY?.trim() || process.env.AWS_SECRET_ACCESS_KEY?.trim();
  return new S3Client({
    region: getRegion(),
    credentials:
      accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey }
        : undefined,
  });
}

export function isS3RegistryConfigured(): boolean {
  return Boolean(getBucketName() && getS3Client());
}

export function objectKeyForOrigin(origin: string): string {
  const h = createHash("sha256").update(origin, "utf8").digest("hex");
  return `${PREFIX}${h}.json`;
}

async function readBodyString(body: unknown): Promise<string> {
  if (!body) return "";
  const anyBody = body as { transformToString?: () => Promise<string> };
  if (typeof anyBody.transformToString === "function") {
    return anyBody.transformToString();
  }
  const chunks: Uint8Array[] = [];
  const stream = body as AsyncIterable<Uint8Array>;
  for await (const c of stream) {
    chunks.push(c);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function putAgentRegistryRecord(
  record: Omit<AgentRegistryRecord, "schema"> & Partial<Pick<AgentRegistryRecord, "schema">>,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const client = getS3Client();
  const bucket = getBucketName();
  if (!client || !bucket) {
    return { ok: false, reason: "S3 bucket not configured (S3_BUCKET_NAME + credentials)." };
  }

  const full: AgentRegistryRecord = {
    schema: AGENT_REGISTRY_SCHEMA,
    ...record,
  };

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKeyForOrigin(record.origin),
      Body: JSON.stringify(full, null, 2),
      ContentType: "application/json",
    }),
  );

  return { ok: true };
}

export async function listAgentRegistryRecords(): Promise<
  AgentRegistryRecord[] | { error: string }
> {
  const client = getS3Client();
  const bucket = getBucketName();
  if (!client || !bucket) {
    return { error: "S3 bucket not configured." };
  }

  const listOut = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: PREFIX,
      MaxKeys: 500,
    }),
  );

  const keys = (listOut.Contents ?? [])
    .map((o) => o.Key)
    .filter((k): k is string => Boolean(k));

  const records: AgentRegistryRecord[] = [];
  for (const key of keys) {
    const getOut = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const text = await readBodyString(getOut.Body);
    if (!text) continue;
    try {
      const r = JSON.parse(text) as AgentRegistryRecord;
      if (r.schema === AGENT_REGISTRY_SCHEMA && r.optedIn) {
        records.push(r);
      }
    } catch {
      /* skip corrupt */
    }
  }

  records.sort((a, b) => (a.lastVerifiedAt < b.lastVerifiedAt ? 1 : -1));
  return records;
}
