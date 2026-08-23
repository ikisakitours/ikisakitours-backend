import { Module } from '@nestjs/common';
import { TourServicesController } from './tour-services.controller';
import { TourServicesService } from './tour-services.service';

@Module({
  controllers: [TourServicesController],
  providers: [TourServicesService],
})
export class TourServicesModule {}