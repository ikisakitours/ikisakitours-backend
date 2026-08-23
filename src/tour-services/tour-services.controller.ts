import { Controller, Get, Param } from '@nestjs/common';
import { TourServicesService } from './tour-services.service';
import { TourServiceResponseDto } from './dto/tour-service-response.dto';

@Controller('services')
export class TourServicesController {
  constructor(private readonly servicesService: TourServicesService) {}

  @Get()
  async findAll(): Promise<TourServiceResponseDto[]> {
    return await this.servicesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TourServiceResponseDto> {
    return await this.servicesService.findOne(id);
  }
}