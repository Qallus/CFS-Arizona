/**
 * The date line and greeting on the Today page.
 *
 * Rendered on the server in the practice's own timezone rather than the
 * server's or the reader's. These deadlines are Arizona court deadlines, so
 * Arizona is the clock that matters — and because the state does not observe
 * daylight saving, a fixed zone stays correct all year.
 *
 * The Today page sets `dynamic = 'force-dynamic'`; without it this would be
 * evaluated once at build time and the date would freeze on the deploy date.
 */
const PRACTICE_TIMEZONE = process.env.PRACTICE_TIMEZONE || 'America/Phoenix';

export function TodayGreeting() {
  const now = new Date();

  const weekday = now.toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: PRACTICE_TIMEZONE,
  });
  const monthDay = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: PRACTICE_TIMEZONE,
  });

  const hour = Number(
    now.toLocaleString('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: PRACTICE_TIMEZONE,
    }),
  );
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.14em] text-brand">
        {weekday} · {monthDay}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {greeting}
      </h1>
    </>
  );
}
