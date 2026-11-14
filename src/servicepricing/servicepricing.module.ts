import { Module } from '@nestjs/common';
import { ServicePricingController } from './servicepricing.controller';
import { ServicePricingService } from './servicepricing.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ServicePricingController],
  providers: [ServicePricingService],
  exports: [ServicePricingService],
})
export class ServicePricingModule {}
