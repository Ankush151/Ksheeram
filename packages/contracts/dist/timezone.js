"use strict";
/**
 * Canonical Business Timezone & Date Key Utilities
 * All delivery dates, order scheduling, and cutoff rules operate in Asia/Kolkata.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASIA_KOLKATA_TIMEZONE = void 0;
exports.getKolkataDateString = getKolkataDateString;
exports.getKolkataTomorrowDateString = getKolkataTomorrowDateString;
exports.getKolkataDayOfWeek = getKolkataDayOfWeek;
exports.isValidDateKey = isValidDateKey;
exports.ASIA_KOLKATA_TIMEZONE = 'Asia/Kolkata';
/**
 * Returns current business date in Asia/Kolkata formatted as YYYY-MM-DD
 */
function getKolkataDateString(date = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: exports.ASIA_KOLKATA_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    return formatter.format(date); // outputs YYYY-MM-DD
}
/**
 * Returns tomorrow's business delivery date in Asia/Kolkata as YYYY-MM-DD
 */
function getKolkataTomorrowDateString() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return getKolkataDateString(tomorrow);
}
/**
 * Returns integer day of week in Asia/Kolkata (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
function getKolkataDayOfWeek(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: exports.ASIA_KOLKATA_TIMEZONE,
        weekday: 'short',
    }).format(date);
    const days = {
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
function isValidDateKey(str) {
    return /^\d{4}-\d{2}-\d{2}$/.test(str);
}
//# sourceMappingURL=timezone.js.map