import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Get,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  Headers,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AddpackagesService } from './addpackages.service';
import { CreateAddPackageDto } from './dto/create-addpackage.dto';
import { AddPackageResponseDto } from './dto/addpackage-response.dto';
import { PackageResponseDto } from './dto/PackageResponse.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PackageSummaryResponseDto } from './dto/package-summary-response.dto';
import { PackageListItemDto } from './dto/package-list-item.dto';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { RolesGuard } from '../admin-auth/roles.guard';
import { Roles } from '../admin-auth/roles.decorator';
import { AdminRole } from '../admin-auth/roles.enum';

export enum PackageType {
  ONE_DAY = 'oneday',
  MULTI_DAY = 'multiday',
}

@Controller(['packages', 'addpackages'])
export class AddpackagesController {
  constructor(private readonly addpackagesService: AddpackagesService) {}

  @Post()
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.PACKAGE_MANAGER)
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Body() createDto: CreateAddPackageDto,
    @UploadedFiles() images: Express.Multer.File[],
  ): Promise<AddPackageResponseDto> {
    console.log('Parsed DTO:', createDto);
    return await this.addpackagesService.create(createDto, images);
  }

  // ==========================================
  // 1. STATIC & GENERAL GET ROUTES (MUST BE FIRST)
  // ==========================================

  // --- ADMIN FETCH ALL PACKAGES (Live + Hidden) ---
  @Get('admin')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.PACKAGE_MANAGER)
  async findAllAdmin(
    @Query('lang') lang: string = 'en',
  ): Promise<PackageListItemDto[]> {
    return await this.addpackagesService.findAll(lang, false);
  }

  // --- FIND PACKAGES (Public filters WHERE isLive = true, Admin sees all) ---
  @Get()
  async findAll(
    @Query('lang') lang: string = 'en',
    @Headers('x-admin-key') adminKey?: string,
    @Req() req?: Request,
  ): Promise<PackageListItemDto[]> {
    const isAdmin = Boolean(
      (adminKey &&
        process.env.ADMIN_API_KEY &&
        adminKey === process.env.ADMIN_API_KEY) ||
      req?.cookies?.['admin_session'] ||
      req?.originalUrl?.includes('/addpackages'),
    );
    return await this.addpackagesService.findAll(lang, !isAdmin);
  }

  // --- PREVIEWS ROUTE (Live only) ---
  @Get('previews')
  async findPreviews(
    @Query('lang') lang: string = 'en',
  ): Promise<PackageListItemDto[]> {
    return await this.addpackagesService.findAll(lang, true);
  }

  // --- ONE DAY SUMMARIES ROUTE ---
  @Get('oneday')
  async findOndayPackageSummaries(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '5',
    @Query('lang') lang: string = 'en',
  ): Promise<{
    data: PackageSummaryResponseDto[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 5);
    return await this.addpackagesService.findSummariesPaginated(
      pageNum,
      limitNum,
      'oneday',
      lang,
    );
  }

  // --- MULTI DAY SUMMARIES ROUTE ---
  @Get('multiday')
  async findMultidayPackageSummaries(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '5',
    @Query('lang') lang: string = 'en',
  ): Promise<{
    data: PackageSummaryResponseDto[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 5);
    return await this.addpackagesService.findSummariesPaginated(
      pageNum,
      limitNum,
      'multiday',
      lang,
    );
  }

  // ==========================================
  // 2. DYNAMIC PARAMETER ROUTES (MUST BE LAST)
  // ==========================================

  // --- TOGGLE VISIBILITY (isLive) ---
  @Patch(':slug/visibility')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.PACKAGE_MANAGER)
  async updateVisibility(
    @Param('slug') slug: string,
    @Body('isLive') isLive: boolean,
  ) {
    return await this.addpackagesService.updateVisibility(slug, isLive);
  }

  // --- FIND ONE PACKAGE BY SLUG ---
  @Get(':slug')
  async findOne(
    @Param('slug') slug: string,
    @Query('lang') lang?: string,
    @Headers('x-admin-key') adminKey?: string,
    @Req() req?: Request,
  ) {
    const isAdmin = Boolean(
      (adminKey &&
        process.env.ADMIN_API_KEY &&
        adminKey === process.env.ADMIN_API_KEY) ||
      req?.cookies?.['admin_session'],
    );
    return await this.addpackagesService.findOne(slug, lang, isAdmin);
  }

  // --- TEXT-ONLY UPDATE BY SLUG ---
  @Patch(':slug')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.PACKAGE_MANAGER)
  async updateTextOnly(
    @Param('slug') slug: string,
    @Body() updateDto: Partial<CreateAddPackageDto>,
  ): Promise<PackageResponseDto> {
    return await this.addpackagesService.updateTextOnly(slug, updateDto);
  }

  // --- DELETE PACKAGE BY SLUG ---
  @Delete(':slug')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.PACKAGE_MANAGER)
  async remove(@Param('slug') slug: string) {
    return await this.addpackagesService.remove(slug);
  }

  // --- TOGGLE LIKE / UNLIKE ROUTE ---
  @Post(':packageId/like')
  async toggleLike(
    @Param('packageId') packageId: string,
    @Body('userId') userId: string,
  ) {
    return await this.addpackagesService.toggleLike(packageId, userId);
  }

  // --- CHECK IF USER HAS LIKED A PACKAGE ---
  @Get(':packageId/like')
  async hasLiked(
    @Param('packageId') packageId: string,
    @Query('userId') userId: string,
  ) {
    return await this.addpackagesService.hasLiked(packageId, userId);
  }
}
