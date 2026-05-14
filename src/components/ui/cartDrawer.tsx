"use client";

import { useBasket } from "@/context/BasketContext";
import { useEffect } from "react";
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

  return (
    <>
      {/* Backdrop */}
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
            <button
              type="button"
              onClick={() => {
                // TODO Phase 2: POST /api/orders
                alert("Checkout akan tersedia setelah backend terhubung.");
              }}
              className="py-3 bg-red-600 text-white text-sm font-semibold tracking-wide hover:bg-red-700 transition-colors"
            >
              Lanjut ke Pembayaran
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
