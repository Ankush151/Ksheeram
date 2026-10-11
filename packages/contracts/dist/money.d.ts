/**
 * Canonical Currency & Paise Conversion Utilities
 * In Ksheeraam, all authoritative financial data (wallet balances, item prices, invoices,
 * payments, ledgers) is stored in integer paise (1 INR = 100 paise).
 */
export declare function toPaise(inr: number): number;
export declare function toINR(paise: number): number;
export declare function formatPaise(paise: number): string;
export declare function assertValidIntegerPaise(amount: number, fieldName?: string): void;
//# sourceMappingURL=money.d.ts.map