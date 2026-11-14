import type { Bindings } from '../types';

interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}

let cachedSendPulseToken: { token: string; expiresAt: number } | null = null;

async function getSendPulseToken(clientId: string, clientSecret: string): Promise<string | null> {
  if (cachedSendPulseToken && cachedSendPulseToken.expiresAt > Date.now() + 30_000) {
    return cachedSendPulseToken.token;
  }

  try {
    const resp = await fetch('https://api.sendpulse.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { access_token?: string; expires_in?: number };
    if (!data?.access_token) return null;
    cachedSendPulseToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    };
    return data.access_token;
  } catch {
    return null;
  }
}

function encodeBase64Utf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Transactional email pipeline:
 * 1. Primary: SendPulse OAuth2 + /smtp/emails REST API
 * 2. Fallback: Google Apps Script webhook
 * 3. Dev fallback: clean structured log
 */
export async function sendTransactionalEmail(
  env: Bindings,
  opts: SendEmailOptions
): Promise<{ delivered: boolean; provider: 'sendpulse' | 'google_script' | 'dev_log' }> {
  const spClientId = String(env?.SENDPULSE_CLIENT_ID || '').trim();
  const spClientSecret = String(env?.SENDPULSE_CLIENT_SECRET || '').trim();
  const fromEmail = String(env?.SENDPULSE_FROM_EMAIL || 'support@fashiondoniyabd.com').trim();
  const fromName = String(env?.SENDPULSE_FROM_NAME || 'Fashion Doniya BD').trim();

  if (spClientId && spClientSecret) {
    const token = await getSendPulseToken(spClientId, spClientSecret);
    if (token) {
      try {
        const resp = await fetch('https://api.sendpulse.com/smtp/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: {
              html: encodeBase64Utf8(opts.html),
              text: opts.text || opts.subject,
              subject: opts.subject,
              from: { name: fromName, email: fromEmail },
              to: [{ name: opts.toName || opts.to, email: opts.to }],
            },
          }),
        });
        if (resp.ok) {
          return { delivered: true, provider: 'sendpulse' };
        }
      } catch {
        // Fall through to Google Apps Script fallback
      }
    }
  }

  const scriptUrl = String(env?.GOOGLE_SCRIPT_URL || '').trim();
  if (scriptUrl) {
    try {
      const resp = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': String(env?.EMAIL_WEBHOOK_SECRET || ''),
        },
        body: JSON.stringify({
          secret: String(env?.EMAIL_WEBHOOK_SECRET || ''),
          to: opts.to,
          subject: opts.subject,
          html: opts.html,
          text: opts.text || '',
        }),
      });
      if (resp.ok) {
        return { delivered: true, provider: 'google_script' };
      }
    } catch {
      // Fall through to dev log
    }
  }

  if (env?.NODE_ENV !== 'production') {
    console.info(`[Email Dev Fallback] To: ${opts.to} | Subject: ${opts.subject}`);
  }
  return { delivered: false, provider: 'dev_log' };
}
