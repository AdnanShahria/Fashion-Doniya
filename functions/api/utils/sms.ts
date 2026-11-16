import type { Bindings } from '../types';
import { normalizePhone } from './helpers';

/**
 * Secondary Transactional SMS Dispatcher for Fashion Doniya BD.
 *
 * NOTIFICATION POLICY HIERARCHY:
 * - Primary Channel: Email (sendTransactionalEmail) is ALWAYS primary.
 *   Free, rich HTML invoices, OTP security codes, and tracking links.
 * - Secondary Channel: SMS (sendTransactionalSms) is STRICTLY secondary.
 *   Dispatched only when:
 *     1) Customer has NO email address on file (phone-only order / registration)
 *     2) Primary email delivery failed (automatic failover)
 *     3) Merchant explicitly enabled dual dispatch via SMS_ALWAYS_SEND=true
 */

export interface SendSmsOptions {
  to: string;
  message: string;
  isSecondaryFallback?: boolean;
}

export interface SendSmsResult {
  delivered: boolean;
  provider: 'greenweb' | 'bulksmsbd' | 'dev_log' | 'disabled';
  channel: 'secondary';
  error?: string;
}

export function isSmsConfigured(env: Bindings): boolean {
  return Boolean(
    String(env?.GREENWEB_API_TOKEN || '').trim() ||
      String(env?.BULKSMSBD_API_KEY || '').trim()
  );
}

export function isSmsGloballyEnabled(env: Bindings): boolean {
  // Disconnected by default to prevent expensive third-party carrier bills.
  // Kept intact; reconnect anytime by setting SMS_ENABLED='true' in environment variables.
  return String(env?.SMS_ENABLED || '').toLowerCase() === 'true';
}

export async function sendTransactionalSms(
  env: Bindings,
  opts: SendSmsOptions
): Promise<SendSmsResult> {
  if (!isSmsGloballyEnabled(env)) {
    return {
      delivered: false,
      provider: 'disabled',
      channel: 'secondary',
      error: 'SMS gateway explicitly disabled by SMS_ENABLED=false',
    };
  }

  const rawPhone = opts.to || '';
  const cleanPhone = normalizePhone(rawPhone);
  if (!cleanPhone || cleanPhone.length !== 11) {
    return {
      delivered: false,
      provider: 'dev_log',
      channel: 'secondary',
      error: 'Invalid Bangladeshi phone number (must be 11 digits)',
    };
  }

  // 1. GreenWeb BD (Secondary Gateway Tier 1)
  const greenwebToken = String(env?.GREENWEB_API_TOKEN || '').trim();
  if (greenwebToken) {
    try {
      const url = `https://api.greenweb.com.bd/api.php?token=${encodeURIComponent(greenwebToken)}&to=${encodeURIComponent(cleanPhone)}&message=${encodeURIComponent(opts.message)}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const text = await resp.text();
      if (resp.ok && !text.toLowerCase().includes('error')) {
        return { delivered: true, provider: 'greenweb', channel: 'secondary' };
      }
    } catch (e) {
      console.warn('[Secondary SMS] Greenweb dispatch failed:', e);
    }
  }

  // 2. BulkSMSBD (Secondary Gateway Tier 2)
  const bulkKey = String(env?.BULKSMSBD_API_KEY || '').trim();
  if (bulkKey) {
    try {
      const senderId = String(env?.BULKSMSBD_SENDER_ID || env?.SMS_SENDER_ID || '8809612...').trim();
      const url = `https://bulksmsbd.net/api/smsapi?api_key=${encodeURIComponent(bulkKey)}&type=text&number=${encodeURIComponent(cleanPhone)}&senderid=${encodeURIComponent(senderId)}&message=${encodeURIComponent(opts.message)}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (resp.ok) {
        return { delivered: true, provider: 'bulksmsbd', channel: 'secondary' };
      }
    } catch (e) {
      console.warn('[Secondary SMS] BulkSMSBD dispatch failed:', e);
    }
  }

  // Fallback Dev Log (Prevents exceptions during local/preview tests)
  if (env?.NODE_ENV !== 'production') {
    console.info(`[Secondary SMS Dev Fallback] To: ${cleanPhone} | Message: ${opts.message}`);
  }
  return { delivered: false, provider: 'dev_log', channel: 'secondary' };
}
