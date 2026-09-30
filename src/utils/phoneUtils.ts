/**
 * Saudi phone number utility functions
 */

/** Convert Arabic-Indic digits (٠-٩) to Western digits (0-9) */
function arabicToWestern(str: string): string {
  return str.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/** Normalize a Saudi phone number to 05xxxxxxxx format (10 digits) */
export function normalizeSaudiPhone(raw: string): string {
  const cleaned = arabicToWestern(raw).replace(/\D/g, '');
  // +966XXXXXXXXX or 00966XXXXXXXXX → 0XXXXXXXXX
  if (cleaned.startsWith('966') && cleaned.length === 12) return '0' + cleaned.slice(3);
  if (cleaned.startsWith('00966') && cleaned.length === 14) return '0' + cleaned.slice(5);
  // 5XXXXXXXXX (9 digits) → 05XXXXXXXXX
  if (cleaned.length === 9 && cleaned.startsWith('5')) return '0' + cleaned;
  return cleaned;
}

/** Returns true if the phone is a valid Saudi mobile number */
export function isValidSaudiPhone(raw: string): boolean {
  const normalized = normalizeSaudiPhone(raw);
  return /^05\d{8}$/.test(normalized);
}
