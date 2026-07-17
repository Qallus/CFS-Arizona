/**
 * Minimal Resend client over the HTTP API (no extra dependency).
 *
 * Reads RESEND_API_KEY. `from` defaults to RESEND_FROM_EMAIL or a
 * sig360.com sender. Never throws on send failure by default — returns
 * a result object so callers can decide whether a failed send is fatal.
 *
 * server-only: uses the secret API key.
 */
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function apiKey(): string {
  return (process.env.RESEND_API_KEY || '').trim();
}

export function isEmailConfigured(): boolean {
  return Boolean(apiKey());
}

export function defaultFrom(): string {
  return (process.env.RESEND_FROM_EMAIL || 'SIG360 <no-reply@sig360.com>').trim();
}

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  sent: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    return { sent: false, skipped: true, error: 'RESEND_API_KEY not configured' };
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: input.from || defaultFrom(),
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.text ? { text: input.text } : {}),
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      return { sent: false, error: data.message || `Resend error ${res.status}` };
    }
    return { sent: true, id: data.id };
  } catch (err) {
    return { sent: false, error: (err as Error).message };
  }
}

// ─── Templates ──────────────────────────────────────────────
/** Branded, theme-neutral invite email. Keep inline styles (email clients). */
export function inviteEmailHtml(opts: {
  inviteeName?: string;
  roleLabel: string;
  actionUrl: string;
  inviterName?: string;
}): string {
  const greeting = opts.inviteeName ? `Hi ${escapeHtml(opts.inviteeName)},` : 'Hello,';
  const inviter = opts.inviterName ? escapeHtml(opts.inviterName) : 'The SIG360 team';
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6e8eb;">
          <tr><td style="background:#0E2971;padding:24px 32px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">SIG360</span>
          </td></tr>
          <tr><td style="padding:32px;">
            <p style="margin:0 0 16px;color:#111827;font-size:16px;">${greeting}</p>
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.5;">
              You've been invited to SIG360 as <strong>${escapeHtml(opts.roleLabel)}</strong>.
              Set your password to activate your account and get started.
            </p>
            <p style="margin:24px 0;text-align:center;">
              <a href="${opts.actionUrl}" style="display:inline-block;background:#0E2971;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">Accept Invitation</a>
            </p>
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.5;">
              If the button doesn't work, copy and paste this link:<br/>
              <a href="${opts.actionUrl}" style="color:#0E2971;word-break:break-all;">${opts.actionUrl}</a>
            </p>
            <p style="margin:24px 0 0;color:#6b7280;font-size:13px;">— ${inviter}</p>
          </td></tr>
        </table>
        <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">Strategic Income Group · SIG360</p>
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
    .replace(/"/g, '&quot;');
}
