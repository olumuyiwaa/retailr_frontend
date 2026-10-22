import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export type WishlistItem = {
  id: number | string;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  storeId?: string;
  status?: string;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
};

type WishlistState = {
  items: WishlistItem[];
  /** The store this wishlist belongs to. Cleared when switching stores. */
  storeId?: string;
};

const initialState: WishlistState = {
  items: [],
};

export const wishlist = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    addItemToWishlist: (state, action: PayloadAction<WishlistItem>) => {
      const { id, storeId } = action.payload;
      // switching stores — start fresh
      if (storeId && state.storeId && state.storeId !== storeId) {
        state.items = [];
      }
      if (storeId) state.storeId = storeId;
      if (!state.items.find((item) => item.id === id)) {
        state.items.push(action.payload);
      }
    },
    removeItemFromWishlist: (state, action: PayloadAction<number | string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    /** Toggle: adds if absent, removes if present. */
    toggleWishlistItem: (state, action: PayloadAction<WishlistItem>) => {
      const { id, storeId } = action.payload;
      if (storeId && state.storeId && state.storeId !== storeId) {
        state.items = [];
      }
      if (storeId) state.storeId = storeId;
      const idx = state.items.findIndex((item) => item.id === id);
      if (idx >= 0) {
        state.items.splice(idx, 1);
      } else {
        state.items.push(action.payload);
      }
    },
    removeAllItemsFromWishlist: (state) => {
      state.items = [];
    },
  },
});

// ── Selectors ────────────────────────────────────────────────────────────────

export const selectWishlistItems = (state: RootState) =>
  state.wishlistReducer.items;

/** Returns the set of wishlisted item ids for O(1) lookup. */
export const selectWishlistIds = createSelector(
  [selectWishlistItems],
  (items) => new Set(items.map((i) => String(i.id)))
);

export const {
  addItemToWishlist,
  removeItemFromWishlist,
  toggleWishlistItem,
  removeAllItemsFromWishlist,
} = wishlist.actions;

export default wishlist.reducer;
