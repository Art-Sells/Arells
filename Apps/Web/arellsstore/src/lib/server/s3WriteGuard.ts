/** When true, S3 PutObject calls for engagement/metrics should no-op (local preview against prod bucket). */
export function isS3WriteDisabled(): boolean {
  const raw = process.env.S3_WRITE_DISABLED?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}
