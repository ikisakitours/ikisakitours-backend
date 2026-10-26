import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus, Delete, Param } from '@nestjs/common';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { FaqResponseDto } from './dto/faq-response.dto';

@Controller('faqs')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  // PUBLIC: Get all FAQs for the client-side app
  @Get()
  async findAll(): Promise<FaqResponseDto[]> {
    return await this.faqService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createFaqDto: CreateFaqDto): Promise<FaqResponseDto> {
    return await this.faqService.create(createFaqDto);
  }

  
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return await this.faqService.remove(id);
  }
}