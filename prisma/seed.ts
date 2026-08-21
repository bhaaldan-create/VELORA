import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { categories } from "../src/data/categories";
import { products } from "../src/data/products";

const url = process.env.DATABASE_URL;
if (!url || url.startsWith("file:")) {
  throw new Error(
    "عيّني DATABASE_URL إلى PostgreSQL قبل الـ seed (انظر .env.example).",
  );
}

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding VELORA catalog…");

  for (const [index, category] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        slug: category.slug,
        name: category.name,
        nameAr: category.nameAr,
        description: category.description,
        descriptionAr: category.descriptionAr,
        tagline: category.tagline,
        taglineAr: category.taglineAr,
        sortOrder: index,
      },
      update: {
        name: category.name,
        nameAr: category.nameAr,
        description: category.description,
        descriptionAr: category.descriptionAr,
        tagline: category.tagline,
        taglineAr: category.taglineAr,
        sortOrder: index,
      },
    });
  }

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      create: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        nameAr: product.nameAr,
        categorySlug: product.category,
        price: product.price,
        currency: product.currency,
        description: product.description,
        descriptionAr: product.descriptionAr,
        benefitsJson: product.benefits,
        benefitsArJson: product.benefitsAr,
        ingredientsJson: product.ingredients,
        concernsJson: product.concerns,
        size: product.size,
        isBestseller: !!product.isBestseller,
        isNew: !!product.isNew,
        rating: product.rating,
        reviews: product.reviews,
        imageTone: product.imageTone,
        imageUrl: product.imageUrl ?? null,
        stock: 100,
        isActive: true,
      },
      update: {
        slug: product.slug,
        name: product.name,
        nameAr: product.nameAr,
        categorySlug: product.category,
        price: product.price,
        currency: product.currency,
        description: product.description,
        descriptionAr: product.descriptionAr,
        benefitsJson: product.benefits,
        benefitsArJson: product.benefitsAr,
        ingredientsJson: product.ingredients,
        concernsJson: product.concerns,
        size: product.size,
        isBestseller: !!product.isBestseller,
        isNew: !!product.isNew,
        rating: product.rating,
        reviews: product.reviews,
        imageTone: product.imageTone,
        imageUrl: product.imageUrl ?? null,
        isActive: true,
      },
    });
  }

  const counts = {
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
