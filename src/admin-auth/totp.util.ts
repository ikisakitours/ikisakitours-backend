import * as crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer to a Base32 string (RFC 4648 without padding)
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

/**
 * Decodes a Base32 string to a Buffer
 */
export function base32Decode(str: string): Buffer {
  const cleaned = str.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) {
      throw new Error(`Invalid Base32 character encountered: ${cleaned[i]}`);
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/**
 * Generates a random Base32 TOTP secret (20 bytes / 160 bits)
 */
export function generateTotpSecret(length: number = 20): string {
  return base32Encode(crypto.randomBytes(length));
}

/**
 * Computes a 6-digit TOTP code for a secret and time offset (RFC 6238)
 */
export function generateTotpCode(
  secret: string,
  timeStepOffset: number = 0,
  stepSec: number = 30,
): string {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / stepSec) + timeStepOffset;

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(timeStep));

  const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (code % 1000000).toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP code with a ±1 time step tolerance window (±30s)
 */
export function verifyTotpCode(
  token: string,
  secret: string,
  window: number = 1,
): boolean {
  if (!token || !secret) return false;
  const cleanedToken = token.trim();
  if (cleanedToken.length !== 6) return false;

  for (let offset = -window; offset <= window; offset++) {
    try {
      if (generateTotpCode(secret, offset) === cleanedToken) {
        return true;
      }
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Builds the otpauth:// URI for Google Authenticator QR Code scanning
 */
export function generateOtpauthUri(options: {
  issuer: string;
  label: string;
  secret: string;
}): string {
  const issuer = encodeURIComponent(options.issuer);
  const label = encodeURIComponent(options.label);
  return `otpauth://totp/${issuer}:${label}?secret=${options.secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}
