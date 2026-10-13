import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
async function main() {
  const items = await p.homepageSectionItem.findMany({
    where: {
      OR: [
        { categorySlug: 'amplifiers' },
        { customTitle: { contains: 'Amplifier' } },
        { id: { contains: 'amplifier' } },
      ],
    },
  });
  console.log('Matching section items:', JSON.stringify(items, null, 2));
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
