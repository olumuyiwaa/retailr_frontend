export type ThemeLayout = "classic" | "showcase" | "atelier" | "market";

/**
 * SVG wireframe illustration of a storefront theme.
 * All elements are drawn at a fixed 320×220 viewBox and scaled to fit.
 *
 * `large`  – taller version used in the BrowserFrame on the themes page.
 * `small`  – compact version used in pickers and overview grids (default).
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

  // Derive readable secondary colours from the palette
  const accentFaint  = accent + "28";   // ~16 % opacity
  const accentLight  = accent + "55";   // ~33 %
  const accentMid    = accent + "99";   // ~60 %
  const surfaceDark  = surface + "cc";  // card shadow hint
  const white        = "#FFFFFF";
  const lineColor    = accent + "22";

  const height = large ? "h-[370px] sm:h-[475px] lg:h-[528px]" : "h-[211px]";

  return (
    <div
      className={`w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 ${height}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 320 220"
        preserveAspectRatio="xMidYMin meet"
        className="h-full w-full"
        style={{ display: "block" }}
      >
        {layout === "classic"   && <ClassicLayout    bg={bg} surface={surface} accent={accent} accentFaint={accentFaint} accentLight={accentLight} accentMid={accentMid} white={white} lineColor={lineColor} />}
        {layout === "showcase"  && <ShowcaseLayout   bg={bg} surface={surface} accent={accent} accentFaint={accentFaint} accentLight={accentLight} accentMid={accentMid} white={white} lineColor={lineColor} />}
        {layout === "atelier"   && <AtelierLayout    bg={bg} surface={surface} accent={accent} accentFaint={accentFaint} accentLight={accentLight} accentMid={accentMid} white={white} lineColor={lineColor} surfaceDark={surfaceDark} />}
        {layout === "market"    && <MarketLayout     bg={bg} surface={surface} accent={accent} accentFaint={accentFaint} accentLight={accentLight} accentMid={accentMid} white={white} lineColor={lineColor} />}
      </svg>
    </div>
  );
}

/* ─── Shared palette prop type ────────────────────────────────────────── */
interface P {
  bg: string; surface: string; accent: string;
  accentFaint: string; accentLight: string; accentMid: string;
  white: string; lineColor: string; surfaceDark?: string;
}

/* ─── Tiny helpers ────────────────────────────────────────────────────── */

/** Horizontal "text line" placeholder */
function Line({ x, y, w, h = 2.5, fill, opacity = 1 }: { x: number; y: number; w: number; h?: number; fill: string; opacity?: number }) {
  return <rect x={x} y={y} width={w} height={h} rx={1.2} fill={fill} opacity={opacity} />;
}

/** Filled rounded rectangle */
function Box({ x, y, w, h, r = 3, fill, opacity = 1 }: { x: number; y: number; w: number; h: number; r?: number; fill: string; opacity?: number }) {
  return <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} opacity={opacity} />;
}

/** Product card: image placeholder + two text lines */
function Card({ x, y, w, h, imgH, surface, accent, r = 3 }: { x: number; y: number; w: number; h: number; imgH: number; surface: string; accent: string; r?: number }) {
  return (
    <g>
      <Box x={x} y={y} w={w} h={h} r={r} fill={surface} />
      {/* Image area */}
      <Box x={x} y={y} w={w} h={imgH} r={r} fill={accent} opacity={0.18} />
      {/* Product image cross-hatch decoration */}
      <line x1={x + w * 0.3} y1={y + imgH * 0.3} x2={x + w * 0.7} y2={y + imgH * 0.7} stroke={accent} strokeWidth={0.8} opacity={0.25} />
      <line x1={x + w * 0.7} y1={y + imgH * 0.3} x2={x + w * 0.3} y2={y + imgH * 0.7} stroke={accent} strokeWidth={0.8} opacity={0.25} />
      {/* Title line */}
      <Line x={x + 5} y={y + imgH + 5} w={w * 0.68} fill={accent} opacity={0.75} />
      {/* Price line */}
      <Line x={x + 5} y={y + imgH + 10} w={w * 0.42} h={2} fill={accent} opacity={0.55} />
    </g>
  );
}

