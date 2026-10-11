/**
 * Canonical Business Timezone & Date Key Utilities
 * All delivery dates, order scheduling, and cutoff rules operate in Asia/Kolkata.
 */

export const ASIA_KOLKATA_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns current business date in Asia/Kolkata formatted as YYYY-MM-DD
 */
export function getKolkataDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: ASIA_KOLKATA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date); // outputs YYYY-MM-DD
}

/**
 * Returns tomorrow's business delivery date in Asia/Kolkata as YYYY-MM-DD
 */
export function getKolkataTomorrowDateString(): string {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return getKolkataDateString(tomorrow);
}

/**
 * Returns integer day of week in Asia/Kolkata (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getKolkataDayOfWeek(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ASIA_KOLKATA_TIMEZONE,
    weekday: 'short',
  }).format(date);

  const days: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return days[parts] ?? 0;
}

/**
 * Validates whether string is canonical YYYY-MM-DD
 */
export function isValidDateKey(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
}
