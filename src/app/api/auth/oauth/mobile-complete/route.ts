import { NextResponse } from "next/server";
import {
  CUSTOMER_COOKIE,
  customerCookieOptions,
} from "@/lib/customer-auth";
import {
  createSessionCookieValue,
  safeOAuthNext,
  verifyMobileOAuthTicket,
} from "@/lib/oauth";
import { prisma } from "@/lib/db";

/** يستبدل تذكرة OAuth قصيرة العمر بكوكي جلسة داخل WebView */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { ticket?: string };
    const customerId = await verifyMobileOAuthTicket(body.ticket?.trim());
    if (!customerId) {
      return NextResponse.json(
        { ok: false, error: "تذكرة غير صالحة أو منتهية." },
        { status: 400 },
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });
    if (!customer) {
      return NextResponse.json(
        { ok: false, error: "الحساب غير موجود." },
        { status: 404 },
      );
    }

    const sessionToken = await createSessionCookieValue(customer.id);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(CUSTOMER_COOKIE, sessionToken, customerCookieOptions());
    return res;
  } catch {
    return NextResponse.json(
      { ok: false, error: "تعذّر إكمال تسجيل الدخول." },
      { status: 500 },
    );
  }
}

/** GET — إعادة توجيه مع كوكي عند فتح الرابط مباشرة (WebView) */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ticket = url.searchParams.get("ticket");
  const next = safeOAuthNext(url.searchParams.get("next"));
  const customerId = await verifyMobileOAuthTicket(ticket);
  if (!customerId) {
    return NextResponse.redirect(new URL("/login?oauth_error=invalid_ticket", url.origin));
  }

  const sessionToken = await createSessionCookieValue(customerId);
  const res = NextResponse.redirect(new URL(next, url.origin));
  res.cookies.set(CUSTOMER_COOKIE, sessionToken, customerCookieOptions());
  return res;
}
