import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { CreateCustomServiceDto } from './dto/create-custom-service.dto';
import { CreateChauffeurServiceDto } from './dto/create-chauffeur-service.dto';
import { CreateTransferServiceDto } from './dto/create-transfer-service.dto';
import { ServicesService } from './tourservice.service';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';
import { CreateServiceNotesDto } from './dto/service-notes/create-service-notes.dto';
import { UpdateServiceNotesDto } from './dto/service-notes/update-service-notes.dto';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { RolesGuard } from '../admin-auth/roles.guard';
import { Roles } from '../admin-auth/roles.decorator';
import { AdminRole } from '../admin-auth/roles.enum';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // --- 0. ALL SERVICES (ADMIN) ---
  @Get()
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_MANAGER,
    AdminRole.TRANSPORT_COORDINATOR,
  )
  async findAll(@Headers('x-admin-key') adminKey?: string) {
    return this.servicesService.findAllServices();
  }

  // --- 1. CUSTOM MADE TOURS ---
  @Post('custom')
  async createCustom(@Body() dto: CreateCustomServiceDto) {
    return this.servicesService.createCustomService(dto);
  }

  @Get('custom')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_MANAGER,
    AdminRole.TRANSPORT_COORDINATOR,
  )
  async findAllCustom() {
    return this.servicesService.findAllByCategory('custom-made');
  }

  // --- 2. PRIVATE CHAUFFEUR ---
  @Post('chauffeur')
  async createChauffeur(@Body() dto: CreateChauffeurServiceDto) {
    return this.servicesService.createChauffeurService(dto);
  }

  @Get('chauffeur')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_MANAGER,
    AdminRole.TRANSPORT_COORDINATOR,
  )
  async findAllChauffeur() {
    return this.servicesService.findAllByCategory('private-chauffeur');
  }

  // --- 3. TRANSFERS ---
  @Post('transfer')
  async createTransfer(@Body() dto: CreateTransferServiceDto) {
    return this.servicesService.createTransferService(dto);
  }

  @Get('transfer')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_MANAGER,
    AdminRole.TRANSPORT_COORDINATOR,
  )
  async findAllTransfers() {
    return this.servicesService.findAllByCategory('transfer');
  }

  // --- SERVICE NOTES ENDPOINTS ---
  @Post('notes')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_MANAGER,
    AdminRole.TRANSPORT_COORDINATOR,
  )
  async createServiceNote(@Body() dto: CreateServiceNotesDto) {
    return this.servicesService.createServiceNote(dto);
  }

  @Get('notes')
  async findAllServiceNotes(
    @Query('serviceType') serviceType?: string,
    @Query('lang') lang?: string,
  ) {
    return this.servicesService.findAllServiceNotes(serviceType, lang);
  }

  @Patch('notes/:id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_MANAGER,
    AdminRole.TRANSPORT_COORDINATOR,
  )
  async updateServiceNote(
    @Param('id') id: string,
    @Body() dto: UpdateServiceNotesDto,
  ) {
    return this.servicesService.updateServiceNote(id, dto);
  }

  @Delete('notes/:id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_MANAGER,
    AdminRole.TRANSPORT_COORDINATOR,
  )
  async deleteServiceNote(@Param('id') id: string) {
    return this.servicesService.deleteServiceNote(id);
  }

  // --- 4. UPDATE SERVICE STATUS ---
  @Patch(':id/status')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_MANAGER,
    AdminRole.TRANSPORT_COORDINATOR,
  )
  async updateServiceStatus(
    @Param('id') id: string,
    @Body() dto: UpdateServiceStatusDto,
  ) {
    return this.servicesService.updateServiceStatus(id, dto.status);
  }

  // --- 5. GET SINGLE SERVICE REQUEST BY ID ---
  @Get(':id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_MANAGER,
    AdminRole.TRANSPORT_COORDINATOR,
  )
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOneService(id);
  }

  // --- 6. DELETE SERVICE REQUEST BY ID ---
  @Delete(':id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_MANAGER,
    AdminRole.TRANSPORT_COORDINATOR,
  )
  async remove(@Param('id') id: string) {
    return this.servicesService.deleteService(id);
  }

  // --- TEMPORARY DEBUG ROUTE ---
  @Get('test-debug')
  testDebug() {
    return { status: 'Online', timestamp: new Date().toISOString() };
  }
}
