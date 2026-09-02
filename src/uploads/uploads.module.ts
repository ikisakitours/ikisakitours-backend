import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { r2Provider } from './r2.provider';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, r2Provider],
  exports: [UploadsService],
})
export class UploadsModule {}