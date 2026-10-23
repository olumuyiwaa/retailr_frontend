import type { StoreTheme } from "./types";
import classic from "./classic";
import showcase from "./showcase";
import atelier from "./atelier";
import market from "./market";
import shop from "./shop";
import bazaar from "./bazaar";

/**
 * Every storefront theme. To add one:
 *  1. create src/themes/<id>/index.ts exporting a StoreTheme (see classic/ and showcase/),
 *  2. add it to this list.
 * Pages, header or footer a theme doesn't provide fall back to the default theme.
 */
export const THEMES: StoreTheme[] = [classic, showcase, atelier, market, shop, bazaar];

export const DEFAULT_THEME_ID = classic.id;

export const getTheme = (id?: string | null): StoreTheme => THEMES.find((t) => t.id === id) ?? classic;
