import { Controller, Post, Get, Body, Param, Patch } from '@nestjs/common';
import { CreateCustomServiceDto } from './dto/create-custom-service.dto';
import { CreateChauffeurServiceDto } from './dto/create-chauffeur-service.dto';
import { CreateTransferServiceDto } from './dto/create-transfer-service.dto';
import { ServicesService } from './tourservice.service';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';
import { CreateServiceNotesDto } from './dto/service-notes/create-service-notes.dto';
import { UpdateServiceNotesDto } from './dto/service-notes/update-service-notes.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) { }

  // --- 1. CUSTOM MADE TOURS ---
  @Post('custom')
  async createCustom(@Body() dto: CreateCustomServiceDto) {
    return this.servicesService.createCustomService(dto);
  }

  @Get('custom')
  async findAllCustom() {
    return this.servicesService.findAllByCategory('custom-made');
  }

  // --- 2. PRIVATE CHAUFFEUR ---
  @Post('chauffeur')
  async createChauffeur(@Body() dto: CreateChauffeurServiceDto) {
    return this.servicesService.createChauffeurService(dto);
  }

  @Get('chauffeur')
  async findAllChauffeur() {
    return this.servicesService.findAllByCategory('private-chauffeur');
  }

  // --- 3. TRANSFERS ---
  @Post('transfer')
  async createTransfer(@Body() dto: CreateTransferServiceDto) {
    return this.servicesService.createTransferService(dto);
  }

  @Get('transfer')
  async findAllTransfers() {
    return this.servicesService.findAllByCategory('transfer');
  }

  // --- SERVICE NOTES ENDPOINTS ---
  @Post('notes')
  async createServiceNote(@Body() dto: CreateServiceNotesDto) {
    return this.servicesService.createServiceNote(dto);
  }

  @Get('notes')
  async findAllServiceNotes() {
    return this.servicesService.findAllServiceNotes();
  }

  @Patch('notes/:id')
  async updateServiceNote(
    @Param('id') id: string,
    @Body() dto: UpdateServiceNotesDto,
  ) {
    return this.servicesService.updateServiceNote(id, dto);
  }


  // --- 4. UPDATE SERVICE STATUS ---
  @Patch(':id/status')
  async updateServiceStatus(
    @Param('id') id: string,
    @Body() dto: UpdateServiceStatusDto,
  ) {
    return this.servicesService.updateServiceStatus(id, dto.status);
  }

  // --- TEMPORARY DEBUG ROUTE ---
  @Get('test-debug')
  testDebug() {
    return { status: "Online", timestamp: new Date().toISOString() };
  }
}