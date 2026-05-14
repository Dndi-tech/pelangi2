"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  ReactNode,
} from "react";
import type { Product } from "@/types/product";

const STORAGE_KEY = "pelangi2.basket.v1";

export type BasketItem = {
  productId: string;
  name: string;
  category: Product["category"];
  size: string;
  image?: string;
  priceAtAdd: number; // snapshot — price user agreed to when adding
  quantity: number;
};

type BasketState = {
  items: BasketItem[];
};

type Action =
  | { type: "HYDRATE"; payload: BasketState }
  | { type: "ADD"; payload: BasketItem }
  | { type: "REMOVE"; payload: { productId: string; size: string } }
  | {
      type: "UPDATE_QTY";
      payload: { productId: string; size: string; quantity: number };
    }
  | { type: "CLEAR" };

// Same product in different sizes = different line items.
// This matches how real fashion e-commerce stores work.
const lineKey = (productId: string, size: string) => `${productId}::${size}`;

function reducer(state: BasketState, action: Action): BasketState {
  switch (action.type) {
    case "HYDRATE":
      return action.payload;

    case "ADD": {
      const incoming = action.payload;
      const key = lineKey(incoming.productId, incoming.size);
      const existing = state.items.find(
        (i) => lineKey(i.productId, i.size) === key
      );

      if (existing) {
        return {
          items: state.items.map((i) =>
            lineKey(i.productId, i.size) === key
              ? { ...i, quantity: i.quantity + incoming.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, incoming] };
    }

    case "REMOVE": {
      const key = lineKey(action.payload.productId, action.payload.size);
      return {
        items: state.items.filter((i) => lineKey(i.productId, i.size) !== key),
      };
    }

    case "UPDATE_QTY": {
      const { productId, size, quantity } = action.payload;
      const key = lineKey(productId, size);
      if (quantity <= 0) {
        return {
          items: state.items.filter((i) => lineKey(i.productId, i.size) !== key),
        };
      }
      return {
        items: state.items.map((i) =>
          lineKey(i.productId, i.size) === key ? { ...i, quantity } : i
        ),
      };
    }

    case "CLEAR":
      return { items: [] };

    default:
      return state;
  }
}

type BasketContextType = {
  items: BasketItem[];
  totalItems: number;
  totalPrice: number;
  isBasketOpen: boolean;
  openBasket: () => void;
  closeBasket: () => void;
  addItem: (item: Omit<BasketItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clear: () => void;
};

const BasketContext = createContext<BasketContextType | null>(null);

export function BasketProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });
  const [isBasketOpen, setIsBasketOpen] = useState(false);

  // Render counter tracks commits without triggering re-renders.
  // Commit 1 = empty initial state → load from storage, skip persist.
  // Commit 2+ = post-hydration → persist.
  // This avoids a setState-in-effect (React 19 lints against that) and the
  // first-render overwrite bug you'd get with a naive "loaded" boolean.
  const commitCountRef = useRef(0);

  useEffect(() => {
    commitCountRef.current += 1;

    if (commitCountRef.current === 1) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as BasketState;
          if (parsed && Array.isArray(parsed.items)) {
            dispatch({ type: "HYDRATE", payload: parsed });
          }
        }
      } catch {
        // Corrupted storage — ignore and start fresh.
      }
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or disabled — fail silently.
    }
  }, [state]);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = state.items.reduce(
    (sum, i) => sum + i.priceAtAdd * i.quantity,
    0
  );

  const value: BasketContextType = {
    items: state.items,
    totalItems,
    totalPrice,
    isBasketOpen,
    openBasket: () => setIsBasketOpen(true),
    closeBasket: () => setIsBasketOpen(false),
    addItem: (item) =>
      dispatch({
        type: "ADD",
        payload: { ...item, quantity: item.quantity ?? 1 },
      }),
    removeItem: (productId, size) =>
      dispatch({ type: "REMOVE", payload: { productId, size } }),
    updateQuantity: (productId, size, quantity) =>
      dispatch({ type: "UPDATE_QTY", payload: { productId, size, quantity } }),
    clear: () => dispatch({ type: "CLEAR" }),
  };

  return (
    <BasketContext.Provider value={value}>{children}</BasketContext.Provider>
  );
}

export function useBasket() {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error("useBasket must be used inside BasketProvider");
  return ctx;
}
