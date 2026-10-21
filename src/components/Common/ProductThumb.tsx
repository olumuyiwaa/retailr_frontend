"use client";
import React, { useState } from "react";
import ProductArt from "@/components/Store/ProductArt";

type Thumbable = {
  title: string;
  imgs?: { thumbnails: string[]; previews: string[] };
  color?: string;
};

/**
 * Product picture for the storefront.
 * Always fills its parent (use aspect-ratio / h-full on the parent) with object-cover.
 * Falls back to a coloured tile if the image is missing or fails to load.
 */
const ProductThumb = ({
  item,
  variant = "preview",
  size: _size = 250,
  className = "",
}: {
  item: Thumbable;
  variant?: "preview" | "thumbnail";
  /** Kept for call-site compatibility; layout is driven by the parent box. */
  size?: number;
  className?: string;
}) => {
  const src = variant === "thumbnail" ? item.imgs?.thumbnails?.[0] : item.imgs?.previews?.[0];
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`h-full w-full min-h-[inherit] ${className}`}>
        <ProductArt seed={item.title} label={item.title} color={item.color} />
      </div>
    );
  }

  return (
    // Plain <img> so any CDN/S3 host works without next.config image allowlists,
    // and so object-cover reliably fills the card frame.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={item.title}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
};

export default ProductThumb;
