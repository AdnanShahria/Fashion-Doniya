# Technical Plan: Ecomm-Demo Logics & Apple Design Standards

## Architecture & Data Flow
1. **Product Image Resolver (`frontend/src/utils/imageHelper.ts`)**:
   - Provide `resolveProductImageUrl(product, candidateImage)`:
     - Check if candidate URL is valid (`http://`, `https://`, `data:image/`, or valid static path).
     - If not, use `getUniqueProductFabricImage(product)`.
     - In `AdminProducts.tsx`, bind an `onError` handler that flips to `getUniqueProductFabricImage(product)`.
2. **Product Supported Outfits**:
   - Update `Product` interface in `frontend/src/types/index.ts` to include `supportedOutfits?: string[];`.
   - Update `ProductCustomMeasurementConfig` to also store `supportedOutfits?: string[];` for lossless DB compatibility.
   - Update `AdminProducts.tsx` state and outfit cards to toggle selection (checkbox overlay).
   - In `ProductDetailsPage.tsx`, filter `PRODUCT_OUTFIT_OPTIONS` by `product.supportedOutfits` if specified and non-empty.
3. **Breadcrumb Navigation**:
   - Replace line 797 `<OrangeBackButton label="ফিরে যান" />` in `ProductDetailsPage.tsx` with a `<nav aria-label="Breadcrumb">` component.
   - Link `হোম` (`/`), `${product.fabricWidth} বহর` (`/fabric/${product.fabricWidth}-bahar`), `${product.category}` (`/fabric/${product.fabricWidth}-bahar?category=${encodeURIComponent(product.category)}`), and `${product.name}`.
4. **Checkout Page Form Revamp**:
   - Refactor `CheckoutPage.tsx` using VOLT components and styling:
     - Delivery zone selection (Inside Dhaka ৳60 / Outside Dhaka ৳120).
     - Guest account creation accordion with password fields.
     - Apple-style payment gateway selector cards (COD, bKash, Nagad, Rocket, Upay).
     - Authoritative price calculation and order submission.
5. **VOLT-Grade Footer Revamp**:
   - Rewrite `frontend/src/components/common/Footer.tsx` based on `Ecomm-Demo/frontend/src/components/layout/Footer.tsx`.
   - Include atelier badge, brand text, social channels, newsletter form, 4 navigation columns, support hours, and OrbitSaaS partnership badge.
