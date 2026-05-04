"use client";
import { NAV_LINKS } from "@/lib/constant";
import { useState } from "react";
import clsx from "clsx";
export default function Navbar() {
  // const { user, openModal, logout } = useAuth();
  const Nav_link = NAV_LINKS;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <nav className="sticky w-full lg:py-5  top-0 left-0.5 bg-white  border-b-black">
      <div className="mx-auto 3xl:px-0 px-10 max-w-screen-3xl hidden lg:flex flex-row items-center justify-between ">
        <a href="" className="flex flex-row   ">
          <a href="" className="flex items-center gap-2">
            <span className="h-fit text-3xl">🌈</span>
            <div className="flex flex-col font-serif     ">
              <span>PELANGI²</span>
              <span>TOKO PAKAIAN</span>
            </div>
          </a>
        </a>

        <div className="flex gap-5 items-center font-serif text-lg">
          {Nav_link.map((link) => (
            <a className="text-center" key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex gap-5">
          <button className="py-2 px-3 rounded-xl border-red-500 border cursor-pointer">
            <span className="text-red-400">Masuk</span>
          </button>
          <button className="py-2 px-3 rounded-xl bg-red-500 border-white cursor-pointer">
            <span className="text-white">Lihat Katalog</span>
          </button>
        </div>
      </div>
      <div className="lg:hidden   fixed transition-200 right-0 top-0 z-[100] py-5">
        <a href="" className="flex items-center gap-2 fixed left-5 top-5">
          <span className="h-fit text-xl">🌈</span>
          <div className="flex flex-col font-serif  text-xs   ">
            <span>PELANGI²</span>
            <span>TOKO PAKAIAN</span>
          </div>
        </a>
        <button
          className="mr-5 ml-auto  "
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? "X" : "V"}
        </button>
      </div>
      <div
        className={clsx(
          "lg:hidden fixed  w-screen  transition-all duration-300 font-sans flex flex-col items-center h-screen justify-center bg-white  gap-2",
          isMenuOpen ? "top-0" : "-top-full"
        )}
      >
        <a href="" className="lg:flex flex-row hidden ">
          <div className="flex items-center gap-2">
            <span>🌈</span>
            <div className="flex flex-col">
              <span>PELANGI²</span>
              <span>TOKO PAKAIAN</span>
            </div>
          </div>
        </a>
        <div className="flex flex-col gap-2">
          {Nav_link.map((link) => (
            <a className="text-center" key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <button className="py-2 px-3 rounded-xl border-red-500 cursor-pointer">
            <span className="text-red-400">Masuk</span>
          </button>
          <button className="py-2 px-3 rounded-xl bg-red-500 border-white cursor-pointer">
            <span className="text-white">Lihat Katalog</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
