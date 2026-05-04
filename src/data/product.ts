import { Product } from "@/types/product";

export const products: Product[] = [
  // ─── MALE (4) ───────────────────────────────────────────
  {
    id: "1",
    name: "Kemeja Batik Kawung Lengan Panjang",
    category: "men",
    brand: "Batik Nusantara",
    price: 230000,
    sizes: ["M", "L", "XL", "XXL"],
    images: ["/images/male-batik-kawung.jpg"],
    createdAt: "2025-03-10",
  },
  {
    id: "2",
    name: "Kaos Polos Cotton Combed 30s Pria",
    category: "men",
    price: 75000,
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: ["/images/male-kaos-polos.jpg"],
    createdAt: "2024-03-10",
  },
  {
    id: "3",
    name: "Kemeja Formal Slim Fit Lengan Panjang",
    category: "men",
    brand: "FormaLook",
    price: 195000,
    sizes: ["S", "M", "L", "XL"],
    images: ["/images/male-kaos-formal.jpg"],
    createdAt: "2024-03-10",
  },
  {
    id: "4",
    name: "Celana lepis Pria Stretch",
    category: "men",
    brand: "UrbanWear",
    price: 210000,

    sizes: ["30", "32", "34", "36", "38"],
    images: ["/images/celana-lepis-chino.jpg"],
    createdAt: "2024-03-10",
  },
  {
    id: "5",
    name: "Celana Chino Pria Stretch",
    category: "men",
    brand: "UrbanWear",
    price: 210000,

    sizes: ["30", "32", "34", "36", "38"],
    images: ["/images/celana-chino.jpg"],
    createdAt: "2024-03-10",
  },

  // ─── FEMALE (4) ─────────────────────────────────────────
  {
    id: "6",
    name: "Dress Midi Batik Motif Parang",
    category: "women",
    brand: "Batik Nusantara",
    price: 275000,
    sizes: ["S", "M", "L", "XL"],
    images: ["/images/male-kaos-batik.jpg"],
    createdAt: "2024-03-10",
  },
  {
    id: "7",
    name: "Blouse Katun Lengan Puff",
    category: "women",
    brand: "LemariKita",
    price: 145000,
    sizes: ["XS", "S", "M", "L"],
    images: ["/images/male-kaos-blouse.jpg"],
    createdAt: "2025-03-10",
  },
  {
    id: "8",
    name: "Rok Batik Lilit Panjang",
    category: "women",
    brand: "Batik Nusantara",
    price: 175000,
    sizes: ["S", "M", "L", "XL"],
    images: ["/images/rok.jpg"],
    createdAt: "2024-03-10",
  },
  {
    id: "9",
    name: "Celana Kulot Wanita High Waist",
    category: "women",
    brand: "LemariKita",
    price: 155000,

    sizes: ["S", "M", "L", "XL"],

    images: ["/images/kulot.jpg"],
    createdAt: "2024-03-10",
  },

  // ─── UNIFORM (4) ────────────────────────────────────────
  {
    id: "10",
    name: "Seragam Putih Merah SD Lengkap",
    category: "school",
    price: 185000,
    sizes: ["S", "M", "L", "XL"],

    images: ["/images/seragam-putih-merah.jpg"],
    createdAt: "2024-03-10",
  },
  {
    id: "11",
    name: "Seragam Putih Biru SMP Set",
    category: "school",
    price: 210000,

    sizes: ["S", "M", "L", "XL"],
    images: ["/images/seragam-putih-biru.jpg"],
    createdAt: "2024-03-10",
  },
  {
    id: "12",
    name: "Seragam Abu-abu Putih SMA Set",
    category: "school",
    price: 240000,
    sizes: ["S", "M", "L", "XL"],
    images: ["/images/seragam-abu.jpg"],
    createdAt: "2024-03-10",
  },
  {
    id: "13",
    name: "Seragam Batik Sekolah Custom",
    category: "school",
    brand: "Batik Nusantara",
    price: 195000,
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: ["/images/seragam-batik.jpg"],
    createdAt: "2024-03-10",
  },
];
