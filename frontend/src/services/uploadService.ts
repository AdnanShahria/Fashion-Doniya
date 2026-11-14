import { api } from './api';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image file via the Admin R2 / ImgBB / Inline-Dev backend endpoint.
 * Falls back gracefully to a base64 DataURL if offline or backend upload fails.
 */
export async function uploadAdminImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('শুধুমাত্র বৈধ ছবির ফাইল (PNG, JPG, WEBP, GIF) আপলোড করা যাবে।');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('ছবির সাইজ সর্বোচ্চ ১০ মেগাবাইটের মধ্যে হতে হবে।');
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<{ success?: boolean; url?: string; dataUrl?: string }>(
      '/admin/upload',
      formData
    );
    const url = res.data?.url || res.data?.dataUrl;
    if (res.data?.success && url) {
      return url;
    }
  } catch {
    // Graceful local DataURL fallback
  }

  return readFileAsDataUrl(file);
}
