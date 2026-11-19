/**
 * Generates a branded 6-character clean alphanumeric reference ID.
 * Excludes ambiguous characters (0, O, 1, I) to prevent customer confusion.
 * Example: "IKISAKI-8F42M9"
 */
export function generateCustomerReferenceId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `IKISAKI-${code}`;
}
