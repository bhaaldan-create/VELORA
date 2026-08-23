import { NextResponse } from "next/server";
import {
  isAppleOAuthConfigured,
  isGoogleOAuthConfigured,
} from "@/lib/oauth";

/** حالة تفعيل المزودين للواجهة */
export async function GET() {
  return NextResponse.json({
    ok: true,
    google: isGoogleOAuthConfigured(),
    apple: isAppleOAuthConfigured(),
  });
}
