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
        !auth && "pb-20 lg:pb-0",
      )}
    >
      {children}
    </main>
  );
}
