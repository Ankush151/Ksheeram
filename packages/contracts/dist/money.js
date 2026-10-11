"use strict";
/**
 * Canonical Currency & Paise Conversion Utilities
 * In Ksheeraam, all authoritative financial data (wallet balances, item prices, invoices,
 * payments, ledgers) is stored in integer paise (1 INR = 100 paise).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPaise = toPaise;
exports.toINR = toINR;
exports.formatPaise = formatPaise;
exports.assertValidIntegerPaise = assertValidIntegerPaise;
function toPaise(inr) {
    return Math.round(inr * 100);
}
function toINR(paise) {
    return paise / 100;
}
function formatPaise(paise) {
    const inr = toINR(paise);
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
    }).format(inr);
}
function assertValidIntegerPaise(amount, fieldName = 'Amount') {
    if (!Number.isInteger(amount) || amount < 0) {
        throw new Error(`${fieldName} must be a non-negative integer representing paise.`);
    }
}
//# sourceMappingURL=money.js.map