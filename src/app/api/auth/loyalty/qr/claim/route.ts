import { z } from "zod";
import { cookies } from "next/headers";
import {
  CUSTOMER_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";
import { claimQrReward } from "@/lib/loyalty/award";

export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string().trim().min(2).max(120),
});

export async function POST(req: Request) {
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

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "أدخلي رمز الحملة." },
        { status: 400 },
      );
    }

    const result = await claimQrReward({
      customerId: session.customerId,
      tokenOrKey: parsed.data.code,
    });

    if (!result.ok) {
      const map: Record<string, string> = {
        not_found: "الرمز غير صالح.",
        inactive: "هذه الحملة غير نشطة.",
        expired: "انتهت صلاحية هذه الحملة.",
        max_claims: "اكتمل الحد الأقصى لهذه الحملة.",
        already_claimed: "سبق واستفدتِ من هذه الحملة.",
        empty: "أدخلي رمزاً صالحاً.",
      };
      return Response.json(
        {
          ok: false,
          error: map[result.reason || ""] || "تعذّر المطالبة بالمكافأة.",
          reason: result.reason,
          awarded: 0,
        },
        { status: 400 },
      );
    }

    return Response.json({
      ok: true,
      awarded: result.awarded,
      duplicate: Boolean(result.duplicate),
    });
  } catch (error) {
    console.error("[auth/loyalty/qr/claim]", error);
    return Response.json(
      { ok: false, error: "تعذّر المطالبة بالمكافأة." },
      { status: 500 },
    );
  }
}
