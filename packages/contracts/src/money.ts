/**
 * Canonical Currency & Paise Conversion Utilities
 * In Ksheeraam, all authoritative financial data (wallet balances, item prices, invoices,
 * payments, ledgers) is stored in integer paise (1 INR = 100 paise).
 */

export function toPaise(inr: number): number {
  return Math.round(inr * 100);
}

export function toINR(paise: number): number {
  return paise / 100;
}

export function formatPaise(paise: number): string {
  const inr = toINR(paise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(inr);
}

export function assertValidIntegerPaise(amount: number, fieldName = 'Amount'): void {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error(`${fieldName} must be a non-negative integer representing paise.`);
  }
}
