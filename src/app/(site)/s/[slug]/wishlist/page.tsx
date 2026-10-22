"use client";

import StoreGate from "@/components/Store/StoreGate";
import StoreWishlist from "@/components/Store/StoreWishlist";

export default function StoreWishlistPage() {
  return (
    <StoreGate>
      <StoreWishlist />
    </StoreGate>
  );
}
