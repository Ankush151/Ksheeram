/**
 * Formatting utilities for Indian Rupee currency, dates, schedules and status badges.
 */

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string | Date | undefined): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export type FrequencyType = 'daily' | 'alternate' | 'custom';

export function formatSchedule(frequency: FrequencyType, customDays?: number[]): string {
  if (frequency === 'daily') return 'Daily (Every Morning)';
  if (frequency === 'alternate') return 'Alternate Days';
  if (frequency === 'custom' && customDays && customDays.length > 0) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const selected = customDays
      .sort((a, b) => a - b)
      .map((d) => dayNames[d])
      .join(', ');
    return `Weekly: ${selected}`;
  }
  return 'Custom Schedule';
}

/**
 * Creates an official WhatsApp chat link with an optionally pre-filled message
 */
export function buildWhatsAppLink(phoneNumber: string, message: string): string {
  // Strip non-digits
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
