import { Controller, Get, Param } from '@nestjs/common';
import { ToursService } from './tours.service';
import { TourResponseDto } from './dto/tour-response.dto';

@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Get()
  async findAll(): Promise<TourResponseDto[]> {
    return await this.toursService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TourResponseDto> {
    return await this.toursService.findOne(id);
  }
}