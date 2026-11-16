import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus, Delete, Param, Query, Patch } from '@nestjs/common';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { FaqResponseDto } from './dto/faq-response.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Controller('faqs')
export class FaqController {
  constructor(private readonly faqService: FaqService) { }

  // ADMIN: Get all FAQs with full raw multilingual objects ({ en, ja })
  @Get('admin')
  async findAllAdmin() {
    return await this.faqService.findAllRaw();
  }


  // ADMIN: Get a single FAQ by ID with full raw multilingual objects
  @Get('admin/:id')
  async findOneAdmin(@Param('id') id: string) {
    return await this.faqService.findOneRaw(id);
  }


  // PUBLIC: Get all FAQs for the client-side app
  @Get()
  async findAll(@Query('lang') lang?: string,) {
    return await this.faqService.findAll(lang);
  }


  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createFaqDto: CreateFaqDto) {
    return await this.faqService.create(createFaqDto);
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