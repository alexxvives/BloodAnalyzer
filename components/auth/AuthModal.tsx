"use client";

import { AuthForm } from "@/components/auth/AuthForm";
import { CloseButton } from "@/components/ui/CloseButton";
import type { AuthMode } from "@/lib/auth/paths";
import { useEffect, useId, useRef } from "react";

export type { AuthMode };

type AuthModalProps = {
  open: boolean;
  mode: AuthMode;
  next?: string;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
};

export function AuthModal({
  open,
  mode,
  next = "/app",
  onClose,
  onModeChange,
}: AuthModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("input")?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--foreground)_45%,transparent)] backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_24px_64px_-24px_rgba(26,34,38,0.45)] animate-[fadeUp_0.28s_ease-out_both]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_at_top,var(--accent-soft),transparent_70%)]"
        />
        <div className="relative px-6 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                id={titleId}
                className="font-[family-name:var(--font-fraunces)] text-2xl tracking-tight text-foreground"
              >
                {mode === "signup" ? "Create account" : "Welcome back"}
              </p>
              <p className="mt-1 text-sm text-muted">
                {mode === "signup"
                  ? "Upload labs and save confirmed reports."
                  : "Sign in to continue to your uploads."}
              </p>
            </div>
            <CloseButton onClick={onClose} label="Close dialog" />
          </div>

          <div
            className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-surface-muted p-1"
            role="tablist"
            aria-label="Authentication mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                mode === "login"
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
              onClick={() => onModeChange("login")}
            >
              Log in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                mode === "signup"
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
              onClick={() => onModeChange("signup")}
            >
              Sign up
            </button>
          </div>

          <div className="mt-5">
            <AuthForm
              mode={mode}
              nextPath={next}
              embedded
              onModeChange={onModeChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
