import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { BasketProvider } from "@/context/BasketContext";
import LoginModal from "@/components/ui/loginModal";
import CartDrawer from "@/components/ui/cartDrawer";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Pelangi 2 — Toko Pakaian Ketapang",
  description: "Toko pakaian terpercaya di Ketapang sejak lebih dari 10 tahun.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${jakarta.variable} ${inter.variable}`}>
      <body className="antialiased">
        <AuthProvider>
          <BasketProvider>
            {children}
            <LoginModal />
            <CartDrawer />
          </BasketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
