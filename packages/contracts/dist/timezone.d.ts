/**
 * Canonical Business Timezone & Date Key Utilities
 * All delivery dates, order scheduling, and cutoff rules operate in Asia/Kolkata.
 */
export declare const ASIA_KOLKATA_TIMEZONE = "Asia/Kolkata";
/**
 * Returns current business date in Asia/Kolkata formatted as YYYY-MM-DD
 */
export declare function getKolkataDateString(date?: Date): string;
/**
 * Returns tomorrow's business delivery date in Asia/Kolkata as YYYY-MM-DD
 */
export declare function getKolkataTomorrowDateString(): string;
/**
 * Returns integer day of week in Asia/Kolkata (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export declare function getKolkataDayOfWeek(date?: Date): number;
/**
 * Validates whether string is canonical YYYY-MM-DD
 */
export declare function isValidDateKey(str: string): boolean;
//# sourceMappingURL=timezone.d.ts.map