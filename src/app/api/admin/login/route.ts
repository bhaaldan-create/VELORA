import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createAdminSessionToken,
  isAdminAuthConfigured,
  verifyAdminAccessCode,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import {
  ensureDefaultStaffLogins,
  findEmployeeByUsername,
  touchEmployeePresence,
} from "@/lib/admin-hr";
import { verifyPassword } from "@/lib/customer-auth";

const bodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  accessCode: z.string().min(1),
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
        {
          ok: false,
          error: "أدخلي اسم المستخدم وكلمة المرور والشفرة السرية.",
        },
        { status: 400 },
      );
    }

    const { username, password, accessCode } = parsed.data;

    if (!verifyAdminAccessCode(accessCode)) {
      return NextResponse.json(
        { ok: false, error: "الشفرة السرية غير صحيحة." },
        { status: 401 },
      );
    }

    // 1) حساب الجذر من البيئة
    if (verifyAdminCredentials(username, password)) {
      const token = await createAdminSessionToken("root");
      const res = NextResponse.json({
        ok: true,
        role: "root",
        displayName: "VELORA Admin",
      });
      res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
      return res;
    }

    // 2) حساب موظف — يضمن الحسابات الابتدائية عند أول دخول
    await ensureDefaultStaffLogins();
    const employee = await findEmployeeByUsername(username);
    if (
      !employee ||
      !employee.isActive ||
      !employee.passwordHash ||
      !(await verifyPassword(password, employee.passwordHash))
    ) {
      return NextResponse.json(
        { ok: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة." },
        { status: 401 },
      );
    }

    await touchEmployeePresence(employee.id);
    const token = await createAdminSessionToken(employee.id);
    const res = NextResponse.json({
      ok: true,
      role: "employee",
      displayName: employee.name,
      employeeId: employee.id,
    });
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
