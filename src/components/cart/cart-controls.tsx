"use client";
import Link from "next/link";
import { useCart, type CartItem } from "./cart-provider";
export function AddToCartButton({ item }: { item: CartItem }) {
  const { addItem } = useCart();
  return (
    <button
      type="button"
      onClick={() => addItem(item)}
      className="bg-primary rounded-lg px-4 py-2.5 text-sm font-bold text-white"
    >
      Add to Cart
    </button>
  );
}
export function CartIndicator() {
  const { itemCount, hydrated } = useCart();
  return (
    <Link
      href="/cart"
      aria-label={`Cart${hydrated ? `, ${itemCount} items` : ""}`}
      className="rounded-lg border border-white/20 px-3 py-2 text-sm font-bold text-white"
    >
      Cart{" "}
      {hydrated && itemCount > 0 && (
        <span className="bg-primary ml-1 rounded-full px-1.5 text-white">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
