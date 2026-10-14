import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { DestinationResponseDto } from './dto/destination-response.dto';
import { DestinationPreviewResponseDto } from './dto/destination-preview-response.dto';
import { DestinationMapResponseDto } from './dto/destination-map-response.dto';

@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) { }

  // 1. Create a destination (Admin) - Receives JSON with R2 image URLs
  @Post()
  async create(@Body() createDto: CreateDestinationDto): Promise<DestinationResponseDto> {
    return await this.destinationsService.create(createDto);
  }

  // 2. Show small preview list for card design in frontend (MUST be above :id)
  @Get('previews')
  async findPreviews(): Promise<DestinationPreviewResponseDto[]> {
    return await this.destinationsService.findPreviews();
  }

  // 3. Fetch destination by Slug (for frontend reader page, MUST be above :id)
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<DestinationResponseDto> {
    return await this.destinationsService.findBySlug(slug);
  }

  @Get('map')
  async findForMap(): Promise<DestinationMapResponseDto[]> {
    return await this.destinationsService.findForMap();
  }

  // 4. Detailed version for reading a single destination by ID (Dynamic route MUST be last)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<DestinationResponseDto> {
    return await this.destinationsService.findOne(id);
  }

  // 5. Delete route
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return await this.destinationsService.remove(id);
  }
}