/* ─── Classic layout ──────────────────────────────────────────────────── */
// Airy white, rounded cards, brand-colour hero
function ClassicLayout({ bg, surface, accent, accentFaint, accentLight, white }: P) {
  const cardW = 66; const cardH = 70; const cardGap = 8;
  const cols = 4;
  const gridX = 12;
  const gridY = 116;

  return (
    <>
      {/* Page background */}
      <rect width={320} height={220} fill={bg} />

      {/* ── Header ── */}
      <Box x={0} y={0} w={320} h={28} r={0} fill={surface} />
      {/* Logo dot + wordmark */}
      <circle cx={16} cy={14} r={5} fill={accent} />
      <Line x={26} y={11} w={36} fill={accent} opacity={0.8} />
      <Line x={26} y={15.5} w={24} h={2} fill={accent} opacity={0.3} />
      {/* Nav links */}
      {[165, 192, 218, 244].map((lx) => (
        <Line key={lx} x={lx} y={12.5} w={18} fill={accent} opacity={0.35} />
      ))}
      {/* Cart button */}
      <Box x={273} y={7} w={36} h={14} r={7} fill={accent} />
      <Line x={278} y={12.5} w={26} h={2} fill={white} />

      {/* ── Hero band ── */}
      <Box x={0} y={28} w={320} h={72} r={0} fill={accentFaint} />
      {/* Hero text block */}
      <Line x={16} y={44} w={24} h={2} fill={accent} opacity={0.5} />
      <Line x={16} y={52} w={108} h={5.5} fill={accent} opacity={0.9} />
      <Line x={16} y={62} w={90} h={5} fill={accent} opacity={0.9} />
      <Line x={16} y={72} w={130} h={2.5} fill={accent} opacity={0.3} />
      <Line x={16} y={77} w={110} h={2.5} fill={accent} opacity={0.3} />
      {/* CTA button */}
      <Box x={16} y={84} w={56} h={12} r={6} fill={accent} />
      <Line x={24} y={88.5} w={40} h={2} fill={white} />
      {/* Hero image placeholder */}
      <Box x={175} y={34} w={130} h={60} r={6} fill={surface} />
      <Box x={175} y={34} w={130} h={60} r={6} fill={accent} opacity={0.1} />
      <line x1={210} y1={50} x2={270} y2={88} stroke={accent} strokeWidth={1} opacity={0.2} />
      <line x1={270} y1={50} x2={210} y2={88} stroke={accent} strokeWidth={1} opacity={0.2} />
      <circle cx={240} cy={64} r={12} fill={accent} opacity={0.12} />

      {/* ── Divider line ── */}
      <line x1={0} y1={103} x2={320} y2={103} stroke={accent} strokeWidth={0.5} opacity={0.12} />

      {/* ── Section heading ── */}
      <Line x={gridX} y={108} w={80} h={3.5} fill={accent} opacity={0.7} />
      <Line x={263} y={109.5} w={44} h={2} fill={accent} opacity={0.3} />

      {/* ── Product grid (4 cards) ── */}
      {Array.from({ length: cols }).map((_, i) => (
        <Card
          key={i}
          x={gridX + i * (cardW + cardGap)}
          y={gridY}
          w={cardW}
          h={cardH}
          imgH={44}
          surface={surface}
          accent={accent}
          r={5}
        />
      ))}

      {/* ── Trust bar at bottom ── */}
      <Box x={0} y={196} w={320} h={24} r={0} fill={surface} opacity={0.7} />
      {[40, 120, 200, 280].map((lx) => (
        <g key={lx}>
          <circle cx={lx - 20} cy={208} r={3} fill={accent} opacity={0.3} />
          <Line x={lx - 14} y={206.5} w={28} h={2} fill={accent} opacity={0.25} />
        </g>
      ))}
    </>
  );
}

