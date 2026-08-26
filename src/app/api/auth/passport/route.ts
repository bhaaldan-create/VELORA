import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  CUSTOMER_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";
import {
  getPassportForCustomer,
  markPassportOpened,
} from "@/lib/passport/ensure";
import { IRAQ_GOVERNORATES } from "@/lib/passport/governorates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireCustomerId() {
  const jar = await cookies();
  const session = await verifyCustomerSessionToken(
    jar.get(CUSTOMER_COOKIE)?.value,
  );
  return session?.customerId ?? null;
}

/** GET /api/auth/passport — full Passport payload */
export async function GET() {
  try {
    const customerId = await requireCustomerId();
    if (!customerId) {
      return Response.json(
        { ok: false, error: "يجب تسجيل الدخول أولاً." },
        { status: 401 },
      );
    }

    const passport = await getPassportForCustomer(customerId);
    if (!passport) {
      return Response.json(
        { ok: false, error: "تعذّر تجهيز الجواز." },
        { status: 404 },
      );
    }

    return Response.json({ ok: true, passport });
  } catch (error) {
    console.error("[auth/passport GET]", error);
    return Response.json(
      { ok: false, error: "تعذّر تحميل الجواز." },
      { status: 500 },
    );
  }
}

const patchSchema = z.object({
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  governorate: z
    .string()
    .refine(
      (v) => !v || IRAQ_GOVERNORATES.some((g) => g.id === v),
      "محافظة غير صالحة",
    )
    .nullable()
    .optional(),
  avatarUrl: z.string().max(2_000_000).nullable().optional(),
  markOpened: z.boolean().optional(),
  beautyProfile: z
    .object({
      skinType: z.string().max(40).optional(),
      skinConcerns: z.array(z.string().max(40)).max(12).optional(),
      beautyGoals: z.array(z.string().max(40)).max(12).optional(),
      makeupStyle: z.string().max(40).optional(),
      preferredFinish: z.string().max(40).optional(),
      favoriteCategories: z.array(z.string().max(40)).max(12).optional(),
      preferredBrands: z.array(z.string().max(80)).max(20).optional(),
    })
    .optional(),
});

/** PATCH /api/auth/passport — identity + beauty profile updates */
export async function PATCH(req: Request) {
  try {
    const customerId = await requireCustomerId();
    if (!customerId) {
      return Response.json(
        { ok: false, error: "يجب تسجيل الدخول أولاً." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "بيانات غير صالحة." },
        { status: 400 },
      );
    }

    const data = parsed.data;

    if (data.markOpened) {
      await markPassportOpened(customerId);
    }

    const customerData: {
      dateOfBirth?: Date | null;
      governorate?: string | null;
      avatarUrl?: string | null;
    } = {};
    if (data.dateOfBirth !== undefined) {
      customerData.dateOfBirth = data.dateOfBirth
        ? new Date(`${data.dateOfBirth}T12:00:00.000Z`)
        : null;
    }
    if (data.governorate !== undefined) {
      customerData.governorate = data.governorate || null;
    }
    if (data.avatarUrl !== undefined) {
      // Reject huge data URIs at API boundary (OOM safety)
      if (
        data.avatarUrl &&
        data.avatarUrl.startsWith("data:") &&
        data.avatarUrl.length > 400_000
      ) {
        return Response.json(
          { ok: false, error: "الصورة كبيرة جداً. اختاري صورة أصغر." },
          { status: 400 },
        );
      }
      customerData.avatarUrl = data.avatarUrl;
    }

    if (Object.keys(customerData).length) {
      await prisma.customer.update({
        where: { id: customerId },
        data: customerData,
      });
    }

    if (data.beautyProfile) {
      const bp = data.beautyProfile;
      await prisma.veloraBeautyProfile.upsert({
        where: { customerId },
        create: {
          customerId,
          skinType: bp.skinType ?? "",
          skinConcernsJson: bp.skinConcerns ?? [],
          beautyGoalsJson: bp.beautyGoals ?? [],
          makeupStyle: bp.makeupStyle ?? "",
          preferredFinish: bp.preferredFinish ?? "",
          favoriteCategoriesJson: bp.favoriteCategories ?? [],
          preferredBrandsJson: bp.preferredBrands ?? [],
        },
        update: {
          ...(bp.skinType !== undefined ? { skinType: bp.skinType } : {}),
          ...(bp.skinConcerns !== undefined
            ? { skinConcernsJson: bp.skinConcerns }
            : {}),
          ...(bp.beautyGoals !== undefined
            ? { beautyGoalsJson: bp.beautyGoals }
            : {}),
          ...(bp.makeupStyle !== undefined
            ? { makeupStyle: bp.makeupStyle }
            : {}),
          ...(bp.preferredFinish !== undefined
            ? { preferredFinish: bp.preferredFinish }
            : {}),
          ...(bp.favoriteCategories !== undefined
            ? { favoriteCategoriesJson: bp.favoriteCategories }
            : {}),
          ...(bp.preferredBrands !== undefined
            ? { preferredBrandsJson: bp.preferredBrands }
            : {}),
        },
      });
    }

    const passport = await getPassportForCustomer(customerId);
    return Response.json({ ok: true, passport });
  } catch (error) {
    console.error("[auth/passport PATCH]", error);
    return Response.json(
      { ok: false, error: "تعذّر حفظ بيانات الجواز." },
      { status: 500 },
    );
  }
}
