import type { Bindings } from '../types';
import { normalizePhone } from './helpers';

export interface SendSmsOptions {
  to: string;
  message: string;
}

export interface SendSmsResult {
  delivered: boolean;
  provider: 'greenweb' | 'bulksmsbd' | 'dev_log';
  error?: string;
}

export async function sendTransactionalSms(
  env: Bindings,
  opts: SendSmsOptions
): Promise<SendSmsResult> {
  const rawPhone = opts.to || '';
  const cleanPhone = normalizePhone(rawPhone);
  if (!cleanPhone || cleanPhone.length !== 11) {
    return { delivered: false, provider: 'dev_log', error: 'Invalid Bangladeshi phone number' };
  }

  // 1. GreenWeb BD
  const greenwebToken = String(env?.GREENWEB_API_TOKEN || '').trim();
  if (greenwebToken) {
    try {
      const url = `http://api.greenweb.com.bd/api.php?token=${encodeURIComponent(greenwebToken)}&to=${encodeURIComponent(cleanPhone)}&message=${encodeURIComponent(opts.message)}`;
      const resp = await fetch(url);
      const text = await resp.text();
      if (resp.ok && !text.toLowerCase().includes('error')) {
        return { delivered: true, provider: 'greenweb' };
      }
    } catch (e) {
      console.warn('[SMS] Greenweb dispatch failed:', e);
    }
  }

  // 2. BulkSMSBD
  const bulkKey = String(env?.BULKSMSBD_API_KEY || '').trim();
  if (bulkKey) {
    try {
      const senderId = String(env?.BULKSMSBD_SENDER_ID || env?.SMS_SENDER_ID || '8809612...').trim();
      const url = `http://bulksmsbd.net/api/smsapi?api_key=${encodeURIComponent(bulkKey)}&type=text&number=${encodeURIComponent(cleanPhone)}&senderid=${encodeURIComponent(senderId)}&message=${encodeURIComponent(opts.message)}`;
      const resp = await fetch(url);
      if (resp.ok) {
        return { delivered: true, provider: 'bulksmsbd' };
      }
    } catch (e) {
      console.warn('[SMS] BulkSMSBD dispatch failed:', e);
    }
  }

  // Fallback Dev Log
  if (env?.NODE_ENV !== 'production') {
    console.info(`[SMS Dev Fallback] To: ${cleanPhone} | Message: ${opts.message}`);
  }
  return { delivered: false, provider: 'dev_log' };
}