/* ─── Showcase layout ─────────────────────────────────────────────────── */
// Bold grid, integrated search bar, sticky header
function ShowcaseLayout({ bg, surface, accent, accentFaint, accentLight, accentMid, white }: P) {
  return (
    <>
      {/* Page background */}
      <rect width={320} height={220} fill={bg} />

      {/* ── Header ── */}
      <Box x={0} y={0} w={320} h={32} r={0} fill={surface} />
      {/* Logo */}
      <circle cx={16} cy={16} r={5} fill={accent} />
      <Line x={26} y={13} w={38} fill={accent} opacity={0.8} />
      {/* Search bar */}
      <Box x={72} y={8} w={164} h={16} r={4} fill={bg} />
      <Line x={78} y={15} w={100} h={2} fill={accent} opacity={0.2} />
      {/* Search button */}
      <Box x={236} y={8} w={40} h={16} r={4} fill={accent} />
      <Line x={242} y={15} w={28} h={2} fill={white} />
      {/* Cart */}
      <Box x={283} y={9} w={26} h={14} r={4} fill={accentFaint} />
      <Line x={287} y={14.5} w={18} h={2} fill={accent} opacity={0.5} />

      {/* ── Category nav ── */}
      <Box x={0} y={32} w={320} h={16} r={0} fill={accentFaint} />
      {[12, 50, 90, 130, 172, 214, 256].map((lx, i) => (
        <Line key={lx} x={lx} y={38.5} w={i === 0 ? 28 : 22} h={2} fill={accent} opacity={i === 0 ? 0.65 : 0.3} />
      ))}

      {/* ── Hero banner ── */}
      <Box x={8} y={54} w={195} h={72} r={5} fill={surface} />
      <Box x={8} y={54} w={195} h={72} r={5} fill={accent} opacity={0.08} />
      {/* Hero text */}
      <Line x={20} y={68} w={22} h={2} fill={accent} opacity={0.45} />
      <Line x={20} y={75} w={100} h={5} fill={accent} opacity={0.85} />
      <Line x={20} y={84} w={82} h={5} fill={accent} opacity={0.85} />
      <Line x={20} y={95} w={115} h={2} fill={accent} opacity={0.25} />
      <Box x={20} y={104} w={52} h={13} r={4} fill={accent} />
      <Line x={26} y={108.5} w={40} h={2} fill={white} />
      {/* Spotlight tiles */}
      <Box x={210} y={54} w={50} h={34} r={5} fill={surface} />
      <Box x={210} y={54} w={50} h={34} r={5} fill={accentLight} opacity={0.3} />
      <Line x={215} y={72} w={36} h={2} fill={accent} opacity={0.5} />
      <Line x={215} y={76.5} w={26} h={1.5} fill={accent} opacity={0.3} />
      <Box x={264} y={54} w={50} h={34} r={5} fill={surface} />
      <Box x={264} y={54} w={50} h={34} r={5} fill={accentLight} opacity={0.3} />
      <Line x={270} y={72} w={36} h={2} fill={accent} opacity={0.5} />
      <Line x={270} y={76.5} w={26} h={1.5} fill={accent} opacity={0.3} />
      <Box x={210} y={92} w={50} h={34} r={5} fill={surface} />
      <Box x={210} y={92} w={50} h={34} r={5} fill={accentMid} opacity={0.2} />
      <Line x={215} y={110} w={36} h={2} fill={accent} opacity={0.5} />
      <Box x={264} y={92} w={50} h={34} r={5} fill={surface} />
      <Box x={264} y={92} w={50} h={34} r={5} fill={accentMid} opacity={0.2} />
      <Line x={270} y={110} w={36} h={2} fill={accent} opacity={0.5} />

      {/* ── Section heading ── */}
      <Line x={8} y={136} w={80} h={3.5} fill={accent} opacity={0.7} />
      <Line x={270} y={137.5} w={44} h={2} fill={accent} opacity={0.3} />

      {/* ── 4-column product grid ── */}
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} x={8 + i * 78} y={144} w={70} h={66} imgH={42} surface={surface} accent={accent} r={4} />
      ))}

      {/* ── Footer bar ── */}
      <Box x={0} y={210} w={320} h={10} r={0} fill={accent} opacity={0.08} />
    </>
  );
}

