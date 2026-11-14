import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ServicePricingService } from './servicepricing.service';
import { CreateServicePricingDto } from './dto/create-service-pricing.dto';
import { UpdateServicePricingDto } from './dto/update-service-pricing.dto';
import { ClientServicePricingResponseDto } from './dto/client-service-pricing-response.dto';

@Controller(['service-pricing', 'charter-pricing'])
export class ServicePricingController {
  constructor(private readonly servicePricingService: ServicePricingService) {}

  // =========================================================================
  // ── USER / CLIENT UI ENDPOINT (Single requested language returned) ───────
  // =========================================================================

  // GET /service-pricing/client/:serviceType?lang=en (e.g. /service-pricing/client/charter?lang=ja)
  @Get('client/:serviceType')
  async getClientPricingByType(
    @Param('serviceType') serviceType: string,
    @Query('lang') lang: string = 'en',
  ): Promise<ClientServicePricingResponseDto> {
    return await this.servicePricingService.getClientPricingByServiceType(serviceType, lang);
  }

  // =========================================================================
  // ── ADMIN PANEL ENDPOINTS (Full multilingual dictionaries returned) ──────
  // =========================================================================

  // 3. GET /service-pricing - Fetch all pricing configurations (charter, custom, transfer)
  @Get()
  async getAllPricing() {
    return await this.servicePricingService.getAllPricing();
  }

  // 4. GET /service-pricing/:serviceType - Fetch specific pricing by service type
  @Get(':serviceType')
  async getPricingByServiceType(@Param('serviceType') serviceType: string) {
    return await this.servicePricingService.getPricingByServiceType(serviceType);
  }

  // 5. POST /service-pricing - Create or upsert pricing record
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPricing(@Body() dto: CreateServicePricingDto) {
    return await this.servicePricingService.createPricing(dto);
  }

  // 6. PATCH /service-pricing/:serviceType - Update existing pricing record
  @Patch(':serviceType')
  async updatePricing(
    @Param('serviceType') serviceType: string,
    @Body() dto: UpdateServicePricingDto,
  ) {
    return await this.servicePricingService.updatePricing(serviceType, dto);
  }

  // 7. DELETE /service-pricing/:serviceType - Remove pricing record
  @Delete(':serviceType')
  async deletePricing(@Param('serviceType') serviceType: string) {
    return await this.servicePricingService.deletePricing(serviceType);
  }
}
