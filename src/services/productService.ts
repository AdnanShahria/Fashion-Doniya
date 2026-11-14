import { Product, FabricWidth } from '../types';
import { StorageService } from './storageService';

const ADMIN_TOKEN = 'fd-admin-secure-2026';

export const productService = {
  getAllProducts(): Product[] {
    StorageService.initialize();
    return StorageService.getProducts();
  },

  async syncFromBackend(): Promise<Product[]> {
    StorageService.initialize();
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const json = await res.json();
        if (json?.success && Array.isArray(json.products) && json.products.length > 0) {
          StorageService.setProducts(json.products);
          return json.products as Product[];
        }
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

    fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': ADMIN_TOKEN
      },
      body: JSON.stringify({ product })
    }).catch(() => {});

    return product;
  },

  deleteProduct(id: string): boolean {
    const products = this.getAllProducts();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length !== products.length) {
      StorageService.setProducts(filtered);
      fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': ADMIN_TOKEN
        }
      }).catch(() => {});
      return true;
    }
    return false;
  }
};
