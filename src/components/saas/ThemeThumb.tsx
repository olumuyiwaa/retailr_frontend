import { DEMO_CATEGORIES, DEMO_PRODUCTS, type ThemeLayout } from "@/lib/demoPhotos";

export type { ThemeLayout };

/**
 * Detailed visual preview of a storefront theme using Scentora demo photos.
 * Shows real product imagery, names, prices, nav chrome and layout cues so
 * marketing pages and theme pickers feel like miniature live stores.
 */
export default function ThemeThumb({
  swatches,
  layout,
  large = false,
}: {
  swatches: [string, string, string];
  layout: ThemeLayout;
  large?: boolean;
}) {
  const [bg, surface, accent] = swatches;
  const height = large ? "h-[370px] sm:h-[475px] lg:h-[528px]" : "h-[220px]";

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg border border-gray-200 ${height}`}
      style={{ background: bg }}
      aria-hidden
    >
      {layout === "classic" && <ClassicThumb bg={bg} surface={surface} accent={accent} large={large} />}
      {layout === "showcase" && <ShowcaseThumb bg={bg} surface={surface} accent={accent} large={large} />}
      {layout === "atelier" && <AtelierThumb bg={bg} surface={surface} accent={accent} large={large} />}
      {layout === "market" && <MarketThumb bg={bg} surface={surface} accent={accent} large={large} />}
      {layout === "shop" && <ShopThumb bg={bg} surface={surface} accent={accent} large={large} />}
    </div>
  );
}

type Props = { bg: string; surface: string; accent: string; large: boolean };
type Prod = (typeof DEMO_PRODUCTS)[number];

function Badge({ badge, accent }: { badge: Prod["badge"]; accent: string }) {
  if (!badge) return null;
  const bg = badge === "Sale" ? "#DC2626" : badge === "New" ? accent : "#0F766E";
  return (
    <span
      className="absolute left-1 top-1 z-[1] rounded px-1 py-px text-[6px] font-semibold uppercase tracking-wide text-white shadow-sm"
      style={{ background: bg, fontSize: "6px", lineHeight: "10px" }}
    >
      {badge}
    </span>
  );
}

function ProductCard({
  p,
  accent,
  compact,
  portrait,
}: {
  p: Prod;
  accent: string;
  compact?: boolean;
  portrait?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-black/5">
      <div className={`relative overflow-hidden ${portrait ? "aspect-[4/5]" : "aspect-square"}`}>
        <img src={p.photo} alt="" className="h-full w-full object-cover" loading="lazy" />
        <Badge badge={p.badge} accent={accent} />
      </div>
      <div className={`min-w-0 ${compact ? "px-1 py-0.5" : "px-1.5 py-1"}`}>
        <p className="truncate font-medium text-gray-800" style={{ fontSize: compact ? 7 : 8, lineHeight: 1.25 }}>
          {p.name}
        </p>
        <div className="mt-0.5 flex items-center justify-between gap-1">
          <p className="truncate font-semibold" style={{ fontSize: compact ? 6.5 : 7.5, color: accent }}>
            {p.price}
          </p>
          {!compact && (
            <span className="truncate text-gray-400" style={{ fontSize: 6 }}>
              {p.cat}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Classic: soft rounded boutique ───────────────────────────────────── */

function ClassicThumb({ surface, accent, large }: Props) {
  const grid = DEMO_PRODUCTS.slice(0, large ? 6 : 4);
  return (
    <div className="flex h-full flex-col bg-white">
      {/* announcement */}
      <div className="px-2 py-0.5 text-center text-[7px] font-medium text-white" style={{ background: accent }}>
        Free Lagos Island pickup · Code WELCOME10
      </div>
      {/* header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-2.5 py-1.5" style={{ background: surface }}>
        <span className="text-[10px] font-semibold tracking-[0.12em]" style={{ color: accent }}>
          SCENTORA
        </span>
        <div className="flex items-center gap-2 text-[7.5px] font-medium" style={{ color: accent + "bb" }}>
          <span>Shop</span>
          <span>Categories</span>
          {large && <span>About</span>}
          <span className="relative">
            Bag
            <span className="absolute -right-2 -top-1 flex h-2.5 min-w-[10px] items-center justify-center rounded-full bg-brand-500 px-0.5 text-[6px] font-bold text-white" style={{ background: accent }}>
              2
            </span>
          </span>
        </div>
      </div>
      {/* hero */}
      <div className="relative mx-2 mt-1.5 overflow-hidden rounded-lg" style={{ height: large ? "30%" : "26%" }}>
        <img src={DEMO_PRODUCTS[0].photo} alt="" className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
        <div className="absolute bottom-1.5 left-2 right-2 flex items-end justify-between gap-2">
          <div>
            <p className="text-[9px] font-semibold text-white">New season scents</p>
            <p className="text-[7px] text-white/85">Jasmine, plum & warm amber</p>
          </div>
          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[7px] font-semibold" style={{ color: accent }}>
            Shop now
          </span>
        </div>
      </div>
      {/* section label */}
      <div className="mx-2 mt-1.5 flex items-center justify-between">
        <p className="text-[8px] font-semibold text-gray-800">Bestsellers</p>
        <p className="text-[7px]" style={{ color: accent }}>
          View all
        </p>
      </div>
      {/* grid */}
      <div className={`mx-2 mt-1 grid flex-1 content-start gap-1.5 pb-2 ${large ? "grid-cols-3" : "grid-cols-2"}`}>
        {grid.map((p) => (
          <ProductCard key={p.name} p={p} accent={accent} portrait compact={!large} />
        ))}
      </div>
      {large && (
        <div className="border-t border-gray-100 px-2 py-1.5 text-center text-[7px] text-gray-400">
          © Scentora · Lagos · retailr.com/s/scentora
        </div>
      )}
    </div>
  );
}

/* ── Showcase: marketplace with sidebar ───────────────────────────────── */

function ShowcaseThumb({ surface, accent, large }: Props) {
  const side = DEMO_PRODUCTS.slice(0, 3);
  const main = DEMO_PRODUCTS.slice(2, large ? 8 : 6);
  return (
    <div className="flex h-full flex-col bg-[#F4F6FB]">
      <div className="flex items-center gap-1.5 px-2 py-1.5" style={{ background: surface }}>
        <span className="text-[9px] font-bold" style={{ color: accent }}>
          SCENTORA
        </span>
        <div className="flex h-4 flex-1 items-center rounded-full bg-gray-100 px-2 text-[7px] text-gray-400 ring-1 ring-gray-200">
          Search fragrances…
        </div>
        <span className="text-[8px] font-medium" style={{ color: accent }}>
          Cart · 2
        </span>
      </div>
      <div className="flex gap-1 overflow-hidden px-2 py-1" style={{ background: accent }}>
        {DEMO_CATEGORIES.map((c) => (
          <span key={c} className="shrink-0 rounded-full bg-white/20 px-1.5 py-0.5 text-[6.5px] font-medium text-white">
            {c}
          </span>
        ))}
      </div>
      <div className="flex flex-1 gap-1.5 overflow-hidden p-1.5">
        {/* filters sidebar */}
        <div className="hidden w-[24%] flex-col gap-1 rounded-md bg-white p-1.5 ring-1 ring-black/5 sm:flex">
          <p className="text-[7px] font-semibold text-gray-700">Filters</p>
          {["Family", "Size", "Price"].map((f) => (
            <div key={f} className="rounded bg-gray-50 px-1 py-0.5 text-[6.5px] text-gray-500">
              {f} ▾
            </div>
          ))}
          <div className="mt-1 space-y-1">
            {side.map((p) => (
              <div key={p.name} className="flex gap-1">
                <div className="h-6 w-6 shrink-0 overflow-hidden rounded">
                  <img src={p.photo} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[6px] font-medium text-gray-800">{p.name}</p>
                  <p className="text-[6px]" style={{ color: accent }}>
                    {p.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="relative h-12 overflow-hidden rounded-md sm:h-14">
            <img src={DEMO_PRODUCTS[3].photo} alt="" className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute inset-0 flex flex-col items-start justify-center px-2">
              <p className="text-[8px] font-semibold text-white">Oud & Attar</p>
              <p className="text-[6.5px] text-white/85">Deep, lasting blends</p>
            </div>
          </div>
          <div className={`grid flex-1 content-start gap-1 ${large ? "grid-cols-3" : "grid-cols-2"}`}>
            {main.map((p) => (
              <ProductCard key={p.name} p={p} accent={accent} compact />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Atelier: editorial boutique ──────────────────────────────────────── */

function AtelierThumb({ bg, surface, accent, large }: Props) {
  const featured = DEMO_PRODUCTS[0];
  const grid = DEMO_PRODUCTS.slice(1, large ? 5 : 4);
  return (
    <div className="flex h-full flex-col" style={{ background: bg }}>
      <div
        className="flex items-center justify-center border-b px-2 py-0.5 text-[6.5px] tracking-wide"
        style={{ borderColor: accent + "14", color: accent + "aa", background: surface }}
      >
        Complimentary gift wrap on orders over ₦40,000
      </div>
      <div className="flex items-center justify-between border-b px-3 py-1.5" style={{ borderColor: accent + "14", background: surface }}>
        <div className="flex gap-2 text-[7.5px]" style={{ color: accent + "aa" }}>
          <span>Shop</span>
          <span>Collections</span>
        </div>
        <span className="text-[10px] font-semibold tracking-[0.2em]" style={{ color: accent }}>
          SCENTORA
        </span>
        <div className="flex gap-2 text-[7.5px]" style={{ color: accent + "aa" }}>
          <span>Visit</span>
          <span>Bag · 2</span>
        </div>
      </div>
      <div className={`grid gap-2 p-2 ${large ? "grid-cols-[1fr_1.05fr]" : "grid-cols-2"}`} style={{ minHeight: large ? "42%" : "38%" }}>
        <div className="flex flex-col justify-center px-1">
          <p className="text-[6.5px] uppercase tracking-[0.18em]" style={{ color: accent + "88" }}>
            Editorial
          </p>
          <p className="mt-1 text-[11px] font-semibold leading-tight" style={{ color: accent }}>
            Fragrance, composed
          </p>
          <p className="mt-1 text-[7px] leading-relaxed" style={{ color: accent + "99" }}>
            {featured.name} — jasmine, plum & amber
          </p>
          <span className="mt-2 w-fit rounded-full px-2.5 py-0.5 text-[7px] font-medium text-white" style={{ background: accent }}>
            Explore {featured.price}
          </span>
        </div>
        <div className="relative overflow-hidden rounded-md">
          <img src={featured.photo} alt="" className="h-full w-full object-cover" loading="lazy" />
          <Badge badge={featured.badge} accent={accent} />
        </div>
      </div>
      <div className="px-2 pb-0.5">
        <p className="text-[7.5px] font-semibold" style={{ color: accent }}>
          The collection
        </p>
      </div>
      <div className={`grid gap-1.5 px-2 pb-2 ${large ? "grid-cols-4" : "grid-cols-3"}`}>
        {grid.map((p) => (
          <ProductCard key={p.name} p={p} accent={accent} portrait compact={!large} />
        ))}
      </div>
    </div>
  );
}

/* ── Market: bold navy marketplace ────────────────────────────────────── */

function MarketThumb({ surface, accent, large }: Props) {
  const mosaic = DEMO_PRODUCTS.slice(0, 4);
  const row = DEMO_PRODUCTS.slice(4, large ? 8 : 7);
  return (
    <div className="flex h-full flex-col bg-[#F5F6FA]">
      <div className="text-white" style={{ background: "#1A2238" }}>
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-[9px] font-bold tracking-wide">SCENTORA</span>
          <div className="mx-2 hidden h-3.5 flex-1 max-w-[120px] items-center rounded bg-white/10 px-1.5 text-[6.5px] text-white/50 sm:flex">
            Search products…
          </div>
          <div className="flex items-center gap-2 text-[7.5px]">
            <span>Account</span>
            <span className="rounded bg-white/15 px-1.5 py-0.5 font-semibold">Cart 2</span>
          </div>
        </div>
        <div className="flex gap-2 overflow-hidden border-t border-white/10 px-2 py-0.5">
          {DEMO_CATEGORIES.map((c) => (
            <span key={c} className="shrink-0 text-[6.5px] text-white/65">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* mosaic hero */}
      <div className="grid grid-cols-4 grid-rows-2 gap-1 p-1.5" style={{ height: large ? "38%" : "34%" }}>
        {mosaic.map((p, i) => (
          <div
            key={p.name}
            className={`relative overflow-hidden rounded ${i === 0 ? "col-span-2 row-span-2" : ""}`}
            style={{ background: surface }}
          >
            <img src={p.photo} alt="" className="h-full w-full object-cover" loading="lazy" />
            {i === 0 && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                <p className="text-[8px] font-semibold text-white">{p.name}</p>
                <p className="text-[7px] text-white/90">{p.price}</p>
              </div>
            )}
            {i !== 0 && <Badge badge={p.badge} accent={accent} />}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-2">
        <p className="text-[8px] font-semibold text-[#1A2238]">Hot deals</p>
        <p className="text-[7px]" style={{ color: accent }}>
          See all
        </p>
      </div>
      <div className="flex gap-1 overflow-hidden px-1.5 pb-1">
        {row.map((p) => (
          <div key={p.name} className="min-w-0 flex-1">
            <ProductCard p={p} accent={accent} compact />
          </div>
        ))}
      </div>
      <div className="mt-auto px-1.5 pb-1.5">
        <div className="rounded px-2 py-1 text-center text-[8px] font-semibold text-white" style={{ background: accent }}>
          Shop all deals →
        </div>
      </div>
    </div>
  );
}

/* ── Shop: clean white marketplace ────────────────────────────────────── */

function ShopThumb({ accent, large }: Props) {
  const pills = DEMO_CATEGORIES.slice(0, large ? 6 : 4);
  const grid = DEMO_PRODUCTS.slice(0, large ? 6 : 4);
  const hero = DEMO_PRODUCTS[2];
  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-2.5 py-1.5">
        <span className="text-[9px] font-bold text-gray-900">SCENTORA</span>
        <div className="flex items-center gap-2 text-[7px] text-gray-500">
          <span>Products</span>
          <span>Services</span>
          {large && <span>Women</span>}
          <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-gray-100">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </span>
          <span className="relative">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </span>
        </div>
      </div>
      {/* Category pill strip */}
      <div className="flex gap-1 overflow-hidden border-b border-gray-100 px-2 py-1">
        <span className="shrink-0 rounded-full bg-gray-900 px-2 py-0.5 text-[6px] font-medium text-white">All</span>
        {pills.map((c) => (
          <span key={c} className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[6px] font-medium text-gray-600">
            {c}
          </span>
        ))}
      </div>
      {/* Hero */}
      <div className="relative mx-2 mt-1.5 overflow-hidden rounded-xl" style={{ height: large ? "28%" : "24%" }}>
        <img src={hero.photo} alt="" className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-1.5 left-2 right-2">
          <p className="text-[8px] font-bold text-white">SCENTORA</p>
          <p className="text-[6.5px] text-white/85">Niche and everyday fragrances</p>
          <span className="mt-0.5 inline-block rounded-full bg-white px-1.5 py-0.5 text-[6px] font-semibold text-gray-900">
            Shop now
          </span>
        </div>
      </div>
      {/* Section heading */}
      <div className="mx-2 mt-1.5 flex items-center justify-between">
        <p className="text-[7.5px] font-bold text-gray-800">What&apos;s new</p>
        <p className="text-[6.5px] text-gray-500">See all →</p>
      </div>
      {/* Product grid — square cards with heart */}
      <div className={`mx-2 mt-1 grid flex-1 content-start gap-1.5 pb-2 ${large ? "grid-cols-3" : "grid-cols-2"}`}>
        {grid.map((p) => (
          <div key={p.name} className="overflow-hidden rounded-lg bg-white ring-1 ring-black/5">
            <div className="relative aspect-square overflow-hidden">
              <img src={p.photo} alt="" className="h-full w-full object-cover" loading="lazy" />
              <span className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm">
                <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </span>
              {p.badge === "Sale" && (
                <span className="absolute left-1 top-1 rounded-full bg-rose-500 px-1 py-px text-[5.5px] font-semibold text-white">
                  Sale
                </span>
              )}
            </div>
            <div className="px-1 py-0.5">
              <p className="truncate text-[7px] font-medium text-gray-800">{p.name}</p>
              <p className="text-[6.5px] font-semibold" style={{ color: accent || "#1A1A1A" }}>{p.price}</p>
            </div>
          </div>
        ))}
      </div>
      {large && (
        <div className="border-t border-gray-100 px-2 py-1 text-center text-[7px] text-gray-400">
          © Scentora · Lagos · retailr.com/s/scentora
        </div>
      )}
    </div>
  );
}
