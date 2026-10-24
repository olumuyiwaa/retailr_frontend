# Retailr — Frontend

A multi-tenant SaaS platform that lets small African businesses subscribe, get their own branded online storefront and run everything from a simple admin dashboard. Think Bumpa-style commerce: products, orders, customers, discounts, bookings, invoices and billing, all in one place.

> **Status:** fully connected to the [Retailr API](https://github.com/olumuyiwaa/retailr) (NestJS + Prisma + PostgreSQL). There is no mock data. Set `NEXT_PUBLIC_API_URL` to the API's `/api/v1` address before starting.

---

## The three surfaces

| Surface | URL pattern | Who uses it |
|---|---|---|
| Marketing + sign-up | `/`, `/themes`, `/get-started` | Prospective businesses |
| Business admin | `/admin/business/*` | Store owners and staff |
| Super admin | `/admin/super/*` | The Retailr platform team |
| Public storefront | `/s/<slug>/*` | Shoppers |

---

## Business admin

- **Dashboard** — setup checklist, KPI cards (revenue, orders, customers, GMV), needs-attention panel (low stock, unpaid orders).
- **Header search (⌘K)** — finds orders, customers, products and services instantly, or jumps to any admin page.
- **Products** — up to 6 photos with a cover image, size/colour variants with individual stock and price, up to 10 custom detail fields (e.g. Material, Density), SKU, and a status (Active / Draft / Out of stock).
- **Services** — separate from products: no stock, optional duration, bookable switch, and options like "Basic" or "Premium" with their own price.
- **Categories** — the business creates and manages its own categories, each with a cover picture. Renaming moves its products; deleting leaves them uncategorised.
- **Orders** — status updates (Pending → Processing → Shipped → Delivered), invoice link, send receipt by email.
- **Record a sale** — in-person, WhatsApp, Instagram or phone sales with a custom price, discount, paid/owing toggle and walk-in or saved customers; stock decrements immediately.
- **Customers** — list with filter by group, individual view with order history and spend.
- **Bookings** — calendar view (month / week / day), click a time slot to book manually; bookable services set opening hours, notice period and capacity per slot. Customers get a public link to cancel. A private iCalendar link lets the team sync bookings to Google, Apple or Outlook Calendar.
- **Reports** — sales over time, breakdown by channel and payment method, best sellers, top customers, money still owed.
- **Analytics** — visitors, visits, page views, conversion rate, visit-to-order funnel, traffic sources, devices, countries, top pages and top products.
- **Customer groups** — automatic rules ("spent over X", "ordered at least N times", etc.) or hand-picked lists.
- **Messaging** — email or SMS to everyone or a group, with `{{first_name}}` and `{{store}}` personalisation; history shows sent and failed counts.
- **Coupons** — percent or fixed discount with minimum order, max uses and expiry date.
- **Team** — invite staff by email (manager or staff role); accepted invites create a login. Plan limits enforced.
- **Billing** — current plan, upgrade/downgrade with a discount-code box, invoice history.
- **Store settings** — logo upload, brand colour, currency, storefront theme (with live preview thumbnails), profile, and which payment options checkout offers (pay on delivery, bank transfer with account details, or card).
- **Notifications** — bell in the header shows new orders, low and sold-out stock; browser push available (HTTPS + VAPID keys required; iPhone/iPad need the site added to the home screen first).

---

## Super admin

- **Platform overview** — MRR, churn rate, new sign-ups, active businesses, GMV, alerts.
- **Analytics** — marketing-site traffic and sign-up funnel; aggregate traffic and conversion across all storefronts; busiest stores.
- **Businesses** — approve, suspend, reactivate; view each business's orders, customers and subscription.
- **Plans editor** — create or edit plans (name, price, limits, features, which storefront themes the plan includes).
- **Subscriptions** — view and manage all active subscriptions.
- **Invoices** — platform billing history.
- **Plan discount codes** — percent or fixed USD codes, optionally scoped to certain plans or a single business, with a use limit and expiry; businesses enter them at sign-up or plan change and the discount comes off every billing period.

---

## Public storefront

Each business gets a store at `/s/<slug>`. Only `active` and `trial` businesses are live; others show an unavailable page.

**Pages:** home, shop (with search, category filter, sort), product detail (photo gallery, variants, add to cart, bookings), cart, checkout (delivery details + payment method), order confirmation, printable invoice/receipt, wishlist/favourites, booking confirmation.

**Favourites** — shoppers can heart any product card to save it. The wishlist persists in `localStorage` across sessions. A heart icon in every theme's header links to `/s/<slug>/wishlist`.

**Themes** — six storefront looks ship today:

| Theme | Style | Best for |
|---|---|---|
| **Classic** | Soft, rounded, follows brand colour | Any business |
| **Showcase** | Marketplace grid with search bar and category strip | Fashion, beauty, large catalogues |
| **Atelier** | Warm editorial boutique, cream & brown, portrait cards | Boutiques, jewellery, hair & beauty |
| **Market** | Bold navy header, red accents, dense grid, search bar | Electronics, FMCG, 50+ products |
| **Shop** | Clean white, pill category strip, square cards with heart button | Beauty, fashion, sporting goods |
| **Bazaar** | Wholesale marketplace, orange search bar, dense grid, price-first cards | High-SKU / bulk-selling stores |

Every theme has its own header, footer, home page, shop page, product page and cart page. Any page a theme doesn't implement falls back to Classic. All themes share the same max content width (`1680 px`) and responsive horizontal padding (`20 px → 32 px → 48 px → 80 px`) so layout feels consistent across theme switches. Themes are gated per plan: the platform admin sets which themes each plan includes. Adding a new theme is a new folder in `src/themes/` plus one line in `registry.ts` — see `src/themes/README.md`.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TypeScript, Tailwind CSS 3 |
| State | Redux Toolkit — cart and wishlist persisted in `localStorage` |
| Charts | ApexCharts |
| Foundation | NextMerce template + TailAdmin design tokens |

---

## Getting started

```bash
cp .env.example .env.local     # then fill in the values below
npm install
npm run dev                    # http://localhost:3000
```

**Required env vars:**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | API base URL, e.g. `http://localhost:4000/api/v1` |
| `NEXT_PUBLIC_IMAGE_HOSTS` | Comma-separated extra image hostnames (your S3/R2/CDN domain) |
| `NEXT_PUBLIC_DEMO_ENABLED` | Set `false` to hide demo buttons on production deployments |

Other scripts: `npm run build`, `npm run lint` (ESLint), `npm run typecheck`.

Requires Node 20.9+ (Next.js 16 minimum).

---

## Demo accounts

Start the API first — run migrations and `npm run seed`, then `npm run seed:demo` for the demo shop.

| Role | Email | Password |
|---|---|---|
| Super admin | `admin@retailr.com` (or `SEED_SUPER_ADMIN_EMAIL`) | `SEED_SUPER_ADMIN_PASSWORD` from the API's `.env` |
| Demo store owner (Scentora) | `demo@scentora.example` | `Demo@12345` |
| Demo store manager | `manager@scentora.example` | `Demo@12345` |
| Demo store staff | `staff@scentora.example` | `Demo@12345` |

The sign-in page has one-click demo buttons for each role. The demo storefront is at `/s/scentora`; the coupon `WELCOME10` gives 10% off.

---

## Project structure

```
src/
  app/(site)/
    page.tsx                  Marketing landing page
    themes/                   Theme marketplace page (/themes)
    get-started/              Business sign-up
    s/[slug]/                 Public storefront routes
      page.tsx                  Store home
      shop/                     Shop / browse
      product/[id]/             Product detail
      cart/                     Cart
      checkout/                 Checkout
      order/[token]/            Order confirmation
      invoice/[token]/          Printable invoice
      wishlist/                 Saved favourites
      booking/[token]/          Booking confirmation
    admin/
      login/                  Sign-in page
      (admin)/
        super/                Super admin pages
        business/             Business admin pages
  components/
    saas/                     Admin UI kit: cards, tables, widgets, ThemePicker, ThemeThumb,
                              ThemesMarketplace, PricingCards, MarketingShell, …
    Store/                    Shared storefront components (StoreHeader, StoreCart,
                              StoreCheckout, StoreWishlist, FaveButton, …)
    Common/                   Shared primitive components
  themes/
    registry.ts               THEMES array + getTheme() — register a theme here
    ThemedPage.tsx            Lazy-loads the active theme's page or falls back to Classic
    types.ts                  StoreTheme, ThemePage, ThemePageProps, ThemePalette types
    classic/                  Default theme (delegates to src/components/Store/*)
    showcase/                 Marketplace grid theme
    atelier/                  Editorial boutique theme
    market/                   Bold navy marketplace theme
    shop/                     Clean white marketplace theme
  services/                   Typed API call functions (one file per domain)
  lib/
    api.ts                    Fetch client: auth headers, refresh-and-retry, error parsing
    upload.ts                 Image upload helpers (presigned PUT flow)
    demoPhotos.ts             Unsplash demo assets for theme thumbnails
  redux/
    store.ts                  Redux store with manual localStorage persistence
    features/
      cart-slice.ts           Cart state (persisted under retailr:cart:v1)
      wishlist-slice.ts       Wishlist/favourites state (persisted under retailr:wishlist:v1)
  types/saas.ts               Shared domain types (Business, Product, Order, Plan, …)
```

---

## How the data layer works

UI code never calls `fetch` directly. Every screen calls a typed function in `src/services/` which goes through `src/lib/api.ts`. The fetch client attaches the access token, retries once on a 401 (refreshes the token first), and signs the user out if the refresh fails.

**Sessions** — access token + rotating refresh token, both stored in `localStorage`. A 401 triggers one silent refresh-and-retry; a second 401 signs the user out.

**Cart and wishlist** — Redux slices that serialise their state to `localStorage` (`retailr:cart:v1` and `retailr:wishlist:v1`) on every change and reload it on startup. The cart is scoped to a single store (switching stores clears it). The wishlist is also store-scoped and persists across page refreshes.

**Billing payments** — plan checkouts redirect to the payment provider page and return to `/admin/business/billing?reference=...`, which confirms the payment with the API.

**Team invites** — arrive by email and open `/admin/accept-invite?token=...`.

**Analytics** — `StoreTracker` (storefronts) and `MarketingTracker` (landing pages) batch events and send them to `/track`. Visitors are counted once per day per browser, sessions once per tab session.

---

## Adding a new storefront theme

1. Create `src/themes/<id>/index.ts` exporting a `StoreTheme` (copy `atelier/index.ts` as a starting point).
2. Build whichever pages you need (`Home.tsx`, `Shop.tsx`, `Product.tsx`, `Cart.tsx`, `Header.tsx`, `Footer.tsx`). Read data with `useStore()`.
3. Register it in `src/themes/registry.ts` by adding it to the `THEMES` array.
4. Add it to the `Plan.themes` default array in the Prisma schema (backend) and to `THEME_IDS` in `src/business/dto/business.dto.ts` (backend validation allowlist).

Any page a theme doesn't provide falls back to Classic. Never rename a theme `id` once live stores use it.

---

## Roadmap

- [x] Storefronts, admin dashboards, plans and subscriptions
- [x] Free plan and local-currency pricing (NGN, GHS, KES, USD)
- [x] Discounts and coupons
- [x] Invoices and receipts
- [x] Product variants and photo upload
- [x] Customer groups and messaging (email + SMS)
- [x] Storefront themes (Classic, Showcase, Atelier, Market, Shop, Bazaar)
- [x] Theme marketplace page (`/themes`) with filter, search and per-theme deep-dive
- [x] Gating themes by plan (platform admin sets which themes each plan includes)
- [x] Site analytics for businesses and the platform
- [x] Subscription payments (Paystack and Flutterwave)
- [x] Owner-chosen checkout payment options (pay on delivery, bank transfer)
- [x] Password reset and email verification
- [x] Bookable services with opening hours and appointment slots
- [x] Bookings calendar and private iCalendar sync link
- [x] Header search (⌘K) to jump to any admin page
- [x] Notifications: new orders, low/sold-out stock, new sign-ups (bell + browser push)
- [x] Save to favourites (heart button on every theme, persisted in localStorage)
- [x] Wishlist page (`/s/<slug>/wishlist`) with add-to-cart from saved items
- [x] Bank transfer with structured bank details (offered only once complete; card hidden unless demo mode)
- [x] Delivery zones, international shipping, store pickup and free-shipping threshold (paid plans)
- [x] Brand colour drives every storefront theme
- [x] Platform admin switches subscription payments between Paystack and Flutterwave
- [ ] Online card payments at storefront checkout
- [ ] Courier integrations (Shipbubble, Fez) with order sync
- [ ] Customer accounts for shoppers (saved addresses, order history)
- [ ] Subdomain routing and custom domains
- [ ] Take a deposit when booking

---

## Credits

Storefront scaffolding from [NextMerce](https://nextmerce.com/) (free Next.js eCommerce template). Admin styling follows [TailAdmin](https://tailadmin.com/) conventions. Check each project's licence before commercial use.
