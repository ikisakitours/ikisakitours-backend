import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Logger } from '@nestjs/common';

const logger = new Logger('R2Cleanup');

/**
 * Extracts object key from a full Cloudflare R2 public URL or key.
 * Example: "https://pub-xxxxxx.r2.dev/admin/avatar-1732025987123.webp" -> "admin/avatar-1732025987123.webp"
 * Example: "https://assets.ikisakitours.com/admin/avatar-1732025987123.webp" -> "admin/avatar-1732025987123.webp"
 * Example: "admin/avatar-1732025987123.webp" -> "admin/avatar-1732025987123.webp"
 */
export function extractR2KeyFromUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('data:')) return null;

  // If already a relative key
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const cleanKey = url.replace(/^\/+/, '');
    return cleanKey || null;
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    // Ignore external placeholders, Google photos, or non-R2 domains
    const isR2Host =
      hostname.includes('r2.dev') ||
      hostname.includes('r2.cloudflarestorage.com') ||
      hostname.includes('cloudflare') ||
      hostname.includes('ikisaki');

    if (!isR2Host) {
      return null;
    }

    const key = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
    return key || null;
  } catch {
    return null;
  }
}

/**
 * Safely deletes an object from Cloudflare R2.
 * Never throws an unhandled exception so database operations proceed smoothly even if the asset was already gone.
 */
export async function deleteR2Asset(
  s3Client?: S3Client | null,
  bucketName?: string | null,
  fileUrlOrKey?: string | null,
): Promise<boolean> {
  if (!fileUrlOrKey || typeof fileUrlOrKey !== 'string') return false;
  if (fileUrlOrKey.startsWith('data:')) return false;

  const key = extractR2KeyFromUrl(fileUrlOrKey);
  if (!key) return false;

  if (!s3Client || !bucketName) {
    logger.warn(
      `[R2 Asset Cleanup Warning] S3Client or bucket name missing. Skipping purge for: ${key}`,
    );
    return false;
  }

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    );
    logger.log(`[R2 Asset Cleaned] Successfully purged orphaned object: ${key}`);
    return true;
  } catch (err: any) {
    logger.warn(
      `[R2 Asset Cleanup Warning] Failed to delete ${key}: ${err.message}`,
    );
    return false;
  }
}
