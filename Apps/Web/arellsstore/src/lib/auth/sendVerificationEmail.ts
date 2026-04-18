import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { sesFormattedFrom } from './sesFormattedFrom';

export async function sendVerificationEmail(opts: {
  to: string;
  verifyUrl: string;
  logoUrl: string;
}): Promise<{ sent: boolean; skippedReason?: string }> {
  if (process.env.AUTH_EMAIL_DISABLED === '1') {
    console.info('[auth] AUTH_EMAIL_DISABLED: verification URL for', opts.to, opts.verifyUrl);
    return { sent: false, skippedReason: 'AUTH_EMAIL_DISABLED' };
  }

  const fromAddr = process.env.VERIFY_EMAIL_FROM?.trim();
  if (!fromAddr) {
    console.warn('[auth] VERIFY_EMAIL_FROM not set; cannot send verification email. URL:', opts.verifyUrl);
    return { sent: false, skippedReason: 'VERIFY_EMAIL_FROM' };
  }
  const from = sesFormattedFrom('Verify Arells', fromAddr);

  const region =
    process.env.WS_REGION?.trim() ||
    process.env.AWS_REGION?.trim() ||
    process.env.WS_DEFAULT_REGION?.trim() ||
    'us-east-1';
  const accessKeyId =
    process.env.WS_ACCESS_KEY_ID?.trim() || process.env.AWS_ACCESS_KEY_ID?.trim() || '';
  const secretAccessKey =
    process.env.WS_SECRET_ACCESS_KEY?.trim() || process.env.AWS_SECRET_ACCESS_KEY?.trim() || '';
  const client = new SESClient({
    region,
    ...(accessKeyId && secretAccessKey
      ? { credentials: { accessKeyId, secretAccessKey } }
      : {}),
  });

  const subject = 'Arells Email Verification';
  const text = `Click this link to verify your email:\n\n${opts.verifyUrl}\n`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${subject}</title></head><body style="font-family:Arial,sans-serif;background:#f6f6f6;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #e0e0e0;">
    <img src="${opts.logoUrl}" alt="Arells" width="50" height="50" style="display:block;width:50px;height:50px;margin-bottom:16px;" />
    <h1 style="font-size:18px;margin:0 0 12px;">Arells Email Verification</h1>
    <p style="margin:0 0 16px;color:#333;">Click this link to verify your email</p>
    <p style="margin:0;"><a href="${opts.verifyUrl}" style="display:inline-block;padding:12px 20px;background:#222;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;border:1px solid #fff;">Verify email</a></p>
    <p style="margin:16px 0 0;font-size:12px;color:#666;">If you did not create an account, you can ignore this message.</p>
  </div></body></html>`;

  try {
    await client.send(
      new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: [opts.to] },
        Message: {
          Subject: { Charset: 'UTF-8', Data: subject },
          Body: {
            Text: { Charset: 'UTF-8', Data: text },
            Html: { Charset: 'UTF-8', Data: html },
          },
        },
      })
    );
    return { sent: true };
  } catch (e) {
    console.error('[auth] SES send failed:', e);
    return { sent: false, skippedReason: 'SES_ERROR' };
  }
}
