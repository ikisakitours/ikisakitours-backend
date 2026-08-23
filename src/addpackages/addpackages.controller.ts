import { Controller, Post, Body } from '@nestjs/common';
import { AddpackagesService } from './addpackages.service';
import { CreateAddPackageDto } from './dto/create-addpackage.dto';
import { AddPackageResponseDto } from './dto/addpackage-response.dto';

@Controller('addpackages')
export class AddpackagesController {
  constructor(private readonly addpackagesService: AddpackagesService) {}

  @Post()
  async create(
    @Body() createDto: CreateAddPackageDto,
  ): Promise<AddPackageResponseDto> {
    return await this.addpackagesService.create(createDto);
  }
}