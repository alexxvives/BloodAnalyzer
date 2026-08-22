"use client";

import { AuthModal } from "@/components/auth/AuthModal";
import type { AuthMode } from "@/lib/auth/paths";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo } from "react";

function AuthLauncherInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const mode = useMemo<AuthMode | null>(() => {
    const raw = search.get("auth");
    if (raw === "login" || raw === "signup") return raw;
    return null;
  }, [search]);

  const next = search.get("next") || "/app";

  const setAuth = useCallback(
    (nextMode: AuthMode | null) => {
      const params = new URLSearchParams(search.toString());
      if (nextMode) {
        params.set("auth", nextMode);
      } else {
        params.delete("auth");
      }
      // Keep next only while auth is open
      if (!nextMode) params.delete("next");
      const qs = params.toString();
      const base = pathname === "/login" || pathname === "/signup" ? "/" : pathname;
      router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    },
    [pathname, router, search],
  );

  return (
    <>
      {children}
      <AuthModal
        open={mode != null}
        mode={mode ?? "login"}
        next={next}
        onClose={() => setAuth(null)}
        onModeChange={(m) => setAuth(m)}
      />
    </>
  );
}

/** Query-param auth popup: `?auth=login|signup&next=/upload`. */
export function AuthLauncher({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <AuthLauncherInner>{children}</AuthLauncherInner>
    </Suspense>
  );
}
