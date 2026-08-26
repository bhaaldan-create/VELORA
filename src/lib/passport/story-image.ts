"use client";

function imageUrl(opts?: { download?: boolean; locale?: "ar" | "en"; bust?: number }) {
  const q = new URLSearchParams();
  q.set("locale", opts?.locale || "en");
  if (opts?.download) q.set("download", "1");
  if (opts?.bust) q.set("t", String(opts.bust));
  return `/api/auth/passport/image?${q.toString()}`;
}

export async function fetchPassportStoryBlob(locale: "ar" | "en" = "en"): Promise<Blob> {
  const res = await fetch(imageUrl({ locale, bust: Date.now() }), {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) {
    const text = (await res.text().catch(() => "")).trim();
    if (res.status === 401) {
      throw new Error("يجب تسجيل الدخول أولاً.");
    }
    const detail = text
      .replace(/^Render failed:\s*/i, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 180)
      .trim();
    throw new Error(
      detail
        ? `تعذّر تجهيز الجواز (${res.status}): ${detail}`
        : `تعذّر تجهيز الجواز من الخادم (${res.status}).`,
    );
  }
  const type = res.headers.get("content-type") || "";
  if (!type.includes("image/")) {
    throw new Error("استجابة غير صالحة من الخادم.");
  }
  return res.blob();
}

export async function downloadPassportStoryPng(
  locale: "ar" | "en" = "en",
  passportNumber?: string,
) {
  const blob = await fetchPassportStoryBlob(locale);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `MY-VELORA-PASSPORT-${passportNumber || "story"}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function sharePassportStory(input: {
  locale: "ar" | "en";
  title: string;
  text: string;
  url: string;
  passportNumber?: string;
}): Promise<"native-file" | "native-link" | "clipboard" | "download-instagram" | "download"> {
  try {
    const blob = await fetchPassportStoryBlob(input.locale);
    const file = new File(
      [blob],
      `MY-VELORA-PASSPORT-${input.passportNumber || "story"}.png`,
      { type: "image/png" },
    );
    const fileShare = { files: [file], title: input.title, text: input.text };
    if (navigator.share && navigator.canShare?.(fileShare)) {
      await navigator.share(fileShare);
      return "native-file";
    }

    await downloadPassportStoryPng(input.locale, input.passportNumber);
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) {
      window.setTimeout(() => {
        window.location.href = "instagram://story-camera";
      }, 400);
      return "download-instagram";
    }
    return "download";
  } catch {
    /* fall through to link share */
  }

  if (navigator.share) {
    await navigator.share({
      title: input.title,
      text: input.text,
      url: input.url,
    });
    return "native-link";
  }
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(input.url);
    return "clipboard";
  }
  return "download";
}
