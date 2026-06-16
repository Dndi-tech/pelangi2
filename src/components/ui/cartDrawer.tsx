"use client";

import { useBasket } from "@/context/BasketContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import clsx from "clsx";

function formatRp(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export default function CartDrawer() {
  const {
    items,
    totalItems,
    totalPrice,
    isBasketOpen,
    closeBasket,
    removeItem,
    updateQuantity,
    clear,
  } = useBasket();
  const { user, openModal } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Lock body scroll + Escape-to-close while drawer is open.
  useEffect(() => {
    if (!isBasketOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeBasket();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isBasketOpen, closeBasket]);

  const handleCheckout = async () => {
    setCheckoutError(null);

    // If not logged in, prompt login first. The user can checkout after.
    if (!user) {
      openModal();
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        // Session expired between page load and checkout click.
        openModal();
        return;
      }

      if (!response.ok) {
        // Server validation rejected something. data.error is either a
        // string (our service errors) or a zod flatten() object.
        const message =
          typeof data.error === "string"
            ? data.error
            : "Checkout gagal. Periksa kembali keranjang Anda.";
        setCheckoutError(message);
        return;
      }

      // Success — close the drawer, navigate to confirmation page,
      // then clear the basket. Order matters: don't clear before
      // navigation triggers, or the user loses their cart on failure.
      closeBasket();
      router.push(`/orders/${data.order.id}`);
      clear();
    } catch {
      setCheckoutError("Network error. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop — click to dismiss */}
      <button
        type="button"
        aria-label="Tutup keranjang"
        onClick={closeBasket}
        className={clsx(
          "fixed inset-0 z-[150] bg-black/50 transition-opacity",
          isBasketOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Keranjang belanja"
        className={clsx(
          "fixed top-0 right-0 z-[160] h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300",
          isBasketOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8DDD0]">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#1A110A]">
              Keranjang
            </h3>
            <p className="text-[0.7rem] tracking-wider uppercase text-[#7C6E62]">
              {totalItems} item
            </p>
          </div>
          <button
            type="button"
            onClick={closeBasket}
            className="w-8 h-8 flex items-center justify-center text-[#7C6E62] hover:bg-[#F5EFE6]"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-2">
              <span className="text-4xl opacity-40">🛒</span>
              <p className="text-sm text-[#7C6E62]">
                Keranjang Anda masih kosong.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#E8DDD0]">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.size}`}
                  className="flex gap-3 p-4"
                >
                  <div className="w-16 h-20 bg-[#F5EFE6] flex items-center justify-center text-[0.55rem] tracking-widest uppercase text-[#7C6E62]/60 flex-shrink-0">
                    Foto
                  </div>
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A110A] line-clamp-2">
                      {item.name}
                    </p>
                    <p className="text-[0.65rem] tracking-wider uppercase text-[#7C6E62]">
                      Ukuran: {item.size}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center border border-[#E8DDD0]">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.size,
                              item.quantity - 1
                            )
                          }
                          className="w-7 h-7 flex items-center justify-center text-[#7C6E62] hover:bg-[#F5EFE6]"
                          aria-label="Kurangi"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-xs font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.size,
                              item.quantity + 1
                            )
                          }
                          className="w-7 h-7 flex items-center justify-center text-[#7C6E62] hover:bg-[#F5EFE6]"
                          aria-label="Tambah"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-bold text-[#1A110A]">
                        {formatRp(item.priceAtAdd * item.quantity)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId, item.size)}
                    className="text-[#7C6E62] hover:text-red-600 text-sm self-start"
                    aria-label="Hapus item"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#E8DDD0] px-5 py-4 flex flex-col gap-3">
            <div className="flex justify-between items-baseline">
              <span className="text-[0.7rem] tracking-wider uppercase text-[#7C6E62]">
                Subtotal
              </span>
              <span className="text-lg font-bold text-[#1A110A]">
                {formatRp(totalPrice)}
              </span>
            </div>
            {checkoutError && (
              <p role="alert" className="text-xs text-red-600 text-center">
                {checkoutError}
              </p>
            )}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={submitting}
              className="py-3 bg-red-600 text-white text-sm font-semibold tracking-wide hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Memproses..." : "Lanjut ke Pembayaran"}
            </button>
            <button
              type="button"
              onClick={clear}
              className="text-[0.7rem] tracking-wider uppercase text-[#7C6E62] hover:text-red-600"
            >
              Kosongkan Keranjang
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
