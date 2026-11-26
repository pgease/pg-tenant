const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Format INR in Indian grouping with no trailing .00 unless non-zero paise exist.
 * Examples: 6500 -> "₹6,500", 120000 -> "₹1,20,000", 50016.9 -> "₹50,016.90".
 */
export function formatINR(amount: number | string | null | undefined, opts?: { compact?: boolean }): string {
  const num = typeof amount === 'string' ? Number(amount.replace(/,/g, '').trim()) : Number(amount ?? 0);
  if (!Number.isFinite(num)) return '₹0';

  if (opts?.compact && Math.abs(num) >= 100000) {
    const lakhs = num / 100000;
    const formatted = Number.isInteger(lakhs) ? String(lakhs) : lakhs.toFixed(1).replace(/\.0$/, '');
    return `₹${formatted}L`;
  }

  const hasPaise = Math.abs(Math.round(num * 100) % 100) > 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  }).format(num);
}

/**
 * Convert "2026-11" or "11/2026" to "November 2026".
 */
export function formatPeriod(period: string | null | undefined): string {
  if (!period) return '';
  const raw = String(period).trim();
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})$/);
  if (isoMatch) {
    const year = isoMatch[1];
    const mIdx = Number(isoMatch[2]) - 1;
    if (mIdx >= 0 && mIdx < 12) return `${MONTHS[mIdx]} ${year}`;
  }
  const slashMatch = raw.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const mIdx = Number(slashMatch[1]) - 1;
    if (mIdx >= 0 && mIdx < 12) return `${MONTHS[mIdx]} ${slashMatch[2]}`;
  }
  return raw;
}

/**
 * Format date as dd/mm/yyyy in Asia/Kolkata.
 */
export function formatDateIN(dateInput: string | Date | number | null | undefined): string {
  if (!dateInput) return '—';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Fix accidental duplicated initial characters (e.g. "SShivam" -> "Shivam") while preserving real double letters.
 */
export function sanitizeDisplayName(name: string | null | undefined): string {
  const trimmed = String(name ?? '').trim();
  if (!trimmed || trimmed.startsWith('user_')) return '';
  if (trimmed.length >= 3 && trimmed[0] === trimmed[1] && trimmed[0] === trimmed[0].toUpperCase() && trimmed[2] === trimmed[2].toLowerCase()) {
    return trimmed.slice(1);
  }
  return trimmed;
}
