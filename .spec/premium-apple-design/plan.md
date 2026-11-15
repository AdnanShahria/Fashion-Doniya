# Technical Plan: Premium & Natural Apple Design Enhancement

## 1. Architectural Scope & Impact Mapping
Following `/codebase-memory-mcp`, changes touch the following components and files:

1. **Back Navigation**:
   - `frontend/src/components/common/OrangeBackButton.tsx`:
     - Refactor to an Apple HIG luxury linen capsule pill with royal maroon ink, hairline borders, and subtle gold hover state.
2. **Seed Data & Category Services**:
   - `frontend/src/data/seedData.ts`:
     - Replace `'নেহ কটি'` with `'লং কটি'` on lines 1668 and 1992.
   - `frontend/src/services/measurementService.ts`:
     - Clean up alias checks on line 49.
3. **Primary Action Unification**:
   - `frontend/src/pages/CartPage.tsx`:
     - Change checkout button from `bg-[#242424]` to royal maroon `bg-[#6B0812] hover:bg-[#53050D]`.
     - Replace raw emojis (`💡`, `🔒`) with Lucide `<Tag />` and `<ShieldCheck />`.
   - `frontend/src/pages/ShopPage.tsx`:
     - Change list view "সরাসরি কিনুন" from `bg-[#242424]` + `Zap` to `bg-[#6B0812]` + `ArrowRight` / `ShoppingBag`.
4. **Emoji Removal & Craft Polish**:
   - `frontend/src/pages/ProductDetailsPage.tsx`:
     - Replace `"কাস্টম ফিটিং ✂️"` with Lucide `<Scissors />` + `"কাস্টম ফিটিং"`.
   - `frontend/src/pages/CustomDesignPage.tsx`:
     - Replace `"কাস্টম ফিটিং ✂️"` with Lucide `<Scissors />` + `"কাস্টম ফিটিং"`.
   - `frontend/src/utils/languageTranslator.ts`:
     - Update translation dictionaries accordingly.

---

## 2. Token Standards Applied
- **Surface**: `var(--surface-linen)` (`#FFFDF9`) / `var(--surface-canvas)` (`#FAF6F0`)
- **Hairline**: `var(--surface-hairline)` (`#E6D8C5`)
- **Brand Primary**: `var(--brand-primary)` (`#6B0812`) / Hover (`#53050D`)
- **Brand Zari**: `var(--brand-zari)` (`#C59B48`) / Text (`#8A5A10`)
- **Borders & Radii**: `rounded-full` for pills, `rounded-2xl` for cards, `rounded-xl` for inner controls.
