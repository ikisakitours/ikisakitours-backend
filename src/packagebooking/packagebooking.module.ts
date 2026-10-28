import { Module } from '@nestjs/common';
import { PackageBookingController } from './packagebooking.controller';
import { PackageBookingService } from './packagebooking.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PackageBookingController],
  providers: [PackageBookingService],
})
export class PackageBookingModule {}