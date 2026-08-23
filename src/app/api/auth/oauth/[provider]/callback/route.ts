import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  CUSTOMER_COOKIE,
  customerCookieOptions,
} from "@/lib/customer-auth";
import { upsertCustomerFromOAuth } from "@/lib/oauth-customers";
import {
  createSessionCookieValue,
  exchangeOAuthCode,
  OAUTH_STATE_COOKIE,
  oauthStateCookieOptions,
  safeOAuthNext,
  verifyOAuthState,
  type OAuthProvider,
} from "@/lib/oauth";

function parseProvider(raw: string): OAuthProvider | null {
  if (raw === "google" || raw === "apple") return raw;
  return null;
}

function loginErrorUrl(req: Request, message: string, nextPath: string) {
  const origin = new URL(req.url).origin;
  const params = new URLSearchParams({
    oauth_error: message,
    next: nextPath,
  });
  return `${origin}/login?${params}`;
}

async function finishOAuth(
  req: Request,
  provider: OAuthProvider,
  input: {
    code: string | null;
    state: string | null;
    error: string | null;
    appleUser: string | null;
  },
) {
  const jar = await cookies();
  const cookieState = jar.get(OAUTH_STATE_COOKIE)?.value ?? null;
  const stateValue = input.state || cookieState;
  const verified = await verifyOAuthState(stateValue);
  const nextPath = verified?.next || "/account";

  if (input.error) {
    return NextResponse.redirect(
      loginErrorUrl(
        req,
        input.error === "access_denied"
          ? "تم إلغاء تسجيل الدخول."
          : "تعذّر إكمال تسجيل الدخول.",
        nextPath,
      ),
    );
  }

  if (!verified || !input.state) {
    return NextResponse.redirect(
      loginErrorUrl(
        req,
        "انتهت صلاحية جلسة الدخول. أعيدي المحاولة.",
        nextPath,
      ),
    );
  }

  if (cookieState && cookieState !== input.state) {
    return NextResponse.redirect(
      loginErrorUrl(req, "طلب غير صالح. أعيدي المحاولة.", nextPath),
    );
  }

  if (!input.code) {
    return NextResponse.redirect(
      loginErrorUrl(req, "لم يُرجع المزود رمز التفويض.", nextPath),
    );
  }

  try {
    const profile = await exchangeOAuthCode(
      provider,
      input.code,
      input.appleUser,
    );
    const customer = await upsertCustomerFromOAuth(profile);
    const sessionToken = await createSessionCookieValue(customer.id);
    const origin = new URL(req.url).origin;
    const res = NextResponse.redirect(`${origin}${safeOAuthNext(nextPath)}`);
    res.cookies.set(CUSTOMER_COOKIE, sessionToken, customerCookieOptions());
    res.cookies.set(OAUTH_STATE_COOKIE, "", {
      ...oauthStateCookieOptions(0),
      maxAge: 0,
    });
    return res;
  } catch (error) {
    console.error(`[oauth/${provider}/callback]`, error);
    return NextResponse.redirect(
      loginErrorUrl(
        req,
        error instanceof Error
          ? error.message
          : "تعذّر إكمال تسجيل الدخول عبر الحساب الاجتماعي.",
        nextPath,
      ),
    );
  }
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ provider: string }> },
) {
  const { provider: raw } = await ctx.params;
  const provider = parseProvider(raw);
  if (!provider) {
    return NextResponse.json({ ok: false, error: "مزود غير معروف." }, { status: 404 });
  }

  const url = new URL(req.url);
  return finishOAuth(req, provider, {
    code: url.searchParams.get("code"),
    state: url.searchParams.get("state"),
    error: url.searchParams.get("error"),
    appleUser: null,
  });
}

/** Apple يرسل النتيجة عبر form_post */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ provider: string }> },
) {
  const { provider: raw } = await ctx.params;
  const provider = parseProvider(raw);
  if (!provider) {
    return NextResponse.json({ ok: false, error: "مزود غير معروف." }, { status: 404 });
  }

  const form = await req.formData();
  return finishOAuth(req, provider, {
    code: (form.get("code") as string | null) || null,
    state: (form.get("state") as string | null) || null,
    error: (form.get("error") as string | null) || null,
    appleUser: (form.get("user") as string | null) || null,
  });
}
