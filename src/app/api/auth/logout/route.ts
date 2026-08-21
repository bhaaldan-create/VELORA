import { cookies } from "next/headers";
import {
  CUSTOMER_COOKIE,
  customerCookieOptions,
} from "@/lib/customer-auth";

export async function POST() {
  const jar = await cookies();
  jar.set(CUSTOMER_COOKIE, "", { ...customerCookieOptions(0), maxAge: 0 });
  return Response.json({ ok: true });
}
