# Retailr

A multi-tenant SaaS platform that lets small African businesses subscribe, get their own online storefront and run it from a simple admin. Think Bumpa-style commerce for sellers: products, orders, customers, discounts, invoices and billing, with local-currency pricing.

> **Status:** connected to the [Retailr API](https://github.com/olumuyiwaa/retailr) (NestJS + Prisma + PostgreSQL). Set `NEXT_PUBLIC_API_URL` to its `/api/v1` address (see `.env.example`); there is no mock data any more.

## What's in it

**Three surfaces**

| Surface | URL | Who |
| --- | --- | --- |
| Marketing + sign-up | `/`, `/get-started` | Prospective businesses |
| Business admin | `/admin/business/*` | Store owners and staff |
| Super admin | `/admin/super/*` | The Retailr team |
| Public storefront | `/s/<slug>` | Shoppers |

**Business admin:** dashboard with setup checklist, KPIs and needs-attention panel; products (up to 6 photos with a cover image, size/colour variants with their own stock and price, and up to 10 custom details such as Material or Density, with suggested names for the business type); categories the business creates and manages itself, each with a cover picture (rename moves its products, delete leaves them uncategorised); orders (status updates, invoice link, send receipt); customers (filter by group); record a sale (in person, WhatsApp, Instagram or phone sales with custom prices, discount, paid/owing and walk-in or saved customers; stock updates immediately); reports (sales over time, by channel and payment method, best sellers, top customers, money still owed); site analytics (visitors, visits, page views, conversion, a visit-to-order funnel, traffic sources, devices, countries, most visited pages and products); customer groups (automatic rules like "spent over X" or hand-picked); messages (email or SMS to everyone or a group, with {{first_name}} and {{store}} personalisation; the history shows how many were sent and how many failed); discounts and coupons; team; billing and plan changes (with a discount-code box); store settings (logo, currency, storefront theme, profile).

**Super admin:** platform overview (MRR, churn, sign-ups, alerts); site analytics (marketing-site traffic and sign-up funnel, plus traffic and conversion across all stores, busiest stores); business approvals, suspend/reactivate; plans editor; subscriptions; invoices; subscription discounts (percentage or fixed USD codes, optionally limited to certain plans or one business, with a use limit and expiry; businesses enter them at sign-up or when changing plan, and the discount comes off every billing period while they stay on that plan).

**Storefront:** each business gets a store with its own logo, categories and a photo gallery on every product page (home, shop, product, cart, checkout, order confirmation, printable invoice/receipt). Owners pick a **theme** under Store settings, and the store switches instantly (see Themes below). Only `active` and `trial` businesses are live; suspended or pending ones show an unavailable page.

**Themes:** three storefront looks ship today, **Classic** (default; soft and rounded, follows the brand colour), **Showcase** (marketplace layout from the original template: boxed hero, filter sidebar) and **Atelier** (warm editorial boutique with big portrait photos, built from a real hair-store design). A theme can restyle any page, header or footer and anything it skips falls back to Classic. Adding a theme is a new folder under `src/themes/` plus one line in `src/themes/registry.ts`; see `src/themes/README.md`. Gating themes by plan is planned.

**Pricing:** a free Basic plan plus Starter, Growth and Scale. Prices display in NGN, GHS, KES or USD via a currency switcher; platform accounting (MRR, invoices) stays in USD.

**Store currency:** each business picks the currency it sells in (NGN, GHS, KES or USD) under Store settings; the storefront, invoices and merchant reports all use it. New businesses default from their country.

**Discounts:** percent or fixed coupons with minimum order, max uses and expiry, validated again when the order is placed.

## Tech stack

- Next.js 16 (App Router, Turbopack) and React 19
- TypeScript, Tailwind CSS 3
- Redux Toolkit (storefront cart, persisted in localStorage)
- ApexCharts for dashboards
- Built on the NextMerce free template and the TailAdmin design tokens

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. Production build: `npm run build && npm start`.

Requires Node 18.18+ (Node 20+ recommended).

### Demo accounts

Start the API first (see its README: run the migrations and `npm run seed` to create the plans and the super admin). Then sign up at `/get-started`, or sign in at `/admin/login` as the seeded super admin.

| Role | Email |
| --- | --- |
| Super admin | `admin@retailr.com` |
| Business admin (Adire Hub, Growth plan) | `amara@adirehub.com` |
| Business admin (Kente & Co, Scale plan) | `kwame@kenteandco.com` |

Try a storefront at `/s/adire-hub` or `/s/kente-co`. Coupon codes to try at checkout: `WELCOME10`, `SAVE5` (minimum $50).

Demo data lives in your browser's localStorage (`retailr:db:v2`). The login page has a reset option, or clear site data to start fresh.

## Project structure

```
src/
  app/(site)/
    page.tsx              marketing landing + pricing
    get-started/          business sign-up
    s/[slug]/…            public storefront routes
    admin/login           sign-in
    admin/(admin)/
      super/…             super admin pages
      business/…          business admin pages
  components/
    saas/                 admin UI kit (cards, tables, dashboard widgets, pricing)
    Store/                Classic theme storefront components
  themes/                 storefront themes (registry, classic, showcase, atelier)
  services/               typed functions the screens call; each one is an HTTP call to the API
  lib/api.ts              fetch client: session tokens, refresh-and-retry, error messages, paging
  lib/upload.ts           image uploads (picked photos go to the API's upload URLs)
  types/saas.ts           shared domain types
  lib/                    currency, formatting, store theming, detail-name presets
  redux/                  cart state
```

### How the data layer works

UI code never calls `fetch` directly. It calls typed async functions in `src/services/` (`auth`, `platform`, `business`, `store`, `analytics`, `plans`, `planCoupons`), which call the API through `src/lib/api.ts`. The business-admin functions still take a `businessId` first argument so the screens read as before, but the API works out the business from your sign-in and the argument is not sent. Sessions are an access token plus a rotating refresh token kept in localStorage; a 401 triggers one refresh and a retry, and a failed refresh signs you out. Visitor tracking is batched and sent to `/track` (browsers announcing themselves as headless or bots are ignored by the API). Plan payments redirect to the payment page and come back to `/admin/business/billing?reference=...`, which confirms the payment with the API. Team invites arrive by email and open `/admin/accept-invite?token=...`.

### Site analytics

`src/services/analytics.ts` generates plausible traffic history from the seed data (online orders and sign-ups always match the real tables) and adds the visits you make while using the demo, recorded by `StoreTracker` on storefronts and `MarketingTracker` on the landing and sign-up pages. Visitors are counted once per day per browser, visits once per tab session, and the traffic source comes from `utm_source` or the referrer (try `/s/adire-hub?utm_source=whatsapp`). With a real backend, replace this file with calls to an analytics API; the pages only use `getBusinessAnalytics` and `getPlatformAnalytics`.

## Roadmap

- [x] Storefronts, admin dashboards, plans and subscriptions
- [x] Free plan and local-currency pricing
- [x] Discounts and coupons
- [x] Invoices and receipts
- [x] Product variants and photo upload
- [x] Customer groups and messaging
- [x] Storefront themes, managed categories and product details
- [x] Site analytics for businesses and the platform
- [ ] More themes, and gating themes by plan
- [ ] Payment gateways and delivery integrations
- [ ] Subdomain routing and custom domains
- [ ] NestJS + Prisma backend (spec and Prisma schema ready in the retailr repo)
- [ ] Working global search and notifications

## Credits

Storefront scaffolding comes from the [NextMerce](https://nextmerce.com/) free Next.js eCommerce template; admin styling follows [TailAdmin](https://tailadmin.com/) conventions. Check each project's licence before commercial use.
