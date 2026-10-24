// Colour helpers that turn a business's single brand colour into a full
// storefront palette (ink, tints, readable foreground), so every shop looks
// like its own brand instead of the same template in a different accent.

type RGB = [number, number, number];

export function parseHex(hex: string): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return [60, 80, 224];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function toHex([r, g, b]: RGB): string {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

/** Blend `hex` toward `other` by `t` (0 = hex, 1 = other). */
export function mix(hex: string, other: string, t: number): string {
  const a = parseHex(hex);
  const b = parseHex(other);
  return toHex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
}

export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function readableOn(hex: string): string {
  return luminance(hex) > 170 ? "#16181d" : "#ffffff";
}

export interface StorePalette {
  brand: string;
  brandFg: string;
  /** Deep, brand-tinted near-black used for text and dark surfaces. */
  ink: string;
  /** Soft tint of the brand used for panels and chips. */
  tint: string;
  /** Barely-there tint used as the page background. */
  wash: string;
  /** Hairline colour for borders. */
  line: string;
  /** Muted body text. */
  muted: string;
}

export function storePalette(brand: string): StorePalette {
  const ink = mix(brand, "#0b0b0b", 0.78);
  return {
    brand,
    brandFg: readableOn(brand),
    ink,
    tint: mix(brand, "#ffffff", 0.86),
    wash: mix(brand, "#ffffff", 0.955),
    line: mix(brand, "#ffffff", 0.82),
    muted: mix(ink, "#ffffff", 0.38),
  };
}

/**
 * The colours a theme renders with. A theme's own palette sets the look (paper, ink, borders), but the
 * business's brand colour always drives the accent (buttons, links, badges) and gently tints the surfaces,
 * so every theme reads as that business's own.
 */
export function themePalette(brand: string, themed?: Partial<StorePalette>): StorePalette {
  const base = storePalette(brand);
  if (!themed) return base;
  const p = { ...base, ...themed };
  return {
    ...p,
    brand: base.brand,
    brandFg: base.brandFg,
    ink: mix(p.ink, brand, 0.18),
    tint: mix(p.tint, brand, 0.12),
    wash: mix(p.wash, brand, 0.04),
    line: mix(p.line, brand, 0.1),
  };
}

/** Small deterministic string hash, used to pick artwork per product. */
export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
