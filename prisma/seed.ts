import { Category, PrismaClient } from "@/generated/prisma/client";
import { products } from "@/data/product";

const prisma = new PrismaClient();

async function main() {
  await prisma.product.deleteMany();
  const data = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category as Category,
    brand: p.brand,
    price: p.price,
    sizes: p.sizes,
    images: p.images,
    description: p.description,
    createdAt: new Date(p.createdAt),
  }));
  await prisma.product.createMany({ data });
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
