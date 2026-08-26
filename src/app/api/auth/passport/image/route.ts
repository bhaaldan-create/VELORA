import { cookies } from "next/headers";
import {
  CUSTOMER_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";
import { getPassportForCustomer } from "@/lib/passport/ensure";
import { renderPassportStoryPng } from "@/lib/passport/render-story";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

/**
 * Server-rendered MY VELORA PASSPORT Story — 1080×1920 PNG.
 * GET /api/auth/passport/image
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const wantsJson = url.searchParams.get("debug") === "1";

  try {
    const jar = await cookies();
    const session = await verifyCustomerSessionToken(
      jar.get(CUSTOMER_COOKIE)?.value,
    );
    if (!session) {
      return wantsJson
        ? Response.json({ ok: false, error: "Unauthorized" }, { status: 401 })
        : new Response("Unauthorized", { status: 401 });
    }

    const passport = await getPassportForCustomer(session.customerId);
    if (!passport) {
      return new Response("Not found", { status: 404 });
    }

    const locale = url.searchParams.get("locale") === "ar" ? "ar" : "en";
    const download = url.searchParams.get("download") === "1";
    const levelName =
      locale === "ar" ? passport.level.nameAr : passport.level.nameEn;

    const png = await renderPassportStoryPng({
      fullName: passport.fullName,
      passportNumber: passport.passportNumber,
      memberSinceYear: passport.memberSinceYear,
      levelName,
      levelMark: passport.level.mark,
      xp: passport.xp,
      avatarUrl: passport.avatarUrl,
      publicUrl: passport.publicUrl,
      showQrCode: passport.config.showQrCode,
      locale,
    });

    if (wantsJson) {
      return Response.json({
        ok: true,
        bytes: png.byteLength,
        passportNumber: passport.passportNumber,
      });
    }

    const body = Uint8Array.from(png);
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=60",
        ...(download
          ? {
              "Content-Disposition": `attachment; filename="MY-VELORA-PASSPORT-${passport.passportNumber}.png"`,
            }
          : {
              "Content-Disposition": `inline; filename="MY-VELORA-PASSPORT-${passport.passportNumber}.png"`,
            }),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[passport/image]", message, error);
    return wantsJson
      ? Response.json({ ok: false, error: message }, { status: 500 })
      : new Response(`Render failed: ${message}`, {
          status: 500,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
  }
}
