import { configureStore } from "@reduxjs/toolkit";

import quickViewReducer from "./features/quickView-slice";
import cartReducer from "./features/cart-slice";
import wishlistReducer from "./features/wishlist-slice";
import productDetailsReducer from "./features/product-details";

import { TypedUseSelectorHook, useSelector } from "react-redux";

const CART_KEY = "retailr:cart:v1";
const WISHLIST_KEY = "retailr:wishlist:v1";

// The cart survives page refreshes (per browser). Wrapped in try/catch because
// storage can be unavailable (private mode, blocked cookies).
function loadCart() {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items)) return parsed;
  } catch {
    /* ignore corrupt or blocked storage */
  }
  return undefined;
}

function loadWishlist() {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(WISHLIST_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items)) return parsed;
  } catch {
    /* ignore corrupt or blocked storage */
  }
  return undefined;
}

const preloadedCart = loadCart();
const preloadedWishlist = loadWishlist();

export const store = configureStore({
  reducer: {
    quickViewReducer,
    cartReducer,
    wishlistReducer,
    productDetailsReducer,
  },
  preloadedState: {
    ...(preloadedCart ? { cartReducer: preloadedCart } : {}),
    ...(preloadedWishlist ? { wishlistReducer: preloadedWishlist } : {}),
  },
});

if (typeof window !== "undefined") {
  store.subscribe(() => {
    const state = store.getState();
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(state.cartReducer));
    } catch {
      /* ignore */
    }
    try {
      window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(state.wishlistReducer));
    } catch {
      /* ignore */
    }
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
