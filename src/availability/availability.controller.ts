import { Controller, Get, Post, Body } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  async getAvailability() {
    return this.availabilityService.getAvailability();
  }

  @Post()
  async updateAvailability(@Body() dto: UpdateAvailabilityDto) {
    return this.availabilityService.updateAvailability(dto.apiClosedDates);
  }
}