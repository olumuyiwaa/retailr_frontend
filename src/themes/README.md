# Storefront themes

A business picks its storefront theme in **Business admin → Store settings → Storefront theme**.
The id is saved on `Business.theme` and exposed as `PublicStore.theme`; `/s/[slug]/*` routes render through `ThemedPage`, which resolves the active theme and lazy-loads it.

## Add a theme
1. Create `src/themes/<id>/index.ts` exporting a `StoreTheme` (copy `showcase/`).
2. Build the parts you want. Components read data with `useStore()` (store, products, categories, `href()`, `fmt()`); use `ProductItem`/Redux cart actions for cart behaviour.
3. Add it to `THEMES` in `registry.ts`.

Any page, header or footer a theme does not provide falls back to `classic`, so a new theme can ship with just a home page and grow.
Never rename a theme id once shops use it.

## Colours
A theme may set a `palette` (paper, ink, borders), but the business's brand colour always drives the accent (`--brand`, `--brand-fg`) and tints the other tokens a little (`themePalette()` in `src/lib/storeTheme.ts`). Use the CSS variables, never a hard-coded colour for anything brand-related, and put text on brand surfaces in `var(--brand-fg)`.

## Shared pieces
Lists use `usePagination()` + `<Pager>`; copy about payment options comes from `payPhrase(store.paymentMethods)`; keep services (`kind: "service"`, bookable ones use `BookingPanel`) separate from products in every shop view.
