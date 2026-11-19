import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { DestinationResponseDto } from './dto/destination-response.dto';
import { DestinationPreviewResponseDto } from './dto/destination-preview-response.dto';
import { DestinationMapResponseDto } from './dto/destination-map-response.dto';
import { DestinationPackageResponseDto } from './dto/destination-package-response.dto';

@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  // 1. Create a destination (Admin) - Receives JSON with R2 image URLs
  @Post()
  async create(
    @Body() createDto: CreateDestinationDto,
  ): Promise<DestinationResponseDto> {
    return await this.destinationsService.create(createDto);
  }

  // ADMIN 1: Fetch all raw multilingual destinations for the admin table (MUST be above :id)
  @Get('admin')
  async findAllAdmin() {
    return await this.destinationsService.findAllAdmin();
  }

  // ADMIN 2: Fetch a single raw multilingual destination by ID for the edit form (MUST be above :id)
  @Get('admin/:id')
  async findOneAdmin(@Param('id') id: string) {
    return await this.destinationsService.findOneAdmin(id);
  }

  // 2. Show small preview list for card design in frontend (Live only)
  @Get('previews')
  async findPreviews(
    @Query('lang') lang: string = 'en',
  ): Promise<DestinationPreviewResponseDto[]> {
    return await this.destinationsService.findPreviews(lang, true);
  }

  // Public GET /destinations (Live only)
  @Get()
  async findAll(
    @Query('lang') lang: string = 'en',
  ): Promise<DestinationPreviewResponseDto[]> {
    return await this.destinationsService.findPreviews(lang, true);
  }

  // 3. Fetch destination by Slug (for frontend reader page, MUST be above :id)
  @Get('slug/:slug')
  async findBySlug(
    @Param('slug') slug: string,
    @Query('lang') lang: string = 'en',
    @Headers('x-admin-key') adminKey?: string,
    @Req() req?: Request,
  ): Promise<DestinationResponseDto> {
    const isAdmin = Boolean(
      (adminKey &&
        process.env.ADMIN_API_KEY &&
        adminKey === process.env.ADMIN_API_KEY) ||
      req?.cookies?.['admin_session'],
    );
    return await this.destinationsService.findBySlug(slug, lang, isAdmin);
  }

  @Get('map')
  async findForMap(
    @Query('lang') lang: string = 'en',
  ): Promise<DestinationMapResponseDto[]> {
    return await this.destinationsService.findForMap(lang);
  }

  // Visibility toggle
  @Patch(':id/visibility')
  async updateVisibility(
    @Param('id') id: string,
    @Body('isLive') isLive: boolean,
  ) {
    return await this.destinationsService.updateVisibility(id, isLive);
  }

  // 4. Detailed version for reading a single destination by ID or Slug (Dynamic route MUST be last among GETs)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('lang') lang: string = 'en',
    @Headers('x-admin-key') adminKey?: string,
    @Req() req?: Request,
  ): Promise<DestinationResponseDto> {
    const isAdmin = Boolean(
      (adminKey &&
        process.env.ADMIN_API_KEY &&
        adminKey === process.env.ADMIN_API_KEY) ||
      req?.cookies?.['admin_session'],
    );
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );
    if (!isUuid) {
      return await this.destinationsService.findBySlug(id, lang, isAdmin);
    }
    return await this.destinationsService.findOne(id);
  }

  // ADMIN 3: Update an existing destination by ID
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDestinationDto,
  ) {
    return await this.destinationsService.update(id, updateDto);
  }

  // 5. Delete route
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return await this.destinationsService.remove(id);
  }

  // Fetch package preview data for a list of specific destination IDs
  @Post('package/batch')
  async findPackagePreviewsByIds(
    @Body('ids') ids: string[],
  ): Promise<DestinationPackageResponseDto[]> {
    return await this.destinationsService.findPackagePreviewsByIds(ids);
  }
}
