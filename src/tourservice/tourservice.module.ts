import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ServicesController } from './tourservice.controller';
import { ServicesService } from './tourservice.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}