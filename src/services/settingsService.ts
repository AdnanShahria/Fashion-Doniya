import { StoreSettings, Coupon, PaymentSettings, PaymentMethod, PaymentStatus, MfsAccountType } from '../types';
import { StorageService } from './storageService';
import { ADMIN_API_TOKEN } from './orderService';

export function formatPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'bkash':
    case 'bKash':
      return 'বিকাশ (bKash)';
    case 'nagad':
    case 'Nagad':
      return 'নগদ (Nagad)';
    case 'cod':
    case 'Cash on Delivery':
    default:
      return 'ক্যাশ অন ডেলিভারি (Cash on Delivery)';
  }
}

export function formatPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'Paid':
      return 'পরিশোধিত (Paid)';
    case 'pending_verification':
      return 'যাচাইয়ের অপেক্ষায় (Pending Verification)';
    case 'unpaid':
      return 'অপরিশোধিত / ক্যাশ অন ডেলিভারি (Unpaid)';
    case 'Failed':
      return 'ব্যর্থ (Failed)';
    case 'Pending':
    default:
      return 'বকেয়া (Pending)';
  }
}

export function formatAccountTypeBadge(type: MfsAccountType): string {
  switch (type) {
    case 'Merchant':
      return 'Merchant - Payment';
    case 'Agent':
      return 'Agent - Cash Out';
    case 'Personal':
    default:
      return 'Personal - Send Money';
  }
}

export function formatAccountActionLabelBn(type: MfsAccountType): string {
  switch (type) {
    case 'Merchant':
      return 'Payment (পেমেন্ট)';
    case 'Agent':
      return 'Cash Out (ক্যাশ আউট)';
    case 'Personal':
    default:
      return 'Send Money (সেন্ড মানি)';
  }
}

export const settingsService = {
  getSettings(): StoreSettings {
    StorageService.initialize();
    return StorageService.getSettings();
  },

  getPaymentSettings(): PaymentSettings {
    return this.getSettings().paymentSettings;
  },

  async syncSettingsFromBackend(): Promise<StoreSettings> {
    try {
      const resp = await fetch('/api/settings');
      if (resp.ok) {
        const data = await resp.json();
        if (data?.success && data.settings) {
          StorageService.setSettings(data.settings);
          return StorageService.getSettings();
        }
      }
    } catch {
      // Offline fallback
    }
    return this.getSettings();
  },

  async syncPaymentSettingsFromBackend(): Promise<PaymentSettings> {
    try {
      const resp = await fetch('/api/payment-settings');
      if (resp.ok) {
        const data = await resp.json();
        if (data?.success && data.paymentSettings) {
          const current = this.getSettings();
          const updated: StoreSettings = {
            ...current,
            paymentSettings: data.paymentSettings
          };
          StorageService.setSettings(updated);
          return data.paymentSettings;
        }
      }
    } catch {
      // Offline fallback to local storage
    }
    return this.getPaymentSettings();
  },

  updateSettings(newSettings: Partial<StoreSettings>): StoreSettings {
    const current = this.getSettings();
    const updated: StoreSettings = {
      ...current,
      ...newSettings,
      paymentSettings: newSettings.paymentSettings
        ? {
            bkash: { ...current.paymentSettings.bkash, ...newSettings.paymentSettings.bkash },
            nagad: { ...current.paymentSettings.nagad, ...newSettings.paymentSettings.nagad },
            cod: { ...current.paymentSettings.cod, ...newSettings.paymentSettings.cod }
          }
        : current.paymentSettings
    };
    StorageService.setSettings(updated);

    fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': ADMIN_API_TOKEN
      },
      body: JSON.stringify({ settings: updated })
    }).catch(() => {});

    if (newSettings.paymentSettings) {
      fetch('/api/admin/payment-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': ADMIN_API_TOKEN
        },
        body: JSON.stringify({ paymentSettings: updated.paymentSettings })
      }).catch(() => {});
    }

    return updated;
  },

  updatePaymentSettings(paymentSettings: PaymentSettings): StoreSettings {
    return this.updateSettings({ paymentSettings });
  },

  validateCoupon(code: string, currentSubtotal: number): { isValid: boolean; discountAmount: number; message: string; coupon?: Coupon } {
    const settings = this.getSettings();
    const cleanCode = code.trim().toUpperCase();
    const found = settings.coupons?.find(c => c.code.toUpperCase() === cleanCode && c.isActive);

    if (!found) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'কুপন কোডটি সঠিক নয় বা মেয়াদ শেষ হয়েছে।'
      };
    }

    if (found.minOrderAmount && currentSubtotal < found.minOrderAmount) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `এই কুপনটির জন্য সর্বনিম্ন ৳${found.minOrderAmount} টাকার অর্ডার প্রয়োজন।`
      };
    }

    let discount = 0;
    if (found.discountType === 'percentage') {
      discount = Math.round((currentSubtotal * found.discountValue) / 100);
    } else {
      discount = found.discountValue;
    }

    // Discount cannot exceed subtotal
    discount = Math.min(discount, currentSubtotal);

    return {
      isValid: true,
      discountAmount: discount,
      message: `অভিনন্দন! ৳${discount} ছাড় প্রয়োগ হয়েছে (${found.code})।`,
      coupon: found
    };
  }
};
