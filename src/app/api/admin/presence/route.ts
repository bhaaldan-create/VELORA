import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  parseAdminSessionToken,
} from "@/lib/admin-auth";
import { touchEmployeePresence } from "@/lib/admin-hr";

/** نبضة حضور — تُحدّث lastSeenAt للموظف المتصل */
export async function POST() {
  try {
    const jar = await cookies();
    const session = await parseAdminSessionToken(
      jar.get(ADMIN_COOKIE)?.value,
    );
    if (!session?.ok) {
      return Response.json({ ok: false }, { status: 401 });
    }
    if (session.subject !== "root") {
      await touchEmployeePresence(session.subject);
    }
    return Response.json({ ok: true, subject: session.subject });
  } catch (error) {
    console.error("[admin/presence]", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
