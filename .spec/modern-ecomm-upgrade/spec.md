# Specification: Fashion Doniya Ecomm-Demo Logic & Apple HIG Modernization

## 1. Problem Statement & Scope
Based on user feedback, images, and reference repo (`Ecomm-Demo`), the following areas need urgent enhancement:
1. **Admin Product Images**: The table under "পণ্য ব্যবস্থাপনা" shows broken images for products because seed/legacy products use identifier keys (`jamdani_saree_1`) or relative paths without fallback. The images must always load gracefully using the high-resolution texture generator or error fallback.
2. **Color Code Purpose & Tickable Outfit Previews**:
   - Clarify the exact role of the Hex color code (used for 3D garment sketch tinting, procedural texture generation, and customer swatches).
   - In the Add/Edit Product modal, make the outfit cards under "এই কাপড়ের ছবিতে পোশাকের অটো-প্রিভিউ" tickable/selectable with clear checkbox badges.
   - Persist the selected outfit IDs in product configuration (`supportedOutfits`). On the public product details page, only display the ticked outfits in the "এই কাপড় দিয়ে আপনি যা যা বানাতে পারবেন" section.
3. **Breadcrumb Navigation**: Replace the "ফিরে যান" (Back) button with Apple HIG breadcrumb navigation (`হোম > ২.৫ বহর / ৩.৫ বহর > ক্যাটাগরি > পণ্যের নাম`).
4. **Delivery & Checkout Form**: Redesign the checkout form to mirror the VOLT / Ecomm-Demo standard:
   - Guest account creation checkbox ("Create an account with these details? Recommended") with secure password inputs.
   - Delivery Location segmented picker (Inside Dhaka ৳60 / Outside Dhaka ৳120) with validation.
   - Full Name, Phone (+880 mask), optional Email, and detailed Address fields.
   - Apple-style payment selection cards (COD, bKash, Nagad, Rocket, Upay) with one-click copy for numbers and TrxID inputs.
   - Order summary card with coupon code input and encrypted checkout badge.
5. **VOLT-Grade Premium Footer**:
   - Atelier badge, brand synopsis, social icons (FB, TikTok, YT, Instagram, WhatsApp).
   - Newsletter subscription form.
   - 4-column structured navigation (Shop & Discover, Collections, Account & Orders, Fashion Doniya Care / Support).
   - Bottom bar with legal links and OrbitSaaS partnership badge.

## 2. Acceptance Criteria
- [x] Admin product table never displays broken image alt icons; always loads valid image or dynamic fabric canvas.
- [x] Outfit auto-preview cards in Admin Product Modal can be toggled/ticked with visual checkmarks and saved.
- [x] Product details page only displays the outfits that are enabled for that product.
- [x] Product details page features Apple HIG breadcrumb trail instead of `OrangeBackButton`.
- [x] Checkout page matches VOLT delivery form and payment selector with inside/outside Dhaka toggles and optional account creation.
- [x] Footer upgraded to premium VOLT architecture with OrbitSaaS badge and 4-column layout.
