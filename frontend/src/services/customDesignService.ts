import { CustomDesignRequest } from '../types';
import { StorageService } from './storageService';
import { api } from './api';

export const customDesignService = {
  getAllRequests(): CustomDesignRequest[] {
    StorageService.initialize();
    return StorageService.getCustomRequests();
  },

  async syncFromBackend(): Promise<CustomDesignRequest[]> {
    StorageService.initialize();
    try {
      const res = await api.get('/admin/custom-requests');
      const data = res.data;
      if (data?.success && Array.isArray(data.requests)) {
        StorageService.setCustomRequests(data.requests);
        return data.requests as CustomDesignRequest[];
      }
    } catch {
      // Offline / unauthenticated fallback
    }
    return StorageService.getCustomRequests();
  },

  getRequestById(id: string): CustomDesignRequest | undefined {
    return this.getAllRequests().find((r) => r.id === id);
  },

  submitRequest(
    requestData: Omit<CustomDesignRequest, 'id' | 'createdAt' | 'status'>
  ): CustomDesignRequest {
    const list = this.getAllRequests();
    const newRequest: CustomDesignRequest = {
      ...requestData,
      id: `req-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'Pending',
    };
    list.unshift(newRequest);
    StorageService.setCustomRequests(list);

    api
      .post('/custom-requests', {
        ...newRequest,
        outfitCategory: newRequest.outfitType,
        referenceImages: newRequest.referenceImageBase64
          ? [newRequest.referenceImageBase64]
          : [],
      })
      .catch(() => {});

    return newRequest;
  },

  updateRequestStatus(
    id: string,
    status: CustomDesignRequest['status'],
    adminNotes?: string
  ): CustomDesignRequest | null {
    const list = this.getAllRequests();
    const item = list.find((r) => r.id === id);
    if (!item) return null;

    item.status = status;
    if (adminNotes !== undefined) {
      item.adminNotes = adminNotes;
    }
    StorageService.setCustomRequests(list);

    api
      .patch(`/admin/custom-requests/${encodeURIComponent(id)}`, {
        status,
        adminNotes,
      })
      .catch(() => {});

    return item;
  },

  deleteRequest(id: string): boolean {
    const list = this.getAllRequests();
    const filtered = list.filter((r) => r.id !== id);
    if (filtered.length !== list.length) {
      StorageService.setCustomRequests(filtered);
      api.delete(`/admin/custom-requests/${encodeURIComponent(id)}`).catch(() => {});
      return true;
    }
    api.delete(`/admin/custom-requests/${encodeURIComponent(id)}`).catch(() => {});
    return false;
  },
};
