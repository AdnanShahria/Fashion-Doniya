# Technical Implementation Plan: Full Audit & Semi-Next.js Architecture

## Architecture Overview
Uses the **Semi-Next.js Hybrid Architecture** defined in `C:\Users\Adnan\Desktop\OrbitSaaS\Ecomm-Demo\seminextconv.md`:
- **Edge API & SSR Engine**: Hono (`functions/api/app.ts`) + Cloudflare Pages Functions (`functions/_middleware.ts`, `functions/product/[[slug]].ts`, `functions/category/[[slug]].ts`, `functions/sitemap.xml.ts`, `functions/feed.xml.ts`, `functions/media/[[key]].ts`).
- **Shared Edge Handlers**: `functions/api/utils/edge-seo.ts` and `functions/api/utils/edge-handlers.ts` power both Cloudflare Pages Functions and local Bun `server.ts` so crawler HTML, real 404s, sitemaps, feeds, `robots.txt`, and `llms.txt` work identically everywhere.
- **Frontend**: React 19 + React Router 7 + Zustand + Vite, with `<Link>` crawlable navigation, startup `/auth/me` session verification, 401 auto-logout interceptor, async checkout verification, and dynamic `<head>` + JSON-LD synchronization.

## Workstream Partitioning (Zero-Conflict File Ownership)
1. **Backend Auth, Security & Seed (`self` Subagent 1)**:
   - `functions/api/utils/auth-helper.ts`
   - `functions/api/routers/auth.ts`
   - `functions/api/routers/sysadm.ts`
   - `functions/api/routers/customers.ts`
   - `functions/api/routers/commerce.ts`
   - `functions/api/routers/ai.ts`
   - `functions/api/utils/seed.ts`
2. **Backend Orders, Inventory, Coupons & Mappers (`self` Subagent 2)**:
   - `functions/api/utils/mappers.ts`
   - `functions/api/routers/orders.ts`
   - `functions/api/routers/courier.ts`
   - `functions/api/routers/system.ts`
3. **Edge SEO, Products Auto-SEO, Sitemap/Feed & Semi-Next.js SSR (`self` Subagent 3)**:
   - `functions/api/utils/helpers.ts`
   - `functions/api/utils/edge-seo.ts`
   - `functions/api/utils/edge-handlers.ts`
   - `functions/api/utils/media-upload.ts`
   - `functions/api/routers/products.ts`
   - `functions/api/routers/categories.ts`
   - `functions/api/app.ts`
   - `functions/_middleware.ts`
   - `functions/product/[[slug]].ts`
   - `functions/category/[[slug]].ts`
   - `functions/sitemap.xml.ts`
   - `functions/feed.xml.ts`
   - `frontend/public/robots.txt`, `frontend/public/llms.txt`, `frontend/public/llms-full.txt`
4. **Frontend Auth, Checkout, Storefront SEO & Admin Fixes (`self` Subagent 4 / Coordinator)**:
   - `frontend/src/types/index.ts`
   - `frontend/src/services/api.ts`, `orderService.ts`, `productService.ts`, `uploadService.ts`
   - `frontend/src/context/StoreContext.tsx`
   - `frontend/src/components/common/RouteGuards.tsx`, `ProductCard.tsx`, `Header.tsx`, `Footer.tsx`
   - `frontend/src/pages/AccountPage.tsx`, `ProductDetailsPage.tsx`, `CustomDesignPage.tsx`, `CategoryGalleryPage.tsx`, `FabricWidthCategoryPage.tsx`, `ShopPage.tsx`, `CartPage.tsx`, `CheckoutPage.tsx`, `OrderConfirmationPage.tsx`
   - `frontend/src/pages/admin/*` (`AdminLayout.tsx`, `AdminProducts.tsx`, `AdminOrders.tsx`, `AdminContent.tsx`, `AdminCustomers.tsx`, `AdminSettings.tsx`, `AdminPromotions.tsx`, `AdminHomepage.tsx`, `AdminNavigation.tsx`, `AdminSeo.tsx`)
   - `frontend/src/App.tsx`
