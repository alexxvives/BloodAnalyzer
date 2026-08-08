"use client";

import { AuthLauncher } from "@/components/auth/AuthLauncher";
import { authHref } from "@/lib/auth/paths";
import Link from "next/link";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthLauncher>
      <div className="flex min-h-full flex-col bg-background">
        <header className="sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur-md transition-colors">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-6 md:px-10">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 whitespace-nowrap font-[family-name:var(--font-fraunces)] text-lg tracking-tight text-foreground sm:gap-2.5 sm:text-xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand-mark.svg"
                alt=""
                width={30}
                height={30}
                className="h-7 w-7 sm:h-[30px] sm:w-[30px]"
              />
              Blood Analyzer
            </Link>
            <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
              <Link
                href={authHref("login")}
                className="whitespace-nowrap rounded-xl px-2.5 py-2 text-sm text-muted transition hover:text-foreground sm:px-3"
              >
                Log in
              </Link>
              <Link
                href={authHref("signup")}
                className="ba-btn ba-btn-primary"
              >
                Sign up
              </Link>
            </nav>
          </div>
        </header>

        <div className="flex flex-1 flex-col">{children}</div>

        <footer className="border-t border-border bg-background">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 md:px-10">
            <p className="font-[family-name:var(--font-fraunces)] text-lg tracking-tight text-foreground">
              Blood Analyzer
            </p>
            <p className="max-w-md text-xs leading-relaxed text-muted">
              Educational reports only — not medical advice, diagnosis or
              treatment. Always discuss results with a qualified clinician.
            </p>
          </div>
        </footer>
      </div>
    </AuthLauncher>
  );
}
