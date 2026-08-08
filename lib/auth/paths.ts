export type AuthMode = "login" | "signup";

/** Home-page auth popup deep link. */
export function authHref(mode: AuthMode, next = "/upload"): string {
  const params = new URLSearchParams({ auth: mode, next });
  return `/?${params.toString()}`;
}
