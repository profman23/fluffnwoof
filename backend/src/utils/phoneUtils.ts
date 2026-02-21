/**
 * Normalize phone number to consistent format (0xxxxxxxxx)
 * Handles all common Saudi phone formats:
 * - +9660xxxxxxxx → 0xxxxxxxxx
 * - +966xxxxxxxx  → 0xxxxxxxxx
 * - 9660xxxxxxxx  → 0xxxxxxxxx
 * - 966xxxxxxxx   → 0xxxxxxxxx
 * - 0xxxxxxxxx    → 0xxxxxxxxx (no change)
 */
export const normalizePhone = (phone: string): string => {
  if (!phone) return '';
  let n = String(phone).trim().replace(/[\s\-()]/g, '');
  if (!n) return '';
  // Strip +966 prefix (with or without leading 0 after it)
  if (n.startsWith('+966')) n = n.slice(4);
  else if (n.startsWith('966') && n.length > 10) n = n.slice(3);
  // Remove leading zero(s) then add single 0
  n = n.replace(/^0+/, '');
  return '0' + n;
};

/**
 * Get all possible phone format variants for DB lookup.
 * Used to find owners regardless of how the phone was originally stored.
 */
export const getPhoneVariants = (phone: string): string[] => {
  const normalized = normalizePhone(phone);
  const withoutZero = normalized.slice(1);
  return [
    normalized,               // 0560471874
    `+966${withoutZero}`,     // +966560471874
    `+9660${withoutZero}`,    // +9660560471874
    `966${withoutZero}`,      // 966560471874
    `9660${withoutZero}`,     // 9660560471874
  ];
};
