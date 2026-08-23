export async function parseJsonResponse<T extends Record<string, unknown>>(
  res: Response,
): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      res.status === 413
        ? "حجم الصورة كبير جداً للسيرفر. جرّبي صورة أصغر (أقل من 4 ميجابايت على الإنترنت)."
        : `السيرفر أعاد رداً فارغاً (${res.status}). أعيدي تشغيل السيرفر أو جرّبي لاحقاً.`,
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    const snippet = text.slice(0, 100).replace(/\s+/g, " ");
    if (res.status === 413) {
      throw new Error(
        "حجم الصورة كبير جداً للسيرفر. جرّبي صورة أصغر (أقل من 4 ميجابايت على الإنترنت).",
      );
    }
    throw new Error(
      `رد غير متوقع من السيرفر (${res.status}). ${snippet ? `…${snippet}` : ""}`,
    );
  }
}
