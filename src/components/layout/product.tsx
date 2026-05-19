import { Product } from "@/types/product";
import { prisma } from "@/lib/prisma";
import { getProductPromotion, resolveDisplayPrice } from "@/data/promotion";
import ProductGrid from "./productGrid";

function toViewModel(
  p: Awaited<ReturnType<typeof prisma.product.findMany>>[number]
): Product {
  return {
    id: p.id,
    name: p.name,
    category: p.category as Product["category"],
    brand: p.brand ?? undefined,
    price: p.price,
    sizes: p.sizes as string[],
    images: p.images as string[],
    description: p.description ?? undefined,
    createdAt: p.createdAt.toISOString(),
  };
}

export default async function ProductSection() {
  const dbProducts = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  const products = dbProducts.map(toViewModel);

  return (
    <section className="w-full bg-white py-16">
      <div className="max-w-screen-2xl mx-auto px-10">
        <div className="flex flex-col items-center text-center gap-3 mb-10">
          <span className="text-[0.68rem] font-semibold tracking-[4px] uppercase text-amber-600">
            Pilihan Terpopuler
          </span>
          <h2 className="font-serif text-3xl font-bold text-[#1A110A]">
            Rekomendasi Produk
          </h2>
          <div className="flex items-center gap-4 w-48">
            <div className="flex-1 h-px bg-[#E8DDD0]" />
            <span className="text-[0.65rem] tracking-[3px] uppercase text-[#7C6E62]">
              untuk kamu
            </span>
            <div className="flex-1 h-px bg-[#E8DDD0]" />
          </div>
          <p className="text-sm text-[#7C6E62] max-w-md leading-relaxed">
            Dari seragam sekolah lengkap hingga pakaian kasual sehari-hari
          </p>
        </div>

        <ProductGrid products={products} />
      </div>
    </section>
  );
}
