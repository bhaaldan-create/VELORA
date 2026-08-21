import { z } from "zod";
import {
  getStripe,
  getStripePublishableKey,
  iqdToUsdCents,
  isCardPaymentMethod,
  isStripeConfigured,
  USD_TO_IQD_RATE,
} from "@/lib/stripe";

export async function GET() {
  return Response.json({
    ok: true,
    configured: isStripeConfigured(),
    publishableKey: isStripeConfigured() ? getStripePublishableKey() : null,
    usdToIqdRate: USD_TO_IQD_RATE,
    message: isStripeConfigured()
      ? undefined
      : "أضيفي STRIPE_SECRET_KEY و NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY في .env.local ثم أعيدي تشغيل السيرفر.",
  });
}

const bodySchema = z.object({
  subtotalIqd: z.number().int().positive(),
  paymentMethod: z.string().min(1),
  email: z.string().email().optional(),
  fullName: z.string().min(2).optional(),
});

export async function POST(req: Request) {
  try {
    if (!isStripeConfigured()) {
      return Response.json(
        {
          ok: false,
          error:
            "الدفع بالبطاقة غير مفعّل بعد. اربطي حساب Stripe في إعدادات الموقع.",
        },
        { status: 503 },
      );
    }

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "بيانات الدفع غير صحيحة." },
        { status: 400 },
      );
    }

    if (!isCardPaymentMethod(parsed.data.paymentMethod)) {
      return Response.json(
        { ok: false, error: "طريقة الدفع هذه لا تستخدم بوابة البطاقة." },
        { status: 400 },
      );
    }

    const amountUsdCents = iqdToUsdCents(parsed.data.subtotalIqd);
    const stripe = getStripe();

    const intent = await stripe.paymentIntents.create({
      amount: amountUsdCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      receipt_email: parsed.data.email,
      description: `VELORA order — ${parsed.data.paymentMethod}`,
      metadata: {
        brand: "VELORA",
        paymentMethod: parsed.data.paymentMethod,
        subtotalIqd: String(parsed.data.subtotalIqd),
        customerName: parsed.data.fullName || "",
      },
    });

    return Response.json({
      ok: true,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amountUsdCents,
      amountIqd: parsed.data.subtotalIqd,
      usdToIqdRate: USD_TO_IQD_RATE,
    });
  } catch (error) {
    console.error("[payments/create-intent]", error);
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "تعذّر تجهيز الدفع الإلكتروني.",
      },
      { status: 500 },
    );
  }
}
