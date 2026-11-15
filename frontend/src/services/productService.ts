import { Product, FabricWidth } from '../types';
import { StorageService } from './storageService';
import { api } from './api';

export const productService = {
  getAllProducts(): Product[] {
    StorageService.initialize();
    return StorageService.getProducts();
  },

  async syncFromBackend(): Promise<Product[]> {
    StorageService.initialize();
    try {
      const res = await api.get('/products');
      const json = res.data;
      if (json?.success && Array.isArray(json.products)) {
        StorageService.setProducts(json.products);
        return json.products as Product[];
      }
    } catch {
      // Offline fallback
    }
    return StorageService.getProducts();
  },

  getActiveProducts(): Product[] {
    return this.getAllProducts().filter(p => p.isActive !== false);
  },

  getProductById(id: string): Product | undefined {
    return this.getAllProducts().find(p => p.id === id);
  },

  getProductsByWidth(width: FabricWidth): Product[] {
    return this.getActiveProducts().filter(p => p.fabricWidth === width);
  },

  getFeaturedProducts(): Product[] {
    return this.getActiveProducts().filter(p => p.isFeatured);
  },

  getBestSellerProducts(): Product[] {
    return this.getActiveProducts().filter(p => p.isBestSeller);
  },

  getNewArrivalProducts(): Product[] {
    return this.getActiveProducts().filter(p => p.isNewArrival);
  },

  saveProduct(product: Product): Product {
    const products = this.getAllProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.unshift(product);
    }
    StorageService.setProducts(products);

    api.post('/admin/products', { product }).catch(() => {});

    return product;
  },

  async saveProductAsync(product: Product): Promise<Product> {
    this.saveProduct(product);
    try {
      const res = await api.post<{ success: boolean; product?: Product }>('/admin/products', { product });
      if (res.data?.success && res.data.product) {
        return res.data.product;
      }
    } catch {
      // Handled locally
    }
    return product;
  },

  deleteProduct(id: string): boolean {
    const products = this.getAllProducts();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length !== products.length) {
      StorageService.setProducts(filtered);
      api.delete(`/admin/products/${encodeURIComponent(id)}`).catch(() => {});
      return true;
    }
    return false;
  },

  async deleteProductAsync(id: string): Promise<boolean> {
    const ok = this.deleteProduct(id);
    try {
      await api.delete(`/admin/products/${encodeURIComponent(id)}`);
    } catch {
      // Handled locally
    }
    return ok;
  }
};
