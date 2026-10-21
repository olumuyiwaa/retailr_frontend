export type Product = {
  title: string;
  reviews: number;
  price: number;
  discountedPrice: number;
  // numeric for the static template data, string for tenant (business) products
  id: number | string;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
  // Extra fields used by business storefronts (/s/[slug]). All optional so the
  // static template data keeps working unchanged.
  storeId?: string;
  category?: string;
  description?: string;
  /** undefined = no stock limit (services). */
  stock?: number;
  kind?: "product" | "service";
  durationMins?: number;
  color?: string; // placeholder tile colour when a product has no photo
  sku?: string;
  createdAt?: string;
  sold?: number;
  // Variant pickers (e.g. size / colour). Present only for business products that have them.
  specs?: { label: string; value: string }[];
  variants?: { id: string; name: string; price?: number; stock: number }[];
};
