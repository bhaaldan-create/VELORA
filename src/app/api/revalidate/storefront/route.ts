import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { CACHE_TAGS } from "@/lib/cache-tags";

export const runtime = "nodejs";

/**
 * تفريغ كاش المتجر فوراً بعد نشر إصلاحات الكتالوج.
 * محمي بـ REVALIDATE_SECRET أو CRON_SECRET.
 */
export async function POST(req: Request) {
  const secret =
    process.env.REVALIDATE_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "";
  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const q = new URL(req.url).searchParams.get("secret");
  if (!secret || (auth !== secret && q !== secret)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const now = { expire: 0 } as const;
  revalidateTag(CACHE_TAGS.catalog, now);
  revalidateTag(CACHE_TAGS.products, now);
  revalidateTag(CACHE_TAGS.categories, now);
  revalidateTag(CACHE_TAGS.home, now);
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/search");
  revalidatePath("/shop/[slug]", "page");

  return NextResponse.json({ ok: true, revalidated: true, at: Date.now() });
}

export async function GET(req: Request) {
  return POST(req);
}
