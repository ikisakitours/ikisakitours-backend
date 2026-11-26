import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { CreateFaqDto } from './dto/create-faq.dto';

type SupportedLocale = 'en' | 'ja';

interface AskChatbotDto {
  message: string;
  locale?: string;
}

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('ask')
  async ask(@Body() body: AskChatbotDto) {
    const locale = this.normalizeLocale(body.locale);
    return this.chatbotService.ask(body.message ?? '', locale);
  }

  @Get('faqs')
  async getFaqs(@Query('locale') locale?: string) {
    return this.chatbotService.getFaqs(this.normalizeLocale(locale));
  }

  @Post('faqs')
  async createFaq(@Body() body: CreateFaqDto) {
    return this.chatbotService.createFaq(body);
  }

  @Delete('faqs/:id')
  async deleteFaq(@Param('id') id: string) {
    return this.chatbotService.deleteFaq(id);
  }

  @Get('missed')
  async getMissedQuestions() {
    return this.chatbotService.getMissedQuestions();
  }

  private normalizeLocale(locale?: string): SupportedLocale {
    return locale?.toLowerCase().startsWith('ja') ? 'ja' : 'en';
  }
}