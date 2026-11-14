import { CustomDesignRequest } from '../types';
import { StorageService } from './storageService';

export const customDesignService = {
  getAllRequests(): CustomDesignRequest[] {
    StorageService.initialize();
    return StorageService.getCustomRequests();
  },

  getRequestById(id: string): CustomDesignRequest | undefined {
    return this.getAllRequests().find(r => r.id === id);
  },

  submitRequest(requestData: Omit<CustomDesignRequest, 'id' | 'createdAt' | 'status'>): CustomDesignRequest {
    const list = this.getAllRequests();
    const newRequest: CustomDesignRequest = {
      ...requestData,
      id: `req-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'Pending'
    };
    list.unshift(newRequest);
    StorageService.setCustomRequests(list);
    return newRequest;
  },

  updateRequestStatus(id: string, status: CustomDesignRequest['status'], adminNotes?: string): CustomDesignRequest | null {
    const list = this.getAllRequests();
    const item = list.find(r => r.id === id);
    if (!item) return null;

    item.status = status;
    if (adminNotes !== undefined) {
      item.adminNotes = adminNotes;
    }
    StorageService.setCustomRequests(list);
    return item;
  },

  deleteRequest(id: string): boolean {
    const list = this.getAllRequests();
    const filtered = list.filter(r => r.id !== id);
    if (filtered.length !== list.length) {
      StorageService.setCustomRequests(filtered);
      return true;
    }
    return false;
  }
};
