import type { Bindings } from '../types';

export type EmailProviderName = 'sendpulse' | 'resend' | 'ses' | 'google_script';

export interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailAttemptResult {
  provider: EmailProviderName;
  ok: boolean;
  status?: number;
  error?: string;
  messageId?: string;
}

export interface SendEmailResult {
  delivered: boolean;
  provider: EmailProviderName | 'dev_log';
  messageId?: string;
  attempts: EmailAttemptResult[];
}

const DEFAULT_PROVIDER_ORDER: EmailProviderName[] = [
  'sendpulse',
  'resend',
  'ses',
  'google_script',
];

const encoder = new TextEncoder();

let cachedSendPulseToken: { token: string; expiresAt: number } | null = null;

function encodeBase64Utf8(input: string): string {
  const bytes = encoder.encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let out = '';
  for (let i = 0; i < arr.length; i++) {
    out += arr[i].toString(16).padStart(2, '0');
  }
  return out;
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  return toHex(digest);
}

async function hmacSha256Raw(
  keyData: string | Uint8Array,
  message: string
): Promise<Uint8Array> {
  const rawKey = typeof keyData === 'string' ? encoder.encode(keyData) : keyData;
  const key = await crypto.subtle.importKey(
    'raw',
    rawKey as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message) as BufferSource);
  return new Uint8Array(sig);
}

