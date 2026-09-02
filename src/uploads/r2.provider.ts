import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

export const R2_CLIENT = 'R2_CLIENT';

export const r2Provider = {
  provide: R2_CLIENT,
  useFactory: (configService: ConfigService) => {
    return new S3Client({
      region: 'auto',
      endpoint: `https://${configService.getOrThrow('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: configService.getOrThrow('R2_ACCESS_KEY_ID'),
        secretAccessKey: configService.getOrThrow('R2_SECRET_ACCESS_KEY'),
      },
    });
  },
  inject: [ConfigService],
};