/** Returns an error message string, or null if valid. */

export function validatePhone(v: string): string | null {
  const digits = v.trim();
  if (!digits) return 'Phone number is required';
  if (!/^\d+$/.test(digits)) return 'Phone number must contain digits only (no spaces or symbols)';
  if (digits.length !== 10) return `Phone number must be exactly 10 digits (${digits.length} entered)`;
  return null;
}

export function validateEmail(v: string): string | null {
  const val = v.trim();
  if (!val) return 'Email address is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) return 'Please enter a valid email address (e.g. user@example.com)';
  return null;
}

/** Strips all non-digit characters and trims to 10 chars — use as an onChange filter for phone inputs. */
export function filterPhone(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 10);
}