/* ─── Atelier layout ──────────────────────────────────────────────────── */
// Cream background, tall portrait cards, editorial typography, announcement bar
function AtelierLayout({ bg, surface, accent, accentFaint, accentLight, accentMid, white, lineColor, surfaceDark }: P) {
  return (
    <>
      {/* Page background — warm cream */}
      <rect width={320} height={220} fill={bg} />

      {/* ── Announcement bar ── */}
      <Box x={0} y={0} w={320} h={14} r={0} fill={accent} />
      <Line x={90} y={5.5} w={140} h={2} fill={white} opacity={0.85} />

      {/* ── Header ── */}
      <Box x={0} y={14} w={320} h={28} r={0} fill={surface} />
      {/* Logo text style (atelier = wordmark, no icon) */}
      <Line x={16} y={24} w={52} h={4} fill={accent} opacity={0.9} />
      <Line x={16} y={30} w={36} h={2} fill={accent} opacity={0.3} />
      {/* Nav links */}
      {[152, 178, 206, 234, 262].map((lx) => (
        <Line key={lx} x={lx} y={27} w={18} h={2} fill={accent} opacity={0.4} />
      ))}
      {/* Bag text */}
      <Line x={289} y={27} w={22} h={2} fill={accent} opacity={0.6} />
      {/* Category nav row */}
      <Box x={0} y={42} w={320} h={12} r={0} fill={bg} />
      <line x1={0} y1={42} x2={320} y2={42} stroke={accent} strokeWidth={0.4} opacity={0.2} />
      {[12, 48, 86, 122, 160, 200].map((lx, i) => (
        <Line key={lx} x={lx} y={46.5} w={i === 0 ? 26 : 22} h={1.5} fill={accent} opacity={i === 0 ? 0.6 : 0.28} />
      ))}

      {/* ── Hero — 2-column: text left, tall image right ── */}
      {/* Left copy */}
      <Line x={16} y={66} w={22} h={2} fill={accent} opacity={0.45} />
      <Line x={16} y={73} w={115} h={6} fill={accent} opacity={0.9} />
      <Line x={16} y={83} w={100} h={6} fill={accent} opacity={0.9} />
      <Line x={16} y={95} w={120} h={2} fill={accent} opacity={0.25} />
      <Line x={16} y={100} w={106} h={2} fill={accent} opacity={0.25} />
      <Line x={16} y={105} w={90} h={2} fill={accent} opacity={0.25} />
      {/* CTA button pair */}
      <Box x={16} y={113} w={52} h={13} r={2} fill={accent} />
      <Line x={22} y={117.5} w={40} h={2} fill={white} />
      <Box x={75} y={113} w={52} h={13} r={2} fill={bg} />
      <line x1={75} y1={113} x2={127} y2={113} stroke={accent} strokeWidth={0.8} opacity={0.35} />
      <line x1={127} y1={113} x2={127} y2={126} stroke={accent} strokeWidth={0.8} opacity={0.35} />
      <line x1={127} y1={126} x2={75} y2={126} stroke={accent} strokeWidth={0.8} opacity={0.35} />
      <line x1={75} y1={126} x2={75} y2={113} stroke={accent} strokeWidth={0.8} opacity={0.35} />
      <Line x={81} y={117.5} w={40} h={2} fill={accent} opacity={0.5} />
      {/* Right: tall portrait image */}
      <Box x={155} y={56} w={150} h={100} r={5} fill={surface} />
      <Box x={155} y={56} w={150} h={100} r={5} fill={accent} opacity={0.1} />
      {/* Image cross */}
      <line x1={180} y1={76} x2={280} y2={136} stroke={accent} strokeWidth={1} opacity={0.15} />
      <line x1={280} y1={76} x2={180} y2={136} stroke={accent} strokeWidth={1} opacity={0.15} />
      <circle cx={230} cy={106} r={18} fill={accent} opacity={0.07} />
      {/* Floating small card */}
      <Box x={148} y={136} w={60} h={68} r={4} fill={white} />
      <line x1={148} y1={136} x2={208} y2={136} stroke={accent} strokeWidth={0.5} opacity={0.25} />
      <Box x={148} y={136} w={60} h={40} r={4} fill={accent} opacity={0.12} />

      {/* ── "New in" heading ── */}
      <Line x={16} y={170} w={50} h={3.5} fill={accent} opacity={0.65} />

      {/* ── 4 portrait cards ── */}
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} x={16 + i * 74} y={178} w={62} h={38} imgH={24} surface={surface} accent={accent} r={3} />
      ))}
    </>
  );
}

