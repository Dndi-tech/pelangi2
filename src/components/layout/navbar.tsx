"use client";
import { NAV_LINKS } from "@/lib/constant";
import { useState } from "react";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { useBasket } from "@/context/BasketContext";

function CartButton({ onClick, count }: { onClick: () => void; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-10 h-10 flex items-center justify-center border border-[#E8DDD0] rounded-xl hover:bg-[#F5EFE6] cursor-pointer"
      aria-label={`Keranjang (${count} item)`}
    >
      <span className="text-lg">🛒</span>
      {count > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1
                     bg-red-600 text-white text-[0.6rem] font-bold rounded-full
                     flex items-center justify-center"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

function AuthArea({ compact = false }: { compact?: boolean }) {
  const { user, openModal, logout } = useAuth();

  if (user) {
    return (
      <div className={clsx("flex gap-2 items-center", compact && "flex-col")}>
        <span className="text-sm text-[#1A110A] font-medium truncate max-w-[120px]">
          Halo, {user.name.split(" ")[0]}
        </span>
        <button
          type="button"
          onClick={logout}
          className="py-2 px-3 rounded-xl border border-[#E8DDD0] hover:bg-[#F5EFE6] cursor-pointer text-sm text-[#7C6E62]"
        >
          Keluar
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={openModal}
      className="py-2 px-3 rounded-xl border-red-500 border cursor-pointer hover:bg-red-50"
    >
      <span className="text-red-400">Masuk</span>
    </button>
  );
}

export default function Navbar() {
  const Nav_link = NAV_LINKS;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { totalItems, openBasket } = useBasket();

  const handleCartOpen = () => {
    openBasket();
    setIsMenuOpen(false);
  };

  return (
    <nav className="sticky w-full lg:py-5 top-0 left-0.5 bg-white border-b-black z-[100]">
      {/* Desktop */}
      <div className="mx-auto 3xl:px-0 px-10 max-w-screen-3xl hidden lg:flex flex-row items-center justify-between">
        <div className="flex flex-row">
          <a href="" className="flex items-center gap-2">
            <span className="h-fit text-3xl">🌈</span>
            <div className="flex flex-col font-serif">
              <span>PELANGI²</span>
              <span>TOKO PAKAIAN</span>
            </div>
          </a>
        </div>

        <div className="flex gap-5 items-center font-serif text-lg">
          {Nav_link.map((link) => (
            <a className="text-center" key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex gap-3 items-center">
          <AuthArea />
          <CartButton onClick={handleCartOpen} count={totalItems} />
          <button className="py-2 px-3 rounded-xl bg-red-500 border-white cursor-pointer">
            <span className="text-white">Lihat Katalog</span>
          </button>
        </div>
      </div>

      {/* Mobile header bar */}
      <div className="lg:hidden fixed transition-200 right-0 top-0 z-[100] py-5 w-full flex items-center justify-between px-5 bg-white">
        <a href="" className="flex items-center gap-2">
          <span className="h-fit text-xl">🌈</span>
          <div className="flex flex-col font-serif text-xs">
            <span>PELANGI²</span>
            <span>TOKO PAKAIAN</span>
          </div>
        </a>
        <div className="flex items-center gap-2">
          <CartButton onClick={handleCartOpen} count={totalItems} />
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-10 h-10 flex items-center justify-center"
            aria-label="Menu"
          >
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile slide-in menu */}
      <div
        className={clsx(
          "lg:hidden fixed w-screen transition-all duration-300 font-sans flex flex-col items-center h-screen justify-center bg-white gap-4 z-[90]",
          isMenuOpen ? "top-0" : "-top-full"
        )}
      >
        <div className="flex flex-col gap-2">
          {Nav_link.map((link) => (
            <a
              className="text-center"
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex flex-col gap-2 items-center">
          <AuthArea compact />
          <button className="py-2 px-3 rounded-xl bg-red-500 border-white cursor-pointer">
            <span className="text-white">Lihat Katalog</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
