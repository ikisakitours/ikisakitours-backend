import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { AdminAuthGuard } from '@/admin-auth/admin-auth.guard';
import { RolesGuard } from '@/admin-auth/roles.guard';
import { Roles } from '@/admin-auth/roles.decorator';
import { AdminRole } from '@/admin-auth/roles.enum';


interface AskChatbotDto {
    message: string;
    locale?: string;
}

@Controller('chatbot')
export class ChatbotController {
    constructor(private readonly chatbotService: ChatbotService) { }

    @Post('ask')
    async ask(@Body() body: AskChatbotDto) {
        const locale = this.normalizeLocale(body.locale);
        return this.chatbotService.ask(body.message ?? '', locale);
    }

    @Get('faqs')
    async getFaqs(@Query('locale') locale?: string) {
        return this.chatbotService.getFaqs(this.normalizeLocale(locale));
    }


    @UseGuards(AdminAuthGuard, RolesGuard)
    @Roles(
        AdminRole.SUPER_ADMIN
    )
    @Post('faqs')
    async createFaq(@Body() body: CreateFaqDto) {
        return this.chatbotService.createFaq(body);
    }

    @UseGuards(AdminAuthGuard, RolesGuard)
    @Roles(
        AdminRole.SUPER_ADMIN
    )
    @Delete('faqs/:id')
    async deleteFaq(@Param('id') id: string) {
        return this.chatbotService.deleteFaq(id);
    }

    @Get('missed')
    async getMissedQuestions() {
        return this.chatbotService.getMissedQuestions();
    }

    private normalizeLocale(locale?: string): string {
        const cleaned = (locale ?? 'en').trim().toLowerCase();
        return cleaned.split(/[-_]/)[0] || 'en';
    }
}