/* ─── Market layout ───────────────────────────────────────────────────── */
// Dark navy header, red CTAs, 2-row header, dense product grid
function MarketLayout({ bg, surface, accent, accentFaint, accentLight, accentMid, white, lineColor }: P) {
  return (
    <>
      {/* Page background */}
      <rect width={320} height={220} fill={bg} />

      {/* ── Top header bar (navy) ── */}
      <Box x={0} y={0} w={320} h={30} r={0} fill={accent} />
      {/* Logo circle + wordmark */}
      <circle cx={16} cy={15} r={5} fill={white} opacity={0.9} />
      <Line x={27} y={12.5} w={40} h={3} fill={white} opacity={0.9} />
      <Line x={27} y={17.5} w={28} h={2} fill={white} opacity={0.5} />
      {/* Search bar */}
      <Box x={78} y={8} w={172} h={14} r={3} fill={white} />
      <Line x={84} y={14} w={100} h={2} fill={accent} opacity={0.2} />
      {/* Search button */}
      <Box x={250} y={8} w={36} h={14} r={3} fill={accentMid} opacity={0.99} />
      <Line x={255} y={14} w={26} h={2} fill={white} />
      {/* Cart icon area */}
      <Box x={292} y={8} w={22} h={14} r={3} fill={white} opacity={0.15} />
      <Line x={295} y={14} w={16} h={2} fill={white} opacity={0.8} />

      {/* ── Category strip (darker navy) ── */}
      <Box x={0} y={30} w={320} h={14} r={0} fill={accent} opacity={0.82} />
      <line x1={0} y1={30} x2={320} y2={30} stroke={white} strokeWidth={0.4} opacity={0.15} />
      {[8, 46, 82, 122, 162, 202, 244, 278].map((lx, i) => (
        <Line key={lx} x={lx} y={36} w={i === 0 ? 28 : 22} h={2} fill={white} opacity={i === 0 ? 0.9 : 0.5} />
      ))}

      {/* ── Hero section (navy bg) ── */}
      <Box x={0} y={44} w={320} h={68} r={0} fill={accent} opacity={0.92} />
      {/* Category badge */}
      <Box x={8} y={50} w={44} h={8} r={2} fill={accentMid} opacity={0.99} />
      <Line x={12} y={53} w={36} h={2} fill={white} />
      {/* Headline */}
      <Line x={8} y={65} w={110} h={5.5} fill={white} opacity={0.95} />
      <Line x={8} y={74} w={90} h={5.5} fill={white} opacity={0.95} />
      {/* Subline */}
      <Line x={8} y={85} w={130} h={2} fill={white} opacity={0.4} />
      <Line x={8} y={90} w={115} h={2} fill={white} opacity={0.4} />
      {/* CTA button */}
      <Box x={8} y={97} w={52} h={12} r={3} fill={accentMid} opacity={0.99} />
      <Line x={14} y={101.5} w={40} h={2} fill={white} />
      {/* Outline button */}
      <rect x={67} y={97} width={52} height={12} rx={3} fill="none" stroke={white} strokeWidth={0.8} opacity={0.4} />
      <Line x={73} y={101.5} w={40} h={2} fill={white} opacity={0.55} />
      {/* Hero showcase grid (right side) */}
      {[[168, 44, 74, 68], [246, 44, 66, 32], [246, 80, 66, 32]].map(([x, y, w, h], i) => (
        <g key={i}>
          <Box x={x} y={y} w={w} h={h} r={4} fill={white} opacity={0.1} />
          <Box x={x} y={y} w={w} h={h * 0.6} r={4} fill={white} opacity={0.07} />
          <line x1={x + w * 0.3} y1={y + h * 0.25} x2={x + w * 0.7} y2={y + h * 0.75} stroke={white} strokeWidth={0.7} opacity={0.15} />
          <line x1={x + w * 0.7} y1={y + h * 0.25} x2={x + w * 0.3} y2={y + h * 0.75} stroke={white} strokeWidth={0.7} opacity={0.15} />
        </g>
      ))}

      {/* ── Trust bar ── */}
      <Box x={0} y={112} w={320} h={14} r={0} fill={surface} />
      <line x1={0} y1={112} x2={320} y2={112} stroke={accent} strokeWidth={0.4} opacity={0.15} />
      {[40, 120, 200, 280].map((lx) => (
        <g key={lx}>
          <circle cx={lx - 22} cy={119} r={2.5} fill={accent} opacity={0.3} />
          <Line x={lx - 17} y={117.5} w={32} h={2} fill={accent} opacity={0.25} />
        </g>
      ))}

      {/* ── Category tiles row ── */}
      <Line x={8} y={132} w={72} h={3} fill={accent} opacity={0.6} />
      <Line x={272} y={133} w={44} h={2} fill={accentMid} opacity={0.5} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <Box x={8 + i * 52} y={139} w={44} h={30} r={4} fill={surface} />
          <Box x={8 + i * 52} y={139} w={44} h={20} r={4} fill={accent} opacity={0.1} />
          <Line x={14 + i * 52} y={163} w={30} h={2} fill={accent} opacity={0.4} />
        </g>
      ))}

      {/* ── Product grid heading ── */}
      <Line x={8} y={177} w={72} h={3} fill={accent} opacity={0.6} />

      {/* ── 4-column product grid ── */}
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} x={8 + i * 78} y={184} w={70} h={32} imgH={20} surface={surface} accent={accent} r={3} />
      ))}

      {/* ── Bottom promo banner ── */}
      <Box x={0} y={210} w={320} h={10} r={0} fill={accentMid} opacity={0.35} />
    </>
  );
}
