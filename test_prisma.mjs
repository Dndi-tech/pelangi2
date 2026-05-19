import { PrismaClient } from './src/generated/prisma/client/index.js';
const prisma = new PrismaClient();
try {
  const products = await prisma.product.findMany();
  console.log('SUCCESS — found', products.length, 'products');
  console.log('First product name:', products[0]?.name);
} catch (e) {
  console.error('FAILED:', e.message);
} finally {
  await prisma.$disconnect();
}