function sanitizeHeaderName(name: string): string {
  return name.replace(/["\r\n]/g, '').trim();
}

function formatFromAddress(email: string, name?: string): string {
  const cleanName = name ? sanitizeHeaderName(name) : '';
  return cleanName ? `"${cleanName}" <${email}>` : email;
}

function resolveSender(
  env: Bindings,
  providerEmail?: string,
  providerName?: string
): { fromEmail: string; fromName: string } {
  const fromEmail = String(
    providerEmail ||
      env?.EMAIL_FROM ||
      env?.SENDPULSE_FROM_EMAIL ||
      env?.RESEND_FROM_EMAIL ||
      env?.SES_FROM_EMAIL ||
      env?.SMTP_USER ||
      'support@fashiondoniyabd.com'
  ).trim();
  const fromName = String(
    providerName ||
      env?.EMAIL_FROM_NAME ||
      env?.SENDPULSE_FROM_NAME ||
      env?.RESEND_FROM_NAME ||
      env?.SES_FROM_NAME ||
      'Fashion Doniya BD'
  ).trim();
  return { fromEmail, fromName };
}

export function resolveProviderOrder(env: Bindings): EmailProviderName[] {
  const configured = String(env?.EMAIL_PROVIDER_ORDER || '').trim();
  if (!configured) return DEFAULT_PROVIDER_ORDER;

  const validSet = new Set<EmailProviderName>(DEFAULT_PROVIDER_ORDER);
  const parsed = configured
    .split(',')
    .map((p) => p.trim().toLowerCase() as EmailProviderName)
    .filter((p) => validSet.has(p));

  if (parsed.length === 0) return DEFAULT_PROVIDER_ORDER;
  for (const fallback of DEFAULT_PROVIDER_ORDER) {
    if (!parsed.includes(fallback)) parsed.push(fallback);
  }
  return parsed;
}

function resolveSendPulseCredentials(env: Bindings) {
  const clientId = String(env?.SENDPULSE_CLIENT_ID || env?.SENDPULSE_API_USER_ID || '').trim();
  const clientSecret = String(
    env?.SENDPULSE_CLIENT_SECRET || env?.SENDPULSE_API_SECRET || ''
  ).trim();
  const apiUrl = String(env?.SENDPULSE_API_URL || 'https://api.sendpulse.com')
    .trim()
    .replace(/\/$/, '');
  return { clientId, clientSecret, apiUrl };
}

export function getEmailProvidersStatus(env: Bindings) {
  const sp = resolveSendPulseCredentials(env);
  const hasSendPulse = Boolean(sp.clientId && sp.clientSecret);
  const hasResend = Boolean(String(env?.RESEND_API_KEY || '').trim());
  const hasSes = Boolean(
    String(env?.AWS_ACCESS_KEY_ID || env?.SES_ACCESS_KEY_ID || '').trim() &&
      String(env?.AWS_SECRET_ACCESS_KEY || env?.SES_SECRET_ACCESS_KEY || '').trim()
  );
  const hasGoogleScript = Boolean(String(env?.GOOGLE_SCRIPT_URL || '').trim());

  return {
    sendpulse: hasSendPulse,
    resend: hasResend,
    ses: hasSes,
    google_script: hasGoogleScript,
    order: resolveProviderOrder(env),
  };
}

async function getSendPulseToken(
  apiUrl: string,
  clientId: string,
  clientSecret: string,
  forceRefresh = false
): Promise<string | null> {
  if (
    !forceRefresh &&
    cachedSendPulseToken &&
    cachedSendPulseToken.expiresAt > Date.now() + 30_000
  ) {
    return cachedSendPulseToken.token;
  }

  try {
    const resp = await fetch(`${apiUrl}/oauth/access_token`, {
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

async function sendViaSendPulse(
  env: Bindings,
  opts: SendEmailOptions
): Promise<EmailAttemptResult | null> {
  const { clientId, clientSecret, apiUrl } = resolveSendPulseCredentials(env);
  if (!clientId || !clientSecret) return null;

  const { fromEmail, fromName } = resolveSender(
    env,
    env?.SENDPULSE_FROM_EMAIL || env?.SMTP_USER,
    env?.SENDPULSE_FROM_NAME
  );

  const sendRequest = async (token: string) =>
    fetch(`${apiUrl}/smtp/emails`, {
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
          ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
        },
      }),
    });

  try {
    let token = await getSendPulseToken(apiUrl, clientId, clientSecret);
    if (!token) {
      return { provider: 'sendpulse', ok: false, error: 'OAuth token acquisition failed' };
    }

    let resp = await sendRequest(token);
    if (resp.status === 401) {
      cachedSendPulseToken = null;
      token = await getSendPulseToken(apiUrl, clientId, clientSecret, true);
      if (token) {
        resp = await sendRequest(token);
      }
    }

    if (resp.ok) {
      const json = (await resp.json().catch(() => ({}))) as { id?: string; result?: boolean };
      return {
        provider: 'sendpulse',
        ok: true,
        status: resp.status,
        messageId: json?.id ? String(json.id) : undefined,
      };
    }

    const errText = await resp.text().catch(() => '');
    return {
      provider: 'sendpulse',
      ok: false,
      status: resp.status,
      error: errText.slice(0, 200) || `HTTP ${resp.status}`,
    };
  } catch (err) {
    return {
      provider: 'sendpulse',
      ok: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

async function sendViaResend(
  env: Bindings,
  opts: SendEmailOptions
): Promise<EmailAttemptResult | null> {
  const apiKey = String(env?.RESEND_API_KEY || '').trim();
  if (!apiKey) return null;

  const { fromEmail, fromName } = resolveSender(
    env,
    env?.RESEND_FROM_EMAIL,
    env?.RESEND_FROM_NAME
  );

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: formatFromAddress(fromEmail, fromName),
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text || opts.subject,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });

    if (resp.ok) {
      const json = (await resp.json().catch(() => ({}))) as { id?: string };
      return {
        provider: 'resend',
        ok: true,
        status: resp.status,
        messageId: json?.id ? String(json.id) : undefined,
      };
    }

    const errText = await resp.text().catch(() => '');
    return {
      provider: 'resend',
      ok: false,
      status: resp.status,
      error: errText.slice(0, 200) || `HTTP ${resp.status}`,
    };
  } catch (err) {
    return {
      provider: 'resend',
      ok: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

/**
 * Pure Web Crypto AWS SigV4 signer + Amazon SES v2 REST client.
 * Compatible with Cloudflare Workers and Bun with zero AWS SDK dependencies.
 */
async function sendViaAmazonSes(
  env: Bindings,
  opts: SendEmailOptions
): Promise<EmailAttemptResult | null> {
  const accessKeyId = String(env?.AWS_ACCESS_KEY_ID || env?.SES_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = String(
    env?.AWS_SECRET_ACCESS_KEY || env?.SES_SECRET_ACCESS_KEY || ''
  ).trim();
  if (!accessKeyId || !secretAccessKey) return null;

  const region = String(env?.AWS_REGION || env?.SES_REGION || 'us-east-1').trim();
  const sessionToken = String(env?.AWS_SESSION_TOKEN || '').trim();
  const configSet = String(env?.SES_CONFIGURATION_SET || '').trim();
  const { fromEmail, fromName } = resolveSender(
    env,
    env?.SES_FROM_EMAIL,
    env?.SES_FROM_NAME
  );

  const host = `email.${region}.amazonaws.com`;
  const canonicalUri = '/v2/email/outbound-emails';
  const endpoint = `https://${host}${canonicalUri}`;

  const payloadObj: Record<string, unknown> = {
    FromEmailAddress: formatFromAddress(fromEmail, fromName),
    Destination: {
      ToAddresses: [opts.to],
    },
    ...(opts.replyTo ? { ReplyToAddresses: [opts.replyTo] } : {}),
    ...(configSet ? { ConfigurationSetName: configSet } : {}),
    Content: {
      Simple: {
        Subject: { Data: opts.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: opts.html, Charset: 'UTF-8' },
          Text: { Data: opts.text || opts.subject, Charset: 'UTF-8' },
        },
      },
    },
  };
  const bodyStr = JSON.stringify(payloadObj);

  try {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = await sha256Hex(bodyStr);

    const headerMap: Record<string, string> = {
      'content-type': 'application/json',
      host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    };
    if (sessionToken) {
      headerMap['x-amz-security-token'] = sessionToken;
    }

    const sortedKeys = Object.keys(headerMap).sort();
    const canonicalHeaders = sortedKeys.map((k) => `${k}:${headerMap[k]}\n`).join('');
    const signedHeaders = sortedKeys.join(';');

    const canonicalRequest = [
      'POST',
      canonicalUri,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/${region}/ses/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      await sha256Hex(canonicalRequest),
    ].join('\n');

    const kDate = await hmacSha256Raw(`AWS4${secretAccessKey}`, dateStamp);
    const kRegion = await hmacSha256Raw(kDate, region);
    const kService = await hmacSha256Raw(kRegion, 'ses');
    const kSigning = await hmacSha256Raw(kService, 'aws4_request');
    const signature = toHex(await hmacSha256Raw(kSigning, stringToSign));

    const authorization =
      `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Date': amzDate,
        'X-Amz-Content-Sha256': payloadHash,
        ...(sessionToken ? { 'X-Amz-Security-Token': sessionToken } : {}),
        Authorization: authorization,
      },
      body: bodyStr,
    });

    if (resp.ok) {
      const json = (await resp.json().catch(() => ({}))) as { MessageId?: string };
      return {
        provider: 'ses',
        ok: true,
        status: resp.status,
        messageId: json?.MessageId ? String(json.MessageId) : undefined,
      };
    }

    const errText = await resp.text().catch(() => '');
    return {
      provider: 'ses',
      ok: false,
      status: resp.status,
      error: errText.slice(0, 200) || `HTTP ${resp.status}`,
    };
  } catch (err) {
    return {
      provider: 'ses',
      ok: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

async function sendViaGoogleScript(
  env: Bindings,
  opts: SendEmailOptions
): Promise<EmailAttemptResult | null> {
  const scriptUrl = String(env?.GOOGLE_SCRIPT_URL || '').trim();
  if (!scriptUrl) return null;

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
      return { provider: 'google_script', ok: true, status: resp.status };
    }
    return {
      provider: 'google_script',
      ok: false,
      status: resp.status,
      error: `HTTP ${resp.status}`,
    };
  } catch (err) {
    return {
      provider: 'google_script',
      ok: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

const PROVIDER_HANDLERS: Record<
  EmailProviderName,
  (env: Bindings, opts: SendEmailOptions) => Promise<EmailAttemptResult | null>
> = {
  sendpulse: sendViaSendPulse,
  resend: sendViaResend,
  ses: sendViaAmazonSes,
  google_script: sendViaGoogleScript,
};

/**
 * Multi-provider transactional email pipeline with automatic failover:
 * Default order: SendPulse -> Resend -> Amazon SES (v2 SigV4) -> Google Apps Script -> dev_log.
 * Override order anytime via `EMAIL_PROVIDER_ORDER` (e.g. "resend,ses,sendpulse").
 */
export async function sendTransactionalEmail(
  env: Bindings,
  opts: SendEmailOptions
): Promise<SendEmailResult> {
  const order = resolveProviderOrder(env);
  const attempts: EmailAttemptResult[] = [];

  for (const provider of order) {
    const handler = PROVIDER_HANDLERS[provider];
    const result = await handler(env, opts);
    if (!result) continue; // Provider credentials not configured; skip cleanly

    attempts.push(result);
    if (result.ok) {
      return {
        delivered: true,
        provider,
        messageId: result.messageId,
        attempts,
      };
    }

    console.warn(
      `[Email] Provider "${provider}" failed (${result.status ?? 'error'}: ${result.error || 'unknown'}), trying next fallback.`
    );
  }

  if (env?.NODE_ENV !== 'production') {
    console.info(`[Email Dev Fallback] To: ${opts.to} | Subject: ${opts.subject}`);
  }
  return {
    delivered: false,
    provider: 'dev_log',
    attempts,
  };
}
