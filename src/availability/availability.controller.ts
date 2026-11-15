import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // Client UI explicit endpoint: GET /api/availability/client?lang=en
  @Get('client')
  async getClientAvailability(@Query('lang') lang: string = 'en') {
    return this.availabilityService.getAvailability(lang);
  }

  // General endpoint:
  // - Admin Panel (No lang query): GET /api/availability -> returns raw data with all languages
  // - Client UI (With lang query): GET /api/availability?lang=en -> returns single language filtered data
  @Get()
  async getAvailability(@Query('lang') lang?: string) {
    return this.availabilityService.getAvailability(lang);
  }

  @Post()
  async updateAvailability(@Body() dto: UpdateAvailabilityDto) {
    return this.availabilityService.updateAvailability(dto);
  }
}
