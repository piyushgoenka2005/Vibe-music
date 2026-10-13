import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const products = await p.product.findMany({
  where: { name: { contains: "Nord Stage 4 88-Key Performance Keyboard" } },
  select: { id: true, slug: true, name: true, stockQuantity: true },
});
console.log(JSON.stringify(products, null, 2));
await p.$disconnect();
