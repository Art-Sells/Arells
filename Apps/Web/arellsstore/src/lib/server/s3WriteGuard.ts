/** When true, engagement PutObject no-ops (optional local read-only). Prefix is controlled by MYINV_ENGAGEMENT_LIVE_STORAGE in myInvestmentsEngagement.ts. */
export function isS3WriteDisabled(): boolean {
  const raw = process.env.S3_WRITE_DISABLED?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}
