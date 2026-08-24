"use client";

import dynamic from "next/dynamic";

/** تحميل مؤجّل من مكوّن عميل — Next 16 يمنع ssr:false داخل Server Components */
export const FloatingContactLazy = dynamic(
  () =>
    import("@/components/contact/FloatingContact").then((m) => m.FloatingContact),
  { ssr: false, loading: () => null },
);
