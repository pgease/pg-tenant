/**
 * Date and Time utilities for PG Ease Tenant Application.
 * Timezone: Asia/Kolkata (IST).
 * Standard display format: dd/mm/yyyy
 */

/**
 * Get current date in Asia/Kolkata timezone formatted as YYYY-MM-DD.
 * Supports adding or subtracting offset in days.
 */
export function getKolkataTodayYYYYMMDD(offsetDays: number = 0): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.format(new Date()).split('-').map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    if (offsetDays !== 0) {
      d.setUTCDate(d.getUTCDate() + offsetDays);
    }
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  }
}

/**
 * Formats a date string or Date object to "dd/mm/yyyy" in Asia/Kolkata timezone.
 * Returns empty string for null, undefined, or empty values.
 */
export function formatDateToDDMMYYYY(dateVal?: string | Date | null): string {
  if (!dateVal) return '';

  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    // Fast path for ISO YYYY-MM-DD strings
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-');
      return `${day}/${month}/${year}`;
    }
  }

  try {
    const date = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    if (isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    }).format(date);
  } catch {
    return '';
  }
}

/**
 * Formats a date string or Date object to "dd/mm/yyyy, hh:mm AM/PM" in Asia/Kolkata timezone.
 */
export function formatDateTimeToDDMMYYYY(dateVal?: string | Date | null): string {
  if (!dateVal) return '—';

  try {
    const date = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    if (isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }).format(date);
  } catch {
    return '—';
  }
}

/**
 * Checks if a YYYY-MM-DD date string is strictly in the past (before today in Asia/Kolkata).
 */
export function isPastDateKolkata(dateString: string): boolean {
  if (!dateString) return false;
  const today = getKolkataTodayYYYYMMDD(0);
  return dateString < today;
}
