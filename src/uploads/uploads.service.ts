import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
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
}
