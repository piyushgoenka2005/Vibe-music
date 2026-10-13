import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();

async function main() {
  const srcImage = path.join(process.cwd(), 'public', 'Hertz Amplifiers in a Warm Studio.png');
  const dstImage = path.join(process.cwd(), 'public', 'images', 'browse-categories', 'amplifiers.jpg');

  if (fs.existsSync(srcImage)) {
    fs.copyFileSync(srcImage, dstImage);
    console.log(`Copied ${srcImage} to ${dstImage}`);
  } else {
    console.warn(`Source image ${srcImage} does not exist!`);
  }

  const updated = await prisma.homepageSectionItem.updateMany({
    where: {
      sectionKey: 'browse_by_categories',
      categorySlug: 'amplifiers',
    },
    data: {
      customImage: '/Hertz Amplifiers in a Warm Studio.png',
      updatedAt: new Date().toISOString(),
    },
  });

  console.log(`Updated ${updated.count} DB rows in homepageSectionItem.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
