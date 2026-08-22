/** Accept YYYY-MM-DD (or full ISO); store noon UTC to avoid timezone day shifts. */
export function parseCollectedAt(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  const day = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!day) return null;
  const y = Number(day[1]);
  const m = Number(day[2]);
  const d = Number(day[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const iso = `${day[1]}-${day[2]}-${day[3]}T12:00:00.000Z`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.getUTCFullYear() !== y || parsed.getUTCMonth() + 1 !== m) {
    return null;
  }
  return iso;
}

/** Format stored ISO collectedAt for `<input type="date">`. */
export function collectedAtToInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const day = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return day?.[1] ?? "";
}
