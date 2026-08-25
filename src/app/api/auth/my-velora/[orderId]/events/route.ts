import { POST_EVENTS } from "../handlers";

export async function POST(req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  return POST_EVENTS(req, ctx);
}
