import { eq } from 'drizzle-orm';
import type { Bindings } from '../types';
import type { AppDatabase } from './db-factory';
import { systemSettings, adminLogs } from '../../../backend/server/db/schemas/index';
import type { OrderStatus } from '../../../frontend/src/types/index';

export function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const bengaliToEnglish = String(rawPhone).replace(/[০-৯]/g, (d) =>
    String('০১২৩৪৫৬৭৮৯'.indexOf(d))
  );
  const digits = bengaliToEnglish.replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length >= 13) {
    return '0' + digits.slice(3, 13);
  }
  if (digits.startsWith('1') && digits.length === 10) {
    return '0' + digits;
  }
  return digits;
}

export function slugify(input: string): string {
  return (
    String(input || '')
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'item'
  );
}

export function escapeHtml(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function formatSanitizedError(err: unknown, isDev: boolean) {
  if (isDev && err instanceof Error) {
    return {
      success: false,
      code: 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
    };
  }
  return {
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'সার্ভারে সাময়িক ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
  };
}

export function buildCourierTrackingUrl(courierName: string, trackingNumber: string): string | undefined {
  const cleanName = courierName.toLowerCase();
  const code = encodeURIComponent(trackingNumber.trim());
  if (!code) return undefined;
  if (cleanName.includes('steadfast')) return `https://steadfast.com.bd/t/${code}`;
  if (cleanName.includes('pathao')) return `https://merchant.pathao.com/tracking?consignment_id=${code}`;
  if (cleanName.includes('redx')) return `https://redx.com.bd/track-global-parcel/?trackingId=${code}`;
  if (cleanName.includes('paperfly')) return `https://go.paperfly.com.bd/track/order/${code}`;
  if (cleanName.includes('sundarban')) return `https://tracking.sundarbancourierltd.com/?cn=${code}`;
  return undefined;
}

export function mapCourierStatusToOrderStatus(
  rawCourierStatus: string,
  currentStatus: OrderStatus
): OrderStatus {
  const s = rawCourierStatus.toLowerCase();
  if (s.includes('deliver') && !s.includes('out')) return 'Delivered';
  if (s.includes('out_for_delivery') || s.includes('out for delivery') || s.includes('assigned_for_delivery')) {
    return 'Out for Delivery';
  }
  if (s.includes('return')) return 'Returned';
  if (s.includes('cancel')) return 'Cancelled';
  if (s.includes('transit') || s.includes('shipped') || s.includes('picked') || s.includes('hub')) {
    return 'Shipped';
  }
  return currentStatus;
}

export async function isDemoModeActive(db: AppDatabase, env: Bindings): Promise<boolean> {
  if (String(env?.DEMO_MODE || '').toLowerCase() === 'true') {
    return true;
  }
  try {
    const row = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'demo.mode'))
      .get();
    if (row && (row.value === 'true' || row.value === '"true"')) {
      return true;
    }
  } catch {
    // ignore if table not initialized yet
  }
  return false;
}

export async function appendAdminLog(
  db: AppDatabase,
  action: string,
  category: string,
  details: string,
  actor = 'Admin'
): Promise<void> {
  try {
    await db.insert(adminLogs).values({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      category,
      details,
      actor,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // non-fatal log error
  }
}

export function safeWaitUntil(
  c: { executionCtx?: { waitUntil?: (p: Promise<unknown>) => void } },
  promise: Promise<unknown>
): void {
  try {
    c.executionCtx?.waitUntil?.(promise);
  } catch {
    // Local Bun/Node server runs without a Cloudflare ExecutionContext
  }
}
