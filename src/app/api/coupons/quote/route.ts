import { CouponRejected, quoteCoupon, tooManyCouponAttempts, hashKey } from "@/lib/discounts/service";

function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || "local";
}

export async function POST(req: Request) {
  try {
    const ipHash = hashKey(clientIp(req));
    if (await tooManyCouponAttempts(ipHash)) {
      return Response.json(
        { ok: false, error: "حاولتِ مرات كثيرة. انتظري دقيقة ثم أعيدي المحاولة." },
        { status: 429 },
      );
    }

    const body = (await req.json()) as {
      items?: { id: string; quantity: number; size?: string }[];
      couponCode?: string;
      customerId?: string;
      phone?: string;
      email?: string;
    };
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return Response.json(
        { ok: false, error: "السلة فارغة." },
        { status: 400 },
      );
    }

    const quote = await quoteCoupon({
      items: body.items,
      couponCode: body.couponCode,
      customerId: body.customerId,
      phone: body.phone,
      email: body.email,
      ipHash,
    });

    return Response.json({
      ok: true,
      couponCode: quote.couponCode || null,
      merchandiseSubtotal: quote.merchandiseBefore,
      productDiscountIqd: quote.productDiscount,
      couponDiscountIqd: quote.couponDiscountIqd,
      shippingDiscountIqd: quote.shippingDiscountIqd,
      deliveryFee: quote.deliveryFee,
      total: quote.payable,
      warnings: quote.warnings,
    });
  } catch (error) {
    if (error instanceof CouponRejected) {
      return Response.json(
        { ok: false, error: error.message },
        { status: error.status },
      );
    }
    console.error("[coupons/quote]", error);
    return Response.json(
      { ok: false, error: "تعذّر التحقق من الكود." },
      { status: 500 },
    );
  }
}
