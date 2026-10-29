import { Controller, Post, Patch, Delete, Body, Get, Param, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { AddpackagesService } from './addpackages.service';
import { CreateAddPackageDto } from './dto/create-addpackage.dto';
import { AddPackageResponseDto } from './dto/addpackage-response.dto';
import { PackageResponseDto } from './dto/PackageResponse.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PackageSummaryResponseDto } from './dto/package-summary-response.dto';

export enum PackageType {
  ONE_DAY = 'oneday',
  MULTI_DAY = 'multiday',
}

@Controller('addpackages')
export class AddpackagesController {
  constructor(private readonly addpackagesService: AddpackagesService) { }

  @Post()
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Body() createDto: CreateAddPackageDto,
    @UploadedFiles() images: Express.Multer.File[],
  ): Promise<AddPackageResponseDto> {
    console.log('Parsed DTO:', createDto);
    return await this.addpackagesService.create(createDto, images);
  }

  // --- GET SINGLE PACKAGE BY SLUG ---
  @Get(':slug')
  async findOne(@Param('slug') slug: string): Promise<PackageResponseDto> {
    return await this.addpackagesService.findOne(slug);
  }

  // --- TEXT-ONLY UPDATE BY SLUG ---
  @Patch(':slug')
  async updateTextOnly(
    @Param('slug') slug: string,
    @Body() updateDto: Partial<CreateAddPackageDto>,
  ): Promise<PackageResponseDto> {
    return await this.addpackagesService.updateTextOnly(slug, updateDto);
  }

  // --- DELETE PACKAGE BY SLUG ---
  @Delete(':slug')
  async remove(@Param('slug') slug: string) {
    return await this.addpackagesService.remove(slug);
  }

  // --- ONE DAY SUMMARIES ROUTE ---
  @Get('oneday')
  async findOndayPackageSummaries(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '5',
  ): Promise<{ data: PackageSummaryResponseDto[]; totalCount: number; hasMore: boolean }> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 5);
    return await this.addpackagesService.findSummariesPaginated(pageNum, limitNum, 'oneday');
  }

  // --- MULTI DAY SUMMARIES ROUTE ---
  @Get('multiday')
  async findMultidayPackageSummaries(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '5',
  ): Promise<{ data: PackageSummaryResponseDto[]; totalCount: number; hasMore: boolean }> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 5);
    return await this.addpackagesService.findSummariesPaginated(pageNum, limitNum, 'multiday');
  }

  // --- TOGGLE LIKE / UNLIKE ROUTE ---
  @Post(':packageId/like')
  async toggleLike(
    @Param('packageId') packageId: string,
    @Body('userId') userId: string,
  ) {
    return await this.addpackagesService.toggleLike(packageId, userId);
  }
}