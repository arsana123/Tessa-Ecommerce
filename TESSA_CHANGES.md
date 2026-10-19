# Tessa UI redesign – what changed

**Brand:** Dropt → Tessa (logo = your TS monogram, in navbar, footer, favicon, newsletter).
**Look:** burgundy (#22060a → #451019) + antique gold (#c9a45c) instead of white; champagne text (#f4e8d0).
**Fonts:** Cormorant Garamond (headings) + Jost (body).
**Signature motif:** arched frames (from your porcelain-screen reference) on hero, collections, product cards.

## Files changed (UI only)
- frontend/src/styles/global.css — new design tokens, buttons, forms, badges
- frontend/src/pages/HomePage.js + .module.css — fully new homepage
- frontend/src/components/layout/Navbar, Footer — logo lockup, new links
- frontend/src/components/common/ProductCard — portrait arch image cards
- all other *.module.css — recoloured to the new palette
- frontend/src/pages/LoginPage.js — new slider images/copy
- frontend/public — index.html, favicon, /images/brand, /images/products (20 photos)

## Small non-UI changes (needed for the new catalogue)
- backend/models/Product.js + validators/index.js — added categories Gowns, Tops, Co-ords, Sarees (old ones kept)
- backend/scripts/seed.js — 20 Tessa products (placeholder prices/stock/descriptions)
- "Dropt" text → "Tessa" in emails, Razorpay checkout name, policy pages

## To see the new products
cd backend && node scripts/seed.js   (this clears and re-seeds the database)
