import Link from "next/link";
import { CategoryStripView } from "@/components/home/CategoryStripView";
import { getAllCategories } from "@/lib/catalog";

const tones: Record<string, string> = {
  skincare: "linear-gradient(145deg, #E8D5D8, #5C3A5E)",
  "body-care": "linear-gradient(145deg, #E9DFD6, #8B5E4B)",
  "hair-care": "linear-gradient(145deg, #D4B5B8, #1A121C)",
  makeup: "linear-gradient(145deg, #F2D6D8, #6B4A42)",
};

export async function CategoryStrip() {
  const categories = await getAllCategories();

  return (
    <CategoryStripView
      categories={categories.map((cat) => ({
        slug: cat.slug,
        name: cat.name,
        nameAr: cat.nameAr,
        tagline: cat.tagline,
        taglineAr: cat.taglineAr,
        tone: tones[cat.slug] ?? tones.skincare,
      }))}
    />
  );
}
