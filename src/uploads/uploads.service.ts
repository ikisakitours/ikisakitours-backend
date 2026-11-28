import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { R2_CLIENT } from './r2.provider';
import { deleteR2Asset } from './r2-delete.util';

@Injectable()
export class UploadsService {
  constructor(
    @Inject(R2_CLIENT) private readonly r2Client: S3Client,
    private readonly configService: ConfigService,
  ) {}

  async uploadImage(
    file: Express.Multer.File,
    folder = 'general',
  ): Promise<string> {
    const key = `${folder}/${randomUUID()}-${file.originalname}`;

    await this.r2Client.send(
      new PutObjectCommand({
        Bucket: this.configService.get('R2_BUCKET_NAME'),
        Key: key,
        ContentType: file.mimetype,
        Body: file.buffer,
      }),
    );

    const publicUrl = this.configService.get('R2_PUBLIC_URL');
    return `${publicUrl}/${key}`;
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    folder = 'general',
  ): Promise<string[]> {
    return Promise.all(files.map((file) => this.uploadImage(file, folder)));
  }

  async deleteAsset(fileUrlOrKey?: string | null): Promise<boolean> {
    const bucketName = this.configService.get<string>('R2_BUCKET_NAME') || '';
    return deleteR2Asset(this.r2Client, bucketName, fileUrlOrKey);
  }

  /**
   * Deletes multiple R2 assets concurrently without throwing on individual failures.
   */
  async deleteAssets(
    fileUrlsOrKeys: (string | null | undefined)[],
  ): Promise<void> {
    const uniqueTargets = Array.from(
      new Set(fileUrlsOrKeys.filter((u): u is string => Boolean(u && u.trim()))),
    );
    if (uniqueTargets.length === 0) return;

    await Promise.allSettled(
      uniqueTargets.map((target) => this.deleteAsset(target)),
    );
  }

  /**
   * Compares previous vs next image URL lists and purges removed assets from Cloudflare R2.
   */
  async cleanupRemovedAssets(
    previousUrls: string[] = [],
    nextUrls: string[] = [],
  ): Promise<void> {
    const nextSet = new Set(nextUrls);
    const removed = previousUrls.filter((url) => url && !nextSet.has(url));
    if (removed.length > 0) {
      await this.deleteAssets(removed);
    }
  }

  /**
   * Generates short-lived (5 min) Cloudflare R2 Presigned PUT URLs for direct browser uploads.
   */
  async generatePresignedUrls(
    files: { filename: string; contentType?: string; folder?: string }[],
  ): Promise<{ uploadUrl: string; publicUrl: string; key: string }[]> {
    const bucketName = this.configService.get<string>('R2_BUCKET_NAME');
    const publicBaseUrl = (
      this.configService.get<string>('R2_PUBLIC_URL') || ''
    ).replace(/\/+$/, '');

    if (!bucketName || !publicBaseUrl) {
      throw new BadRequestException(
        'Cloudflare R2 storage configuration is incomplete on the server.',
      );
    }

    return Promise.all(
      files.map(async (file) => {
        const safeFolder =
          (file.folder || 'general')
            .replace(/\.\./g, '')
            .replace(/^\/+|\/+$/g, '') || 'general';

        const safeFilename = (file.filename || 'image.webp')
          .replace(/[^a-zA-Z0-9._-]/g, '-')
          .replace(/-+/g, '-');

        const key = `${safeFolder}/${randomUUID()}-${safeFilename}`;
        const contentType = file.contentType || 'image/webp';

        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(this.r2Client, command, {
          expiresIn: 300,
        });

        return {
          uploadUrl,
          publicUrl: `${publicBaseUrl}/${key}`,
          key,
        };
      }),
    );
  }
}
