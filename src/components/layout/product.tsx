"use client";

import { products } from "@/data/product";
import { Product } from "@/types/product";
import { useAuth } from "@/context/AuthContext";
import { getProductPromotion, resolveDisplayPrice } from "@/data/promotion";
import { useState } from "react";

// --Badge config

const badgeStyles: Record<string, string> = {
  Diskon: "bg-red-500 text-white",
  Baru: "bg-[#1A110A] text-white",
  Terlaris: "bg-amber-500 text-white",
  Spesial: "bg-[#2D6A4F] text-white",
};
const cardColors: Record<string, string> = {
  male: "bg-[#D2C3B0]",
  female: "bg-[#B8C4CC]",
  uniform: "bg-[#C4B8C8]",
};

function formatRp(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function useBasket(): { addItem: any } {
  throw new Error("Function not implemented.");
}
function ProductCard({ product }: { product: Product }) {
  // const { user, openModal } = useAuth();
  // const { addItem } = useBasket();

  // const handleAddToCart = () => {
  //   if (!user) {
  //     openModal();
  //     return;
  //   }
  //   addItem(product);
  // };
  const promo = getProductPromotion(product.id);
  const { displayPrice, originalPrice, isOnSale, discountPercent } =
    resolveDisplayPrice(product.price, product.id);
  return (
    <div className="group flex flex-col bg-white border border-[#E8DDD0] hoverL-translate-y-1 hover:shadow-lg transition-all duration-200">
      <div
        className={`relative aspect-[3/4] ${cardColors[product.category]}
                       flex items-center justify-center overflow-hidden`}
      >
        <span
          className="text-[0.6rem] tracking-[3px] uppercase
                         text-black/20 font-semibold select-none"
        >
          Foto Produk
        </span>
        {promo && (
          <span
            className={`absolute top-2.5 left-2.5
                            px-2 py-0.5 text-[0.62rem]
                            font-bold tracking-wider uppercase
                            ${badgeStyles[promo.badge]}`}
          >
            {promo.badge === "Diskon" && promo.discountPercent
              ? `Diskon ${promo.discountPercent}%`
              : promo.badge}
          </span>
        )}
        <div
          className="absolute bottom-0 left-0 right-0
                        flex gap-1.5 p-2.5
                        translate-y-full group-hover:translate-y-0
                        transition-transform duration-200
                        bg-gradient-to-t from-black/70 to-transparent"
        >
          <button
            // onClick={handleAddToCart}
            className="flex-1 py-2 bg-red-600 text-white
                       text-xs font-semibold tracking-wide
                       hover:bg-red-700 transition-colors"
          >
            + Keranjang
          </button>
          <button
            className="w-9 bg-white/15 border border-white/25
                             text-white text-sm flex items-center
                             justify-center hover:bg-white/25
                             transition-colors"
          >
            ♡
          </button>
        </div>
      </div>
      {/* PRODUCT INFO
          All fields map directly to your Product type —
          no changes needed when backend is connected         */}
      <div className="flex flex-col gap-1.5 p-3.5 border-t border-[#E8DDD0]">
        {/* Category + Brand */}
        <p
          className="text-[0.65rem] font-semibold tracking-[1.5px]
                      uppercase text-[#7C6E62]"
        >
          {product.category === "men"
            ? "Pria"
            : product.category === "women"
            ? "Wanita"
            : "Seragam"}
          {product.brand && ` · ${product.brand}`}
        </p>

        {/* Name */}
        <p
          className="text-[0.86rem] font-semibold text-[#1A110A]
                      leading-snug line-clamp-2"
        >
          {product.name}
        </p>

        {/* Price row */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-baseline gap-1.5">
            {/* Crossed out — only when actually on sale */}
            {isOnSale && originalPrice && (
              <span className="text-xs text-[#7C6E62] line-through">
                {formatRp(originalPrice)}
              </span>
            )}

            <span
              className={`text-sm font-bold ${
                isOnSale ? "text-red-600" : "text-[#1A110A]"
              }`}
            >
              {formatRp(displayPrice)}
            </span>
          </div>

          <span className="text-[0.65rem] text-[#7C6E62]">
            {product.sizes.slice(0, 4).join(" · ")}
            {product.sizes.length > 4 && "..."}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ProductSection() {
  // const { openModal } = useAuth();
  const [showAll, setShowAll] = useState(false);
  const DESKTOP_INITIAL = 8;
  const visibleProducts = showAll
    ? products
    : products.slice(0, DESKTOP_INITIAL);

  const hasMore = products.length > DESKTOP_INITIAL;
  const MOBILE_INITIAL = 4;
  return (
    <section className="w-full bg-white py-16">
      <div className="max-w-screen-2xl mx-auto px-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-10">
          <span
            className="text-[0.68rem] font-semibold tracking-[4px]
                           uppercase text-amber-600"
          >
            Pilihan Terpopuler
          </span>

          <h2 className="font-serif text-3xl font-bold text-[#1A110A]">
            Rekomendasi Produk
          </h2>

          {/* Decorative rule */}
          <div className="flex items-center gap-4 w-48">
            <div className="flex-1 h-px bg-[#E8DDD0]" />
            <span
              className="text-[0.65rem] tracking-[3px] uppercase
                             text-[#7C6E62]"
            >
              untuk kamu
            </span>
            <div className="flex-1 h-px bg-[#E8DDD0]" />
          </div>

          <p className="text-sm text-[#7C6E62] max-w-md leading-relaxed">
            Dari seragam sekolah lengkap hingga pakaian kasual sehari-hari
          </p>
        </div>

        {/* Grid
            Backend transition: replace `products` with fetched data
            Everything else stays exactly the same               */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products
            .slice(0, showAll ? undefined : DESKTOP_INITIAL)
            .map((product, index) => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="px-10 py-3 bg-red-600 text-white text-sm
                         font-semibold tracking-wide
                         hover:bg-red-700 transition-colors"
            >
              {showAll ? "Tampilkan Lebih Sedikit ↑" : "Lihat Semua Produk →"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
