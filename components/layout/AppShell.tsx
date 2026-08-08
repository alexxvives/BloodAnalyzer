"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/upload", label: "Upload", icon: UploadIcon },
  { href: "/history", label: "History", icon: HistoryIcon },
] as const;

const STORAGE_KEY = "ba.sidebar.collapsed";

type SessionUser = { id: string; email: string; name: string } | null;

type HistoryItem = {
  id: string;
  label: string;
  href: string;
  markerCount: number;
  overallPct: number | null;
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<SessionUser>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user?: SessionUser } | null) => {
        if (!cancelled) setUser(data?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/reports/history")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (data: {
          reports?: Array<{
            id: string;
            createdAt: string;
            sourceFileName: string | null;
            markerCount: number;
            overallPct: number | null;
          }>;
        } | null) => {
          if (cancelled || !data?.reports) {
            if (!cancelled) setHistory([]);
            return;
          }
          setHistory(
            data.reports.map((r) => ({
              id: r.id,
              href: `/report/${r.id}`,
              label: formatHistoryLabel(r.createdAt, r.sourceFileName),
              markerCount: r.markerCount,
              overallPct: r.overallPct,
            })),
          );
        },
      )
      .catch(() => {
        if (!cancelled) setHistory([]);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const sidebarWidth = collapsed ? "md:w-[4.5rem]" : "md:w-64";
  const contentOffset = collapsed ? "md:pl-[4.5rem]" : "md:pl-64";

  return (
    <div className="min-h-full bg-background">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 ease-out ${sidebarWidth} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div
          className={`flex items-start gap-2 px-3 pt-4 pb-3 ${
            collapsed ? "md:flex-col md:items-center" : ""
          }`}
        >
          <Link
            href="/"
            className={`flex min-w-0 flex-1 items-center gap-3 ${
              collapsed ? "md:flex-none md:justify-center" : "px-1"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand-mark.svg"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0"
            />
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate font-[family-name:var(--font-fraunces)] text-lg leading-tight tracking-tight">
                  Blood Analyzer
                </p>
              </div>
            ) : (
              <div className="md:hidden">
                <p className="font-[family-name:var(--font-fraunces)] text-lg tracking-tight">
                  Blood Analyzer
                </p>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden shrink-0 rounded-lg p-2 text-sidebar-foreground/70 transition hover:bg-white/10 hover:text-sidebar-foreground md:inline-flex"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <CollapseIcon
              className={`h-4 w-4 transition ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-white/10 font-medium text-accent"
                    : "text-sidebar-foreground/75 hover:bg-white/5 hover:text-sidebar-foreground"
                } ${collapsed ? "md:justify-center md:px-2" : ""}`}
              >
                <Icon className="h-5 w-5 shrink-0 opacity-90" />
                <span className={collapsed ? "md:hidden" : ""}>{label}</span>
              </Link>
            );
          })}

          {history.length > 0 ? (
            <div className={`mt-4 ${collapsed ? "md:hidden" : ""}`}>
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40">
                Recent uploads
              </p>
              <ul className="flex flex-col gap-1.5">
                {history.slice(0, 5).map((item) => {
                  const active = pathname === item.href;
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        title={item.label}
                        className={`block rounded-xl px-3 py-2.5 transition ${
                          active
                            ? "bg-white/10 text-accent"
                            : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground"
                        }`}
                      >
                        <p className="truncate text-sm font-medium">
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-[11px] text-sidebar-foreground/45">
                          {item.overallPct != null
                            ? `${item.overallPct}% overall · ${item.markerCount} markers`
                            : `${item.markerCount} markers`}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {history.length > 5 ? (
                <Link
                  href="/history"
                  className="mt-1 block px-3 py-1.5 text-xs text-accent hover:underline"
                >
                  View all history →
                </Link>
              ) : null}
            </div>
          ) : null}

          {collapsed && history.length > 0 ? (
            <div className="mt-3 hidden flex-col items-center gap-1 md:flex">
              {history.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  title={item.label}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-semibold transition ${
                    pathname === item.href
                      ? "bg-white/10 text-accent"
                      : "text-sidebar-foreground/60 hover:bg-white/5"
                  }`}
                >
                  {shortHistoryLabel(item.label)}
                </Link>
              ))}
            </div>
          ) : null}
        </nav>

        <div className="mt-auto border-t border-white/10 p-3">
          <div
            className={`flex items-center gap-2 rounded-xl px-2 py-2 ${
              collapsed ? "md:justify-center md:px-0" : ""
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold uppercase">
              {(user?.name || user?.email || "?").slice(0, 1)}
            </div>
            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {user?.name || "Account"}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/55">
                  {user?.email || "Signed in"}
                </p>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => void logout()}
              className="shrink-0 rounded-lg p-2 text-sidebar-foreground/70 transition hover:bg-white/10 hover:text-sidebar-foreground"
              title="Log out"
              aria-label="Log out"
            >
              <LogoutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div
        className={`flex min-h-full min-w-0 flex-col transition-[padding] duration-200 ${contentOffset}`}
      >
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            aria-label="Open menu"
            className="ba-icon-btn"
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon className="h-4 w-4" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand-mark.svg"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7"
          />
          <span className="font-[family-name:var(--font-fraunces)] text-base tracking-tight">
            Blood Analyzer
          </span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

function formatHistoryLabel(
  createdAt: string,
  sourceFileName: string | null,
): string {
  const d = new Date(createdAt);
  const monthYear = Number.isNaN(d.getTime())
    ? "Unknown date"
    : d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  if (sourceFileName) {
    const short = sourceFileName.replace(/\.[^.]+$/, "").slice(0, 18);
    return `${monthYear} · ${short}`;
  }
  return monthYear;
}

function shortHistoryLabel(label: string): string {
  const m = label.match(/^([A-Za-z]{3})\s+(\d{2,4})/);
  if (!m) return "·";
  return `${m[1].slice(0, 1)}${String(m[2]).slice(-2)}`;
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 16V4m0 0 4 4m-4-4-4 4" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 12a8 8 0 1 0 3-6.3" />
      <path d="M4 5v4h4" />
      <path d="M12 8v5l3 2" />
    </svg>
  );
}

function CollapseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M15 6 9 12l6 6" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <path d="M15 12H8m7 0 3-3m-3 3 3 3" />
    </svg>
  );
}
