# Specification: Full End-to-End Audit, Auth Hardening, Dynamic SEO & Semi-Next.js Edge SSR

## 1. Authentication & Account Management
- **FR-1.1 Multi-Identifier Login**: Customers can log in using either a normalized Bangladesh mobile number (`01XXXXXXXXX`) or an email address via `POST /api/v1/auth/login`.
- **FR-1.2 Registration & Duplicate Prevention**: `POST /api/v1/auth/register` validates phone format (`/^01[3-9]\d{8}$/`), email format, and prevents duplicate registrations across both phone and email (`409 Conflict`), while blocking registration onto `blocked` accounts (`403 Forbidden`).
- **FR-1.3 Cryptographic Password Reset & Dedicated Routes**:
  - `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password` generate 6-digit OTPs using `crypto.getRandomValues` (10-minute expiration, max 5 failed attempts, prior unconsumed OTPs invalidated on new request).
  - Dedicated frontend routes `/login`, `/register`, `/forgot-password`, `/account/forgot-password`, `/reset-password`, `/account/reset-password` render with `noindex, nofollow`.
  - `devOtp` is never returned in production or non-localhost hosts.
- **FR-1.4 Session Persistence, Refresh & Revocation**:
  - JWTs include `pwdVer` derived from password hash; changing or resetting a password immediately invalidates all prior tokens (`401`).
  - `resolveAuthContext` and `GET /api/v1/auth/me` verify user/admin existence, `status !== 'blocked'`, and `pwdVer`.
  - Frontend validates `localStorage` tokens against `GET /api/v1/auth/me` on startup and clears auth state on `401` responses.
  - Logout clears `authStore`, `userStore`, `apiCache`, `sessionStorage`, and cached order/admin PII from `localStorage`.
- **FR-1.5 RBAC & BOLA/IDOR Protection**:
  - `POST /api/v1/customers/sync` requires authentication (`401`) and restricts non-admins to their own profile (`403` on cross-user tampering).
  - `user_carts` namespaces customer carts (`user:<id>`) separately from guest sessions (`sess:<id>`).
  - `POST /api/v1/returns` verifies order ownership and caps refund amount to `order.totalAmount`.
  - `POST /api/v1/courier/webhook` rejects missing secrets in production without hardcoded fallback.

## 2. Product Upload & Real-Time Dynamic SEO
- **FR-2.1 Unicode-Safe Collision-Free Slugs**: `slugify()` preserves Unicode combining marks (`\p{M}`) so Bengali names are never corrupted, and `resolveUniqueProductSlug()` guarantees unique slugs on create/update.
- **FR-2.2 Automatic SEO Metadata**: Creating or updating a product computes `seoTitle`, `seoDescription`, `seoKeywords`, and `imageAlt` automatically when omitted or uncustomized, and triggers non-blocking IndexNow + Google Sitemap pings via `safeWaitUntil`.
- **FR-2.3 Image Filename & Alt Optimization**: Image uploads accept `nameHint` to produce SEO-friendly R2 keys with immutable cache headers, and all storefront/admin product `<img>` tags render `product.imageAlt || product.name`.

## 3. Semi-Next.js Edge SSR Architecture (`seminextconv.md`)
- **FR-3.1 Universal Edge Middleware**: `functions/_middleware.ts` handles dynamic verification files, `robots.txt`, `llms.txt`, `llms-full.txt`, route-specific SEO injection on public pages, and `noindex, nofollow` + `X-Robots-Tag` on private routes (`/admin`, `/account`, `/cart`, `/checkout`, `/wishlist`, `/login`, `/register`, `/forgot-password`, `/reset-password`).
- **FR-3.2 Product & Category SSR**: `functions/product/[[slug]].ts` and `functions/category/[[slug]].ts` strip static `FAQPage`/duplicate tags, inject canonical URLs (`/product/:slug`), `hreflang` (`bn-BD`, `en`, `x-default`), OpenGraph, Twitter Cards, `Product` + `BreadcrumbList` / `CollectionPage` JSON-LD, zero-JS fallback HTML, and return real HTTP `404` for missing/inactive items.
- **FR-3.3 Local Dev SSR Parity & Client Head Sync**: `functions/api/app.ts` exposes identical SSR rendering for local Bun server (`server.ts`), and `App.tsx` synchronizes canonical, `hreflang`, OpenGraph, `robots`, and JSON-LD on SPA navigation.

## 4. Storefront, Checkout, Orders & Admin Integrity
- **FR-4.1 Authoritative Async Checkout**: `CheckoutPage.tsx` awaits backend order creation (`POST /api/v1/orders`), surfaces server validation errors without wiping the cart, and syncs updated `stockYards`.
- **FR-4.2 Inventory & Customer Stats Reconciliation**: Order cancellation, return, deletion, and courier status changes restore `products.stockYards` and `coupons.usedCount`; order lifecycle updates `users.totalOrders`, `users.totalSpent`, and `productSales`.
- **FR-4.3 Coupon & Measurement Completeness**: `PUT /admin/settings` syncs `coupons` SQL table; `/coupons/validate` checks `expiresAt`, `usageLimit`, and `maxDiscountAmount`; custom body measurement inputs render in `ProductDetailsPage.tsx` and `CustomDesignPage.tsx`; navigation uses crawlable `<Link to="...">`.
