import { cookies } from "next/headers";
import {
  CUSTOMER_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";
import { awardReferralShare } from "@/lib/loyalty/award";

export const dynamic = "force-dynamic";

function utcDayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export async function POST() {
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

    const result = await awardReferralShare(
      session.customerId,
      utcDayKey(),
    );

    if (!result.ok) {
      const msg =
        result.reason === "daily_limit"
          ? "وصلتِ للحد اليومي لمكافأة المشاركة."
          : result.reason === "monthly_limit"
            ? "وصلتِ للحد الشهري لمكافأة المشاركة."
            : result.reason === "zero_points"
              ? "لا توجد نقاط."
              : "تعذّر تسجيل المشاركة.";
      return Response.json(
        { ok: false, error: msg, reason: result.reason, awarded: 0 },
        { status: 400 },
      );
    }

    return Response.json({
      ok: true,
      awarded: result.duplicate ? 0 : result.awarded,
      duplicate: Boolean(result.duplicate),
    });
  } catch (error) {
    console.error("[auth/loyalty/share]", error);
    return Response.json(
      { ok: false, error: "تعذّر تسجيل المشاركة." },
      { status: 500 },
    );
  }
}
