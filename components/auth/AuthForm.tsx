"use client";

import { PasswordField } from "@/components/ui/PasswordField";
import { authClient } from "@/lib/auth/auth-client";
import type { AuthMode } from "@/lib/auth/paths";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AuthFormProps = {
  mode: AuthMode;
  /** Where to go after success (defaults to /app home). */
  nextPath?: string;
  /** Compact layout for modal embedding. */
  embedded?: boolean;
  onModeChange?: (mode: AuthMode) => void;
};

export function AuthForm({
  mode,
  nextPath = "/app",
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
      const dest = nextPath.startsWith("/") ? nextPath : "/app";
      if (mode === "signup") {
        const name = email.trim().split("@")[0] || "Member";
        const { error: signUpError } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name,
          callbackURL: dest,
        });
        if (signUpError) throw new Error(signUpError.message || "Sign up failed");
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email: email.trim(),
          password,
          callbackURL: dest,
        });
        if (signInError) throw new Error(signInError.message || "Log in failed");
      }
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
