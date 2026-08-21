import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createAdminSessionToken,
  isAdminAuthConfigured,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

const bodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    if (!isAdminAuthConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "أضيفي ADMIN_USERNAME و ADMIN_PASSWORD في .env.local ثم أعيدي تشغيل السيرفر.",
        },
        { status: 503 },
      );
    }

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "أدخلي اسم المستخدم وكلمة المرور." },
        { status: 400 },
      );
    }

    if (
      !verifyAdminCredentials(parsed.data.username, parsed.data.password)
    ) {
      return NextResponse.json(
        { ok: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة." },
        { status: 401 },
      );
    }

    const token = await createAdminSessionToken();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
    return res;
  } catch (error) {
    console.error("[admin/login]", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر تسجيل الدخول." },
      { status: 500 },
    );
  }
}
