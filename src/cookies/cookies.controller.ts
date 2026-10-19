import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CookiesService } from './cookies.service';
import { SaveConsentDto } from './dto/save-consent.dto';

@Controller('cookies')
export class CookiesController {
  constructor(private readonly cookiesService: CookiesService) {}

  @Post('consent')
  @HttpCode(HttpStatus.OK)
  async saveConsent(@Body() dto: SaveConsentDto) {
    return this.cookiesService.saveConsent(dto);
  }

  @Get('consent/:userId')
  async getConsent(@Param('userId') userId: string) {
    return this.cookiesService.getConsent(userId);
  }
}