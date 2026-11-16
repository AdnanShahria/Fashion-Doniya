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

  upsertLocalProduct(product: Product): Product[] {
    const products = this.getAllProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.unshift(product);
    }
    StorageService.setProducts(products);
    return products;
  },

  saveProduct(product: Product): Product {
    this.upsertLocalProduct(product);

    api
      .post<{ success?: boolean; product?: Product; products?: Product[] }>('/admin/products', { product })
      .then((res) => {
        if (res.data?.success) {
          if (Array.isArray(res.data.products)) {
            StorageService.setProducts(res.data.products);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('products-updated'));
            }
          } else if (res.data.product) {
            this.upsertLocalProduct(res.data.product);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('products-updated'));
            }
          }
        }
      })
      .catch(() => {});

    return product;
  },

  async saveProductAsync(product: Product): Promise<Product> {
    try {
      const res = await api.post<{
        success: boolean;
        product?: Product;
        products?: Product[];
        message?: string;
      }>('/admin/products', { product });
      if (res.data?.success) {
        if (Array.isArray(res.data.products)) {
          StorageService.setProducts(res.data.products);
        } else if (res.data.product) {
          this.upsertLocalProduct(res.data.product);
        } else {
          this.upsertLocalProduct(product);
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('products-updated'));
        }
        return res.data.product || product;
      }
      if (res.data?.message) {
        throw new Error(res.data.message);
      }
    } catch (err: unknown) {
      const errObj = err as { response?: { status?: number; data?: { message?: string } } };
      if (
        errObj?.response?.status &&
        errObj.response.status >= 400 &&
        errObj.response.data?.message
      ) {
        throw new Error(errObj.response.data.message);
      }
      if (err instanceof Error && !errObj?.response && !('isAxiosError' in err)) {
        throw err;
      }
    }
    return this.saveProduct(product);
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
