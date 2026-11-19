import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { FaqResponseDto } from './dto/faq-response.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Controller('faqs')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  // ADMIN: Get all FAQs (both live and hidden) with isLive boolean flag
  @Get('admin')
  async findAllAdmin() {
    return await this.faqService.findAllAdmin();
  }

  // ADMIN: Get a single FAQ by ID with full raw multilingual objects
  @Get('admin/:id')
  async findOneAdmin(@Param('id') id: string) {
    return await this.faqService.findOneRaw(id);
  }

  // PUBLIC: Get all live FAQs for the client-side app (WHERE isLive = true)
  @Get()
  async findAll(@Query('lang') lang?: string) {
    return await this.faqService.findAll(lang, true);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createFaqDto: CreateFaqDto) {
    return await this.faqService.create(createFaqDto);
  }

  // ADMIN: Toggle visibility (isLive)
  @Patch(':id/visibility')
  async updateVisibility(
    @Param('id') id: string,
    @Body('isLive') isLive: boolean,
  ) {
    return await this.faqService.updateVisibility(id, isLive);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateFaqDto: UpdateFaqDto,
  ) {
    return await this.faqService.update(id, updateFaqDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return await this.faqService.remove(id);
  }
}
