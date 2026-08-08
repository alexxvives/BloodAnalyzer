"use client";

import { AppShell } from "@/components/layout/AppShell";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { usePathname } from "next/navigation";

const MARKETING_PATHS = new Set(["/"]);

export function RootChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const marketing = MARKETING_PATHS.has(pathname);

  if (marketing) {
    return <MarketingShell>{children}</MarketingShell>;
  }
  return <AppShell>{children}</AppShell>;
}
