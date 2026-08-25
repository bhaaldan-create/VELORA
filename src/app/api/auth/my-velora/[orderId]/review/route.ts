import { POST_REVIEW } from "../handlers";

export async function POST(req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  return POST_REVIEW(req, ctx);
}
