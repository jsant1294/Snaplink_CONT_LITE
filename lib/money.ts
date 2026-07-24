// ---------------------------------------------------------------------------
// Lucio Financial Copilot — money & date helpers.
// All money fields are INTEGER CENTS (see lib/money-types.ts).
// ---------------------------------------------------------------------------

/** Dollars (or a numeric string) -> integer cents, rounded to avoid float drift. */
export function toCents(dollars: number | string): number {
  const n = typeof dollars === "string" ? parseFloat(dollars) : dollars;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Integer cents -> dollars. */
export function fromCents(cents: number): number {
  return cents / 100;
}

/** Integer cents -> formatted USD string, e.g. "$1,234.56". Locale follows UI language; currency is always USD. */
export function formatCents(cents: number, lang: "en" | "es" = "en"): string {
  return (cents / 100).toLocaleString(lang === "es" ? "es-MX" : "en-US", {
    style: "currency",
    currency: "USD",
  });
}

/** YYYY-MM-DD for today, in local time. */
export function todayIso(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Strict YYYY-MM-DD validity check (rejects malformed/out-of-range dates). */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
