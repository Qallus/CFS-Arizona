/**
 * Calendar-date helpers.
 *
 * The recurring bug these exist to prevent: `new Date('2026-08-15')` parses as
 * UTC midnight, and `new Date('2026-08-15T00:00:00+00:00')` — what Postgres
 * returns for a TIMESTAMPTZ date — is the same instant. Rendered through the
 * browser's local timezone in Arizona (UTC-7) both become 5pm on the 14th, so
 * a deadline set to the 15th displays as the 14th.
 *
 * These are calendar dates, not instants. Read the date portion as written and
 * never round-trip it through a timezone.
 */

/** Parse the leading YYYY-MM-DD of a date or timestamp string as a LOCAL date. */
export function parseLocalDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Format a local Date as 'YYYY-MM-DD' without a UTC round-trip. */
export function toLocalIsoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Display a stored date or timestamp as a plain calendar date.
 * Returns '—' for null so callers do not each invent a placeholder.
 */
export function formatDateOnly(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
): string {
  const d = parseLocalDate(value);
  return d ? d.toLocaleDateString('en-US', options) : '—';
}
