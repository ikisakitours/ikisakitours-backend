/**
 * Clean character set excluding ambiguous characters (0, O, 1, I)
 * to prevent customer and operator confusion.
 */
const CLEAN_ALPHANUMERIC_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateCleanCode(length: number): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CLEAN_ALPHANUMERIC_CHARS.charAt(
      Math.floor(Math.random() * CLEAN_ALPHANUMERIC_CHARS.length),
    );
  }
  return code;
}

/**
 * Customer Reference ID
 * Format: IKISAKI-XXXXXX (6 alphanumeric chars)
 * Example: "IKISAKI-8F42M9"
 */
export function generateCustomerReferenceId(): string {
  return `IKISAKI-${generateCleanCode(6)}`;
}

/**
 * Tour Service Request Reference ID
 * Format: SRV-XXXXXXXX (8 alphanumeric chars)
 * Example: "SRV-8F42M9K2"
 */
export function generateServiceReferenceId(): string {
  return `SRV-${generateCleanCode(8)}`;
}

/**
 * Contact Inquiry Reference ID
 * Format: INQ-XXXXXXXX (8 alphanumeric chars)
 * Example: "INQ-7D34X8L1"
 */
export function generateInquiryReferenceId(): string {
  return `INQ-${generateCleanCode(8)}`;
}

/**
 * Tour Package Review Reference ID
 * Format: REV-XXXXXXXX (8 alphanumeric chars)
 * Example: "REV-9A23K7T4"
 */
export function generateReviewReferenceId(): string {
  return `REV-${generateCleanCode(8)}`;
}

/**
 * Website Feedback / General Testimonial Reference ID
 * Format: FDB-XXXXXXXX (8 alphanumeric chars)
 * Example: "FDB-6B82V4N8"
 */
export function generateFeedbackReferenceId(): string {
  return `FDB-${generateCleanCode(8)}`;
}

/**
 * FAQ Reference ID
 * Format: FAQ-XXXXXX (6 alphanumeric chars)
 * Example: "FAQ-4P9L2M"
 */
export function generateFaqReferenceId(): string {
  return `FAQ-${generateCleanCode(6)}`;
}
