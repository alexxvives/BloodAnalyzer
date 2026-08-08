"use client";

import { PasswordField } from "@/components/ui/PasswordField";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AuthMode } from "@/lib/auth/paths";

type AuthFormProps = {
  mode: AuthMode;
  /** Where to go after success (defaults to /upload). */
  nextPath?: string;
  /** Compact layout for modal embedding. */
  embedded?: boolean;
  onModeChange?: (mode: AuthMode) => void;
};

export function AuthForm({
  mode,
  nextPath = "/upload",
  embedded = false,
  onModeChange,
}: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      const dest = nextPath.startsWith("/") ? nextPath : "/upload";
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full space-y-3.5">
      <label className="block text-sm">
        <span className="text-muted">Email</span>
        <input
          type="email"
          required
          className="ba-field mt-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
        />
      </label>
      <PasswordField
        label="Password"
        required
        minLength={8}
        value={password}
        onChange={setPassword}
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
      />

      {error ? <p className="text-sm text-status-attention">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="ba-btn ba-btn-primary w-full"
      >
        {busy
          ? "Working…"
          : mode === "signup"
            ? "Create account"
            : "Log in"}
      </button>

      {!embedded && onModeChange ? (
        <p className="text-center text-sm text-muted">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="text-accent hover:underline"
                onClick={() => onModeChange("login")}
              >
                Log in
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button
                type="button"
                className="text-accent hover:underline"
                onClick={() => onModeChange("signup")}
              >
                Sign up
              </button>
            </>
          )}
        </p>
      ) : null}
    </form>
  );
}
