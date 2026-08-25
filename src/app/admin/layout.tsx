import type { ReactNode } from "react";
import { AdminShellLayout } from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShellLayout>{children}</AdminShellLayout>;
}
