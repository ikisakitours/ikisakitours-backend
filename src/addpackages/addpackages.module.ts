import { Module } from '@nestjs/common';
import { AddpackagesController } from './addpackages.controller';
import { AddpackagesService } from './addpackages.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [AddpackagesController],
  providers: [AddpackagesService]
})
export class AddpackagesModule {}
