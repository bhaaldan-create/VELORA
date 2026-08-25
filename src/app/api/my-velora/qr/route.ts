import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin QR proxy so Story exports never hit cross-origin canvas taint.
 */
export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get("data")?.trim();
  if (!data || data.length > 2000) {
    return new Response("Bad request", { status: 400 });
  }

  const upstream = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(data)}`;

  try {
    const res = await fetch(upstream, { next: { revalidate: 86400 } });
    if (!res.ok) {
      return new Response("QR upstream error", { status: 502 });
    }
    const buf = await res.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new Response("QR failed", { status: 502 });
  }
}
