import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { sesFormattedFrom } from './sesFormattedFrom';

export async function sendPasswordResetEmail(opts: {
  to: string;
  code: string;
}): Promise<{ sent: boolean; skippedReason?: string }> {
  if (process.env.AUTH_EMAIL_DISABLED === '1') {
    console.info('[auth] AUTH_EMAIL_DISABLED: reset code for', opts.to, opts.code);
    return { sent: false, skippedReason: 'AUTH_EMAIL_DISABLED' };
  }

  const fromAddr = process.env.PASSWORD_RESET_FROM?.trim();
  if (!fromAddr) {
    console.warn('[auth] PASSWORD_RESET_FROM not set; cannot send reset email. Code:', opts.code);
    return { sent: false, skippedReason: 'PASSWORD_RESET_FROM' };
  }
  const from = sesFormattedFrom('Arells Password Reset', fromAddr);

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

  const subject = 'Your Arells verification code';
  const text = `Enter this code to reset your password:\n\n${opts.code}\n\nThis code expires in 5 minutes. Never share it with anyone. If you weren't expecting this, you can ignore this email.\n\nOn a mission to ensure your investments never lose value.\nhttps://arells.com\n`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${subject}</title></head><body style="font-family:Arial,sans-serif;background:#f6f6f6;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #e0e0e0;">
    <p style="margin:0;color:#333;font-size:11px;line-height:1.5;">Enter this code to reset your password:</p>
    <p style="margin:12px 0 0;color:#333;font-size:22px;line-height:1.3;"><strong style="font-weight:700;letter-spacing:0.12em;">${opts.code}</strong></p>
    <p style="margin:16px 0 0;font-size:12px;color:#666;">This code expires in 5 minutes. Never share it with anyone. If you weren't expecting this, you can ignore this email.</p>
    <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0;" />
    <p style="margin:0;font-size:12px;color:#666;line-height:1.5;">On a mission to ensure your investments never lose value.</p>
    <p style="margin:8px 0 0;font-size:12px;"><a href="https://arells.com" style="color:#666;">https://arells.com</a></p>
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
    console.error('[auth] SES reset send failed:', e);
    return { sent: false, skippedReason: 'SES_ERROR' };
  }
}
