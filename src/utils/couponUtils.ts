/**
 * Normalizes coupon codes for consistent comparison across Arabic and English.
 * Strips whitespace, converts to uppercase, and normalizes Arabic character variants.
 * 
 * Examples:
 * "خصم الجمعة" -> "خصمالجمعه"
 * "خصم  الجمعة " -> "خصمالجمعه"
 * "WELCOME 10" -> "WELCOME10"
 */
export const normalizeCouponCode = (code: string): string => {
  if (!code) return '';
  return code
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
};
