import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ServicePricingService } from './servicepricing.service';
import { CreateServicePricingDto } from './dto/create-service-pricing.dto';
import { UpdateServicePricingDto } from './dto/update-service-pricing.dto';

@Controller(['service-pricing', 'charter-pricing', 'api/service-pricing', 'api/charter-pricing'])
export class ServicePricingController {
  constructor(private readonly servicePricingService: ServicePricingService) {}

  // 1. GET /service-pricing - Fetch all pricing configurations (charter, custom, transfer)
  @Get()
  async getAllPricing() {
    return this.servicePricingService.getAllPricing();
  }

  // 2. GET /service-pricing/:serviceType - Fetch specific pricing by service type
  @Get(':serviceType')
  async getPricingByServiceType(@Param('serviceType') serviceType: string) {
    return this.servicePricingService.getPricingByServiceType(serviceType);
  }

  // 3. POST /service-pricing - Create or upsert pricing record
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPricing(@Body() dto: CreateServicePricingDto) {
    return this.servicePricingService.createPricing(dto);
  }

  // 4. PATCH /service-pricing/:serviceType - Update existing pricing record
  @Patch(':serviceType')
  async updatePricing(
    @Param('serviceType') serviceType: string,
    @Body() dto: UpdateServicePricingDto,
  ) {
    return this.servicePricingService.updatePricing(serviceType, dto);
  }

  // 5. DELETE /service-pricing/:serviceType - Remove pricing record
  @Delete(':serviceType')
  async deletePricing(@Param('serviceType') serviceType: string) {
    return this.servicePricingService.deletePricing(serviceType);
  }
}
