"use client";

import { usePathname } from "next/navigation";
import { isAuthRoute } from "@/components/auth/auth-utils";
import { cn } from "@/lib/utils";

export function SiteMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const auth = isAuthRoute(pathname);

  return (
    <main
      className={cn(
        "min-w-0 flex-1 overflow-x-clip",
        /* Reserve space for viewport-fixed Header; auth routes hide Header */
        !auth && "pt-[var(--header-offset)] pb-20 lg:pb-0",
      )}
    >
      {children}
    </main>
  );
}
