import { DEMO_PRODUCTS, type ThemeLayout } from "@/lib/demoPhotos";

export type { ThemeLayout };

/**
 * Visual preview of a storefront theme using real demo-product photos
 * (same Unsplash set as the Scentora seed). Renders a miniature browser-page
 * layout so marketing pages and theme pickers show something shoppers would recognise.
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
  const height = large ? "h-[370px] sm:h-[475px] lg:h-[528px]" : "h-[211px]";
  const products = DEMO_PRODUCTS;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg border border-gray-200 bg-white ${height}`}
      style={{ background: bg }}
      aria-hidden
    >
      {layout === "classic" && <ClassicThumb bg={bg} surface={surface} accent={accent} products={products} large={large} />}
      {layout === "showcase" && <ShowcaseThumb bg={bg} surface={surface} accent={accent} products={products} large={large} />}
      {layout === "atelier" && <AtelierThumb bg={bg} surface={surface} accent={accent} products={products} large={large} />}
      {layout === "market" && <MarketThumb bg={bg} surface={surface} accent={accent} products={products} large={large} />}
    </div>
  );
}

type Prod = (typeof DEMO_PRODUCTS)[number];
type Props = { bg: string; surface: string; accent: string; products: readonly Prod[]; large: boolean };

function ClassicThumb({ surface, accent, products, large }: Props) {
  const n = large ? 6 : 4;
  const grid = products.slice(0, n);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 py-2" style={{ background: surface }}>
        <span className="text-[10px] font-semibold tracking-wide" style={{ color: accent }}>SCENTORA</span>
        <div className="flex gap-2 text-[8px]" style={{ color: accent + "99" }}>
          <span>Shop</span><span>About</span><span>Bag</span>
        </div>
      </div>
      <div className="relative mx-2 mt-2 overflow-hidden rounded-md" style={{ height: large ? "32%" : "28%" }}>
        <img src={products[0].photo} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-[10px] font-semibold text-white">New season scents</p>
          {large && <p className="text-[8px] text-white/80">Shop the collection</p>}
        </div>
      </div>
      <div className={`mx-2 mt-2 grid flex-1 gap-1.5 pb-2 ${large ? "grid-cols-3" : "grid-cols-2"}`}>
        {grid.map((p) => (
          <div key={p.name} className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-black/5">
            <div className="aspect-[4/5] overflow-hidden">
              <img src={p.photo} alt="" className="h-full w-full object-cover" />
            </div>
            {large && (
              <div className="px-1.5 py-1">
                <p className="truncate text-[8px] font-medium text-gray-800">{p.name}</p>
                <p className="text-[7px] text-gray-500">{p.price}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ShowcaseThumb({ surface, accent, products, large }: Props) {
  const side = products.slice(0, 3);
  const main = products.slice(3, large ? 9 : 7);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-2 py-1.5" style={{ background: surface }}>
        <span className="text-[9px] font-bold" style={{ color: accent }}>SCENTORA</span>
        <div className="h-3 flex-1 rounded-full bg-gray-100" />
        <span className="text-[8px]" style={{ color: accent }}>Cart</span>
      </div>
      <div className="flex gap-1 overflow-x-auto px-2 py-1" style={{ background: accent }}>
        {["Women", "Men", "Oud", "Gifts", "New"].map((c) => (
          <span key={c} className="shrink-0 rounded-full bg-white/20 px-1.5 py-0.5 text-[7px] text-white">{c}</span>
        ))}
      </div>
      <div className="flex flex-1 gap-1.5 overflow-hidden p-1.5">
        <div className="hidden w-[22%] flex-col gap-1 sm:flex">
          {side.map((p) => (
            <div key={p.name} className="flex-1 overflow-hidden rounded bg-white ring-1 ring-black/5">
              <img src={p.photo} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-2 gap-1 content-start">
          {main.map((p) => (
            <div key={p.name} className="overflow-hidden rounded bg-white ring-1 ring-black/5">
              <div className="aspect-square overflow-hidden">
                <img src={p.photo} alt="" className="h-full w-full object-cover" />
              </div>
              {large && (
                <div className="px-1 py-0.5">
                  <p className="truncate text-[7px] font-medium text-gray-800">{p.name}</p>
                  <p className="text-[6px] text-gray-500">{p.price}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AtelierThumb({ bg, surface, accent, products, large }: Props) {
  const hero = products[2];
  const grid = products.slice(0, large ? 4 : 3);
  return (
    <div className="flex h-full flex-col" style={{ background: bg }}>
      <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: accent + "18", background: surface }}>
        <span className="text-[10px] font-semibold tracking-[0.15em]" style={{ color: accent }}>SCENTORA</span>
        <div className="flex gap-2 text-[8px]" style={{ color: accent + "aa" }}>
          <span>Shop</span><span>Visit</span>
        </div>
      </div>
      <div className={`grid flex-1 gap-2 p-2 ${large ? "grid-cols-[1.1fr_0.9fr]" : "grid-cols-2"}`}>
        <div className="flex flex-col justify-center px-1">
          <p className="text-[9px] font-semibold leading-snug" style={{ color: accent }}>Fragrance, composed</p>
          {large && <p className="mt-1 text-[7px] leading-relaxed" style={{ color: accent + "99" }}>Editorial picks for the season</p>}
          <span className="mt-2 w-fit rounded-full px-2 py-0.5 text-[7px] font-medium text-white" style={{ background: accent }}>Shop now</span>
        </div>
        <div className="overflow-hidden rounded-md">
          <img src={hero.photo} alt="" className="h-full w-full object-cover" />
        </div>
      </div>
      <div className={`grid gap-1.5 px-2 pb-2 ${large ? "grid-cols-4" : "grid-cols-3"}`}>
        {grid.map((p) => (
          <div key={p.name} className="overflow-hidden rounded-md bg-white/80 ring-1 ring-black/5">
            <div className="aspect-[4/5] overflow-hidden">
              <img src={p.photo} alt="" className="h-full w-full object-cover" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketThumb({ surface, accent, products, large }: Props) {
  const hero = products.slice(0, 4);
  const row = products.slice(4, large ? 8 : 6);
  return (
    <div className="flex h-full flex-col bg-[#F5F6FA]">
      <div className="px-2 py-1.5 text-white" style={{ background: "#1A2238" }}>
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold tracking-wide">SCENTORA</span>
          <div className="h-3 w-16 rounded-sm bg-white/15" />
          <span className="text-[8px]">Cart (2)</span>
        </div>
        <div className="mt-1 flex gap-1 overflow-hidden">
          {["All", "Women", "Men", "Oud", "Gifts"].map((c) => (
            <span key={c} className="shrink-0 text-[7px] text-white/70">{c}</span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1 p-1.5">
        {hero.map((p, i) => (
          <div key={p.name} className={`overflow-hidden rounded ${i === 0 ? "col-span-2 row-span-2" : ""}`} style={{ background: surface }}>
            <img src={p.photo} alt="" className="h-full w-full object-cover" style={{ minHeight: i === 0 ? (large ? 120 : 70) : 32 }} />
          </div>
        ))}
      </div>
      <div className="flex gap-1 overflow-hidden px-1.5 pb-1.5">
        {row.map((p) => (
          <div key={p.name} className="min-w-0 flex-1 overflow-hidden rounded bg-white ring-1 ring-black/5">
            <div className="aspect-square overflow-hidden">
              <img src={p.photo} alt="" className="h-full w-full object-cover" />
            </div>
            {large && <p className="truncate px-0.5 py-0.5 text-[6px] font-medium" style={{ color: "#1A2238" }}>{p.name}</p>}
          </div>
        ))}
      </div>
      <div className="mt-auto px-1.5 pb-1.5">
        <div className="rounded px-2 py-1 text-center text-[8px] font-semibold text-white" style={{ background: accent }}>
          Shop deals
        </div>
      </div>
    </div>
  );
}
