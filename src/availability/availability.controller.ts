import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  async getAvailability(@Query('lang') lang?: string) {
    return this.availabilityService.getAvailability(lang);
  }

  @Post()
  async updateAvailability(@Body() dto: UpdateAvailabilityDto) {
    return this.availabilityService.updateAvailability(dto);
  }
}
