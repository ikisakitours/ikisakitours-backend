import { Controller, Post, Body, Get, Param, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { AddpackagesService } from './addpackages.service';
import { CreateAddPackageDto } from './dto/create-addpackage.dto';
import { AddPackageResponseDto } from './dto/addpackage-response.dto';
import { PackageResponseDto } from './dto/PackageResponse.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('addpackages')
export class AddpackagesController {
  constructor(private readonly addpackagesService: AddpackagesService) { }

  /*
  @Post()
  async create(
    @Body() createDto: CreateAddPackageDto,
  ): Promise<AddPackageResponseDto> {
    return await this.addpackagesService.create(createDto);
  }
  */

  @Post()
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Body() createDto: CreateAddPackageDto,
    @UploadedFiles() images: Express.Multer.File[],
  ): Promise<AddPackageResponseDto> {
    console.log('Parsed DTO:', createDto);
    return await this.addpackagesService.create(createDto, images);
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '5',
  ): Promise<{ data: PackageResponseDto[]; totalCount: number; hasMore: boolean }> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 5);

    return await this.addpackagesService.findAllPaginated(pageNum, limitNum);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PackageResponseDto> {
    return await this.addpackagesService.findOne(id);
  }
}