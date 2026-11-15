# Spec: Premium & Natural Apple Design Enhancement

## 1. Goal & Vision
Elevate Fashion Doniya BD's customer-facing interface into an ultra-premium, authentic artisan textile atelier experience guided by Apple Human Interface Guidelines (HIG) and the Unslop craft standard. 

### Core Tenets:
1. **Regal Textile Atelier Aesthetic**: Quiet luxury, natural warm linen/ecru surfaces (`#FAF6F0`, `#FFFDF9`), royal crimson maroon (`#6B0812`) for primary intent, antique gold zari (`#C59B48` / `#8A5A10`) for fine jewelry-like accents. Zero loud terracotta or mismatched charcoal buttons.
2. **Apple HIG Platform Standards**:
   - 44×44pt minimum touch targets.
   - Flawless WCAG AAA contrast ratios on text and controls.
   - Smooth segmented controls and tactile steppers.
   - Translucent glassmorphism (`backdrop-blur-md` with warm cream tint) for sticky bars.
3. **Pure Iconography & Typographic Clarity**:
   - Zero raw Unicode emojis in UI labels; replace with clean Lucide vector icons (`Scissors`, `Tag`, `ShieldCheck`).
   - Bengali editorial typography (Noto Serif Bengali / Hind Siliguri) paired with tabular numerals (`.tabular-nums`) for currency and measurements.
4. **Data Integrity**:
   - Fix all occurrences of the seed typo `"নেহ কটি"` to `"লং কটি"`.

---

## 2. Acceptance Criteria (Given / When / Then)

### Scenario A: Universal Back Navigation
- **Given** a user navigates to any subpage (`/cart`, `/calculator`, `/custom-design`, `/order-tracking`, etc.)
- **When** the global back button renders
- **Then** it must render as a luxury tactile linen pill with hairline border (`#E6D8C5`), royal maroon typography/icon (`#6B0812`), subtle gold hover highlight, and NO terracotta orange gradient.

### Scenario B: Cart & Shop Primary Action Consistency
- **Given** a user visits `/cart` or `/shop` (List View)
- **When** viewing primary action buttons ("চেকআউটে এগিয়ে যান" or "সরাসরি কিনুন")
- **Then** the buttons must feature the unified royal maroon brand styling (`bg-[#6B0812]` / `hover:bg-[#53050D]`) rather than mismatched plain black (`#242424`).

### Scenario C: Clean Vector Iconography
- **Given** a user views Product Details (`/product/:slug`), Custom Studio (`/custom-design`), or Cart (`/cart`)
- **When** inspecting badges, tabs, and trust banners
- **Then** all raw Unicode emojis (`✂️`, `💡`, `🔒`) must be rendered with crisp, scalable Lucide icons.

### Scenario D: Long Koti Category Integrity
- **Given** a user views `/shop-3-5` or `/category/kamiz`
- **When** reading category titles and chips
- **Then** the title and chip must display `"লং কটি"`, with zero occurrences of `"নেহ কটি"`.
