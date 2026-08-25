import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  isAdminAuthConfigured,
  parseAdminSessionToken,
} from "@/lib/admin-auth";
import { canAccessModule, moduleForPath } from "@/lib/admin/rbac";
import {
  CUSTOMER_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";

function isPublicAdminPath(pathname: string) {
  return pathname === "/admin/login" || pathname === "/api/admin/login";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // —— حساب الزبون ——
  if (pathname.startsWith("/account")) {
    const token = request.cookies.get(CUSTOMER_COOKIE)?.value;
    const session = await verifyCustomerSessionToken(token);
    if (!session) {
      const login = new URL("/login", request.url);
      const next =
        pathname +
        (request.nextUrl.search && request.nextUrl.search !== "?"
          ? request.nextUrl.search
          : "");
      login.searchParams.set("next", next);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  // —— لوحة الإدارة ——
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  if (isPublicAdminPath(pathname)) {
    return NextResponse.next();
  }

  if (!isAdminAuthConfigured()) {
    if (isAdminApi) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "أضيفي ADMIN_USERNAME و ADMIN_PASSWORD في .env.local — أضيفيه ثم أعيدي تشغيل السيرفر.",
        },
        { status: 503 },
      );
    }
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("error", "config");
    return NextResponse.redirect(login);
  }

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const session = await parseAdminSessionToken(token);

  if (session?.ok) {
    // Page navigation: never bounce to overview (silent redirects feel broken).
    // Enforce module RBAC on admin APIs only.
    if (isAdminApi) {
      const mod = moduleForPath(pathname);
      if (
        mod &&
        !canAccessModule(session.subject, session.role, mod)
      ) {
        return NextResponse.json(
          { ok: false, error: "ليس لديك صلاحية لهذا القسم." },
          { status: 403 },
        );
      }
    }
    return NextResponse.next();
  }

  if (isAdminApi) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول للوحة الإدارة." },
      { status: 401 },
    );
  }

  const login = new URL("/admin/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/account",
    "/account/:path*",
  ],
};
