import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";
import {
  CUSTOMER_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";
import {
  countSuccessfulReferrals,
  ensureLoyaltyIdentity,
  getLoyaltyBalance,
  listLoyaltyActivity,
} from "@/lib/loyalty/award";
import { absoluteReferralUrl } from "@/lib/loyalty/referral-code";
import { loyaltyEventLabel } from "@/lib/loyalty/labels";
import { LOYALTY_DIRECTION } from "@/lib/loyalty/config";

export const dynamic = "force-dynamic";

function siteOriginFromHeaders(h: Headers) {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`.replace(/\/$/, "");
  return "https://velorabeautyiq.me";
}

export async function GET() {
  try {
    const jar = await cookies();
    const session = await verifyCustomerSessionToken(
      jar.get(CUSTOMER_COOKIE)?.value,
    );
    if (!session) {
      return Response.json(
        { ok: false, error: "يجب تسجيل الدخول أولاً." },
        { status: 401 },
      );
    }

    await ensureLoyaltyIdentity(session.customerId);

    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: {
        id: true,
        fullName: true,
        referralCode: true,
        referredByCustomerId: true,
      },
    });
    if (!customer?.referralCode) {
      return Response.json(
        { ok: false, error: "تعذّر تجهيز حساب المكافآت." },
        { status: 500 },
      );
    }

    const [balance, activity, successfulReferrals] = await Promise.all([
      getLoyaltyBalance(session.customerId),
      listLoyaltyActivity(session.customerId, 40),
      countSuccessfulReferrals(session.customerId),
    ]);

    const h = await headers();
    const origin = siteOriginFromHeaders(h);
    const referralUrl = absoluteReferralUrl(customer.referralCode, origin);

    return Response.json({
      ok: true,
      config: {
        iqdPerPoint: LOYALTY_CONFIG.purchase.iqdPerPoint,
        waysToEarn: [
          {
            id: "purchase",
            titleAr: "شراء المنتجات",
            titleEn: "Product purchases",
            detailAr: `نقطة لكل ${LOYALTY_CONFIG.purchase.iqdPerPoint.toLocaleString("ar-IQ")} د.ع`,
            detailEn: `1 point per ${LOYALTY_CONFIG.purchase.iqdPerPoint.toLocaleString("en-US")} IQD`,
          },
          {
            id: "signup",
            titleAr: "إنشاء حساب",
            titleEn: "Create account",
            detailAr: `+${LOYALTY_CONFIG.signup.points} نقطة`,
            detailEn: `+${LOYALTY_CONFIG.signup.points} points`,
          },
          {
            id: "profile",
            titleAr: "إكمال الملف الشخصي",
            titleEn: "Complete profile",
            detailAr: `+${LOYALTY_CONFIG.profileCompletion.points} نقطة`,
            detailEn: `+${LOYALTY_CONFIG.profileCompletion.points} points`,
          },
          {
            id: "first",
            titleAr: "أول طلب",
            titleEn: "First order",
            detailAr: `+${LOYALTY_CONFIG.firstPurchase.points} نقاط`,
            detailEn: `+${LOYALTY_CONFIG.firstPurchase.points} points`,
          },
          {
            id: "favorite",
            titleAr: "إضافة للمفضلة",
            titleEn: "Add to favorites",
            detailAr: `+${LOYALTY_CONFIG.favorite.points} نقطة`,
            detailEn: `+${LOYALTY_CONFIG.favorite.points} point`,
          },
          {
            id: "share",
            titleAr: "مشاركة رابطك",
            titleEn: "Share your link",
            detailAr: `+${LOYALTY_CONFIG.shareReferral.points} نقطة`,
            detailEn: `+${LOYALTY_CONFIG.shareReferral.points} point`,
          },
          {
            id: "referral",
            titleAr: "دعوة صديق ناجحة",
            titleEn: "Successful referral",
            detailAr: `+${LOYALTY_CONFIG.successfulReferral.referrerPoints} نقاط`,
            detailEn: `+${LOYALTY_CONFIG.successfulReferral.referrerPoints} points`,
          },
          {
            id: "review",
            titleAr: "تقييم منتج تم شراؤه",
            titleEn: "Verified review",
            detailAr: `+${LOYALTY_CONFIG.review.points} نقطة`,
            detailEn: `+${LOYALTY_CONFIG.review.points} points`,
          },
          {
            id: "qr",
            titleAr: "مسح QR خاص بـ Velora",
            titleEn: "Velora QR scan",
            detailAr: "حسب الحملة",
            detailEn: "Campaign-based",
          },
        ],
      },
      balance,
      referral: {
        code: customer.referralCode,
        url: referralUrl,
        successfulCount: successfulReferrals,
      },
      activity: activity.map((row) => {
        const meta = row.metaJson as { signedPoints?: number };
        let signed = row.points;
        if (
          row.direction === LOYALTY_DIRECTION.REVERSAL ||
          row.direction === LOYALTY_DIRECTION.REDEEM
        ) {
          signed = -row.points;
        } else if (row.direction === LOYALTY_DIRECTION.ADJUSTMENT) {
          signed =
            typeof meta?.signedPoints === "number"
              ? meta.signedPoints
              : row.points;
        }

        return {
          id: row.id,
          eventType: row.eventType,
          points: signed,
          direction: row.direction,
          labelAr: row.descriptionAr || loyaltyEventLabel(row.eventType, "ar"),
          labelEn: row.descriptionEn || loyaltyEventLabel(row.eventType, "en"),
          createdAt: row.createdAt.toISOString(),
          orderId: row.orderId,
        };
      }),
    });
  } catch (error) {
    console.error("[auth/loyalty GET]", error);
    return Response.json(
      { ok: false, error: "تعذّر تحميل برنامج المكافآت." },
      { status: 500 },
    );
  }
}
