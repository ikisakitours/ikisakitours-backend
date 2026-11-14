import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { LegalDocsService } from './legaldocs.service';
import { CreateLegalDocDto } from './dto/create-legal-doc.dto';
import { UpdateLegalDocDto } from './dto/update-legal-doc.dto';
import { ClientLegalDocResponseDto } from './dto/client-legal-doc-response.dto';

@Controller(['legal-docs', 'legaldocs'])
export class LegalDocsController {
  constructor(private readonly legalDocsService: LegalDocsService) {}

  // =========================================================================
  // ── USER / CLIENT UI ENDPOINT (Single requested language returned) ───────
  // =========================================================================

  // GET /legal-docs/client?lang=en
  @Get('client')
  async getClientAllDocuments(
    @Query('lang') lang: string = 'en',
  ): Promise<ClientLegalDocResponseDto[]> {
    return await this.legalDocsService.getClientAllDocuments(lang);
  }
  
  // GET /legal-docs/client/:id?lang=en (e.g. /api/legal-docs/client/terms?lang=ja)
  @Get('client/:id')
  async getClientDocument(
    @Param('id') id: string,
    @Query('lang') lang: string = 'en',
  ): Promise<ClientLegalDocResponseDto> {
    return await this.legalDocsService.getClientDocumentById(id, lang);
  }

  // =========================================================================
  // ── ADMIN PANEL ENDPOINTS (Full multilingual dictionaries returned) ──────
  // =========================================================================

  // 1. GET /legal-docs - Fetch all legal documents
  @Get()
  async getAllDocuments() {
    return await this.legalDocsService.getAllDocuments();
  }

  // 2. GET /legal-docs/:id - Fetch single document by ID
  @Get(':id')
  async getDocumentById(@Param('id') id: string) {
    return await this.legalDocsService.getDocumentById(id);
  }

  // 3. POST /legal-docs - Insert or upsert new document
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDocument(@Body() dto: CreateLegalDocDto) {
    return await this.legalDocsService.createDocument(dto);
  }

  // 4. PATCH /legal-docs/:id - Update existing document
  @Patch(':id')
  async updateDocument(
    @Param('id') id: string,
    @Body() dto: UpdateLegalDocDto,
  ) {
    return await this.legalDocsService.updateDocument(id, dto);
  }

  // 5. DELETE /legal-docs/:id - Delete document from DB
  @Delete(':id')
  async deleteDocument(@Param('id') id: string) {
    return await this.legalDocsService.deleteDocument(id);
  }
}
