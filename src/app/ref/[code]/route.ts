import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_MAX_AGE,
} from "@/lib/loyalty/config";

type Props = { params: Promise<{ code: string }> };

export async function GET(req: Request, { params }: Props) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw || "").trim().toUpperCase();
  if (!code || code.length < 4) {
    return NextResponse.redirect(new URL("/register", req.url));
  }

  const referrer = await prisma.customer.findFirst({
    where: { referralCode: { equals: code, mode: "insensitive" } },
    select: { referralCode: true },
  });

  const target = new URL("/register", req.url);
  if (referrer?.referralCode) {
    target.searchParams.set("ref", referrer.referralCode);
    const jar = await cookies();
    jar.set(REFERRAL_COOKIE, referrer.referralCode, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: REFERRAL_COOKIE_MAX_AGE,
    });
  }

  return NextResponse.redirect(target);
}
