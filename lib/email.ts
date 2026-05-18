/**
 * Sends the magic-link email via Resend.
 * Inline HTML rather than React Email - one template, no need for the toolchain.
 */

import { Resend } from 'resend';

export async function sendMagicLink(args: {
  to: string;
  url: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? 'hello@subjecttocontract.com';
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: `Subject To Contract <${from}>`,
    to: args.to,
    subject: 'Your access link for the UK Estate Agent Index',
    text: textBody(args.url),
    html: htmlBody(args.url),
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`);
  }
}

function textBody(url: string): string {
  return [
    'Hi,',
    '',
    "Here's your access link for the UK Estate Agent Index:",
    '',
    url,
    '',
    'This link expires in 15 minutes and can only be used once.',
    '',
    "If you didn't request this, you can safely ignore this email.",
    '',
    'Cheers,',
    'Subject To Contract',
  ].join('\n');
}

function htmlBody(url: string): string {
  return `<!doctype html>
<html lang="en-GB">
  <body style="margin:0;padding:0;background:#FAF7F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1A1A1A;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#FAF7F2;">
      <tr><td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;background:#FFFFFF;border:1px solid #E5DFD3;border-radius:8px;">
          <tr><td style="padding:32px 32px 24px;">
            <p style="margin:0;font-size:14px;color:#6B6B6B;letter-spacing:0.06em;text-transform:uppercase;">Subject To Contract</p>
            <h1 style="margin:6px 0 0;font-family:Georgia,serif;color:#1B4332;font-size:22px;font-weight:500;">UK Estate Agent Index</h1>
          </td></tr>
          <tr><td style="padding:0 32px 8px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi,</p>
            <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">Here&rsquo;s your access link for the UK Estate Agent Index.</p>
            <p style="margin:0 0 24px;">
              <a href="${escapeHtml(url)}" style="display:inline-block;background:#1B4332;color:#FAF7F2;text-decoration:none;padding:14px 24px;border-radius:6px;font-size:16px;font-weight:500;">Access the Index</a>
            </p>
            <p style="margin:0 0 8px;font-size:14px;color:#6B6B6B;">This link expires in 15 minutes and can only be used once.</p>
            <p style="margin:0;font-size:14px;color:#6B6B6B;">If you didn&rsquo;t request this, you can safely ignore this email.</p>
          </td></tr>
          <tr><td style="padding:24px 32px 32px;">
            <p style="margin:0;font-size:16px;line-height:1.6;">Cheers,<br/>Subject To Contract</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
