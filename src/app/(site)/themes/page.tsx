import type { Metadata } from "next";
import Link from "next/link";
import { DEMO_ENABLED, DEMO_STORE_HREF } from "@/lib/demo";
import MarketingShell, { MARKETING_WIDTH } from "@/components/saas/MarketingShell";
import ThemeThumb from "@/components/saas/ThemeThumb";
import type { ThemeLayout } from "@/components/saas/ThemeThumb";
import { THEMES } from "@/themes/registry";
import ThemesMarketplace from "@/components/saas/ThemesMarketplace";

export const metadata: Metadata = {
  title: "Storefront Themes — Retailr",
  description:
    "Browse every Retailr storefront theme. Each one is fully branded with your logo and colour, and you can switch any time without losing your products or orders.",
};

/* ── Helpers ──────────────────────────────────────────────────────────── */

export interface ThemeMeta {
  layout: ThemeLayout;
  tagline: string;
  bestFor: string[];
  category: string; // used for marketplace filter
  highlights: string[];
  paletteLabels: [string, string, string];
}

export const THEME_META: Record<string, ThemeMeta> = {
  classic: {
    layout: "classic",
    category: "General",
    tagline: "Clean, rounded and airy — the versatile default.",
    bestFor: ["General retail", "Food & grocery", "Electronics", "Home goods"],
    highlights: [
      "Big hero headline with your brand colour",
      "Soft rounded cards, spacious product grid",
      "Category browsing with full-width filters",
      "Works for any niche right out of the box",
    ],
    paletteLabels: ["Page background", "Card surface", "Brand accent"],
  },
  showcase: {
    layout: "showcase",
    category: "Fashion",
    tagline: "Bold grid layout with an integrated search bar.",
    bestFor: ["Fashion & apparel", "Beauty products", "Multi-category stores", "Large catalogues"],
    highlights: [
      "Prominent top search bar for quick discovery",
      "Hero banner with spotlight product tiles",
      "Uniform card grid — ideal for photo-heavy catalogues",
      "Sticky header keeps navigation always in reach",
    ],
    paletteLabels: ["Grid background", "Card surface", "Action colour"],
  },
  atelier: {
    layout: "atelier",
    category: "Boutique",
    tagline: "Warm editorial boutique — cream paper and deep brown ink.",
    bestFor: ["Fashion & boutiques", "Jewellery & accessories", "Hair & beauty", "Artisan goods"],
    highlights: [
      "Cream paper background with editorial typography",
      "Tall portrait photography cards (4:5 ratio)",
      "Announcement bar and minimal sticky header",
      "WhatsApp enquiry link built in",
    ],
    paletteLabels: ["Cream wash", "Card surface", "Ink / dark accent"],
  },
  market: {
    layout: "market",
    category: "Marketplace",
    tagline: "Bold marketplace: navy header, red CTAs and a dense product grid.",
    bestFor: ["Marketplace-style stores", "Electronics & tech", "Supermarkets & FMCG", "50+ products"],
    highlights: [
      "Two-row navy header with search and category strip",
      "Hero showcase grid of up to 4 products",
      "Horizontal best-seller scroll row on mobile",
      "Deal spotlight card and full-bleed promo banner",
    ],
    paletteLabels: ["Navy background", "White surface", "Red action colour"],
  },
  shop: {
    layout: "shop",
    category: "Marketplace",
    tagline: "Clean white marketplace: pill categories, rounded cards and a save-to-favourites button.",
    bestFor: ["Beauty & skincare", "Fashion", "Sporting goods", "General merchandise"],
    highlights: [
      "Scrollable pill category strip in the header",
      "Square product cards with heart / favourites button",
      "Full-bleed hero image with gradient overlay",
      "Minimal white palette that lets your products shine",
    ],
    paletteLabels: ["White background", "Light grey surface", "Near-black accent"],
  },
  bazaar: {
    layout: "bazaar",
    category: "Marketplace",
    tagline: "Wholesale marketplace: orange search, category sidebar and price-first dense grids — inspired by 1688.",
    bestFor: ["Wholesale & bulk catalogues", "Electronics & accessories", "Multi-category stores", "High SKU counts"],
    highlights: [
      "Orange search bar and CTAs",
      "Left category sidebar on home",
      "Dense product grids (up to 6 columns)",
      "Price-forward cards with stock hints",
    ],
    paletteLabels: ["Warm wash", "White surface", "Orange accent"],
  },
};

/* ── Browser chrome frame ─────────────────────────────────────────────── */

function BrowserFrame({ swatches, layout }: { swatches: [string, string, string]; layout: ThemeLayout }) {
  return (
    <div className="overflow-hidden rounded-2xl shadow-theme-xl ring-1 ring-gray-200" aria-hidden>
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
        <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
        <span className="h-3 w-3 rounded-full bg-[#28C840]" />
        <span className="ml-3 flex-1 rounded-md bg-white px-3 py-1 text-xs text-gray-400 ring-1 ring-gray-200">
          retailr.com/s/your-store
        </span>
      </div>
      <ThemeThumb swatches={swatches} layout={layout} large />
    </div>
  );
}

function SwatchDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-5 w-5 shrink-0 rounded-full ring-1 ring-gray-200" style={{ background: color }} />
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function ThemesPage() {
  return (
    <MarketingShell>

      {/* ── Hero ── */}
      <section className="border-b border-gray-100 bg-white">
        <div className={`${MARKETING_WIDTH} py-14 lg:py-18`}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-600">
              Storefront themes
            </p>
            <h1 className="text-4xl font-semibold leading-tight lg:text-5xl">
              Pick a look. Start selling.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-gray-500">
              Every theme is branded with your logo and colours, works on any device, and can be
              switched at any time — your products and orders are never touched.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/get-started" className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600">
                Start free trial
              </Link>
              {DEMO_ENABLED && (
                <Link href={DEMO_STORE_HREF} className="rounded-lg px-6 py-3 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                  Browse demo store
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Marketplace grid (client component for filter/sort interactivity) ── */}
      <section className="border-b border-gray-100 bg-gray-50">
        <ThemesMarketplace themes={THEMES.map((t) => ({ id: t.id, name: t.name, description: t.description, swatches: t.swatches, meta: THEME_META[t.id] ?? null }))} />
      </section>

      {/* ── Per-theme deep-dive sections ── */}
      {THEMES.map((t, idx) => {
        const meta = THEME_META[t.id];
        if (!meta) return null;
        const [bg, , accent] = t.swatches;
        const isEven = idx % 2 === 0;
        return (
          <section key={t.id} id={t.id} className={`border-b border-gray-100 ${isEven ? "bg-white" : "bg-gray-50"}`}>
            <div className={`${MARKETING_WIDTH} py-16 lg:py-20`}>
              <div className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-16 ${isEven ? "" : "lg:[&>*:first-child]:order-last"}`}>
                <BrowserFrame swatches={t.swatches} layout={meta.layout} />
                <div>
                  <span className="mb-4 inline-block rounded-full px-3 py-1 text-sm font-semibold" style={{ background: bg, color: accent }}>
                    {t.name}
                  </span>
                  <h2 className="text-3xl font-semibold leading-snug text-gray-900 lg:text-4xl">{meta.tagline}</h2>
                  <p className="mt-4 leading-relaxed text-gray-500">{t.description}</p>

                  <ul className="mt-7 space-y-3">
                    {meta.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                          <svg width={11} height={11} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="m2 6 3 3 5-5" />
                          </svg>
                        </span>
                        <span className="text-sm leading-relaxed text-gray-700">{h}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-gray-400">Best for</p>
                    <div className="flex flex-wrap gap-2">
                      {meta.bestFor.map((b) => (
                        <span key={b} className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-700 ring-1 ring-gray-200">{b}</span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-gray-400">Default palette</p>
                    <div className="flex flex-col gap-2">
                      {t.swatches.map((color, i) => (
                        <SwatchDot key={color} color={color} label={meta.paletteLabels[i]} />
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-gray-400">All colours adapt to your brand colour set in Store settings.</p>
                  </div>

                  <Link href="/get-started" className="mt-8 inline-flex h-11 items-center rounded-lg bg-brand-500 px-6 text-sm font-semibold text-white hover:bg-brand-600">
                    Use this theme — start free
                  </Link>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* ── Shared features ── */}
      <section className="border-b border-gray-100 bg-white">
        <div className={`${MARKETING_WIDTH} py-16 lg:py-20`}>
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-semibold">Every theme includes</h2>
            <p className="mt-3 text-gray-500">Built into the platform — works identically across all themes.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Your logo & brand colour", body: "Upload a logo and pick a hex colour. Every theme maps it to headers, buttons and accents automatically." },
              { title: "Full product catalogue", body: "All themes render your entire product grid with photos, pricing, variants, stock status and categories." },
              { title: "Cart & checkout", body: "Add-to-cart, quantity controls, order summary and checkout — fully functional in every theme." },
              { title: "Save to favourites", body: "Shoppers can heart any product to save it. Favourites persist in the browser across sessions." },
              { title: "Built-in search", body: "Every theme lets shoppers search by name, category or description — no plugins needed." },
              { title: "Switch any time", body: "Change your look in one click from Store settings. Your products, orders and customers are never affected." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-200 p-6 transition hover:border-brand-200 hover:shadow-theme-sm">
                <h3 className="font-semibold text-gray-800">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className={`${MARKETING_WIDTH} py-16 lg:py-20`}>
          <h2 className="mb-10 text-center text-3xl font-semibold">Theme questions</h2>
          <div className="mx-auto max-w-3xl divide-y divide-gray-200 border-y border-gray-200">
            {[
              ["Can I switch themes without losing my products?", "Yes. Your products, categories, orders, customers and store settings are all independent of your theme."],
              ["Can I customise colours?", "Every theme adapts to your brand colour set in Store settings. The theme maps it to its header, buttons and accents automatically."],
              ["Do all themes support services?", "Yes. Every theme renders both product and service listings, with separate tabs when you have both."],
              ["Which theme is right for me?", "Classic works for almost any business. Atelier suits boutiques. Shop and Market suit larger catalogues — Shop has the cleaner white look, Market has a denser grid and navy header."],
              ["Are more themes coming?", "Yes. New themes are released periodically and available on all plans automatically."],
            ].map(([q, a]) => (
              <details key={q as string} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-gray-800">
                  {q}
                  <span className="text-xl leading-none text-gray-400 transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-brand-950 text-white">
        <div className={`${MARKETING_WIDTH} py-20 text-center lg:py-24`}>
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold lg:text-5xl lg:leading-tight">
            Pick your look and start selling today.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-100/80">
            Every plan includes all themes. Switch whenever you like — no technical setup required.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/get-started" className="rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">
              Start free trial
            </Link>
            {DEMO_ENABLED && (
              <Link href={DEMO_STORE_HREF} className="rounded-lg px-7 py-3.5 text-sm font-semibold ring-1 ring-inset ring-white/30 hover:bg-white/10">
                Browse demo store
              </Link>
            )}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
