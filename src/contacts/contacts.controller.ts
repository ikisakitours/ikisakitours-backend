import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactResponseDto } from './dto/contact-response.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactStatusDto } from './dto/update-contact-status.dto';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { RolesGuard } from '../admin-auth/roles.guard';
import { Roles } from '../admin-auth/roles.decorator';
import { AdminRole } from '../admin-auth/roles.enum';

@Controller(['contact', 'contacts'])
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  // PUBLIC: Submit contact form from the front-end web app
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createContactDto: CreateContactDto,
  ): Promise<ContactResponseDto> {
    return await this.contactsService.create(createContactDto);
  }

  // ADMIN: Fetch all contact submissions
  @Get()
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_MANAGER,
    AdminRole.CUSTOMER_SUPPORT,
  )
  async findAll(): Promise<ContactResponseDto[]> {
    return await this.contactsService.findAll();
  }

  // ADMIN: Fetch a single contact submission by ID
  @Get(':id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_MANAGER,
    AdminRole.CUSTOMER_SUPPORT,
  )
  async findOne(@Param('id') id: string): Promise<ContactResponseDto> {
    return await this.contactsService.findOne(id);
  }

  // ADMIN: Update contact status
  @Patch(':id/status')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_MANAGER,
    AdminRole.CUSTOMER_SUPPORT,
  )
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateContactStatusDto,
  ): Promise<ContactResponseDto> {
    return await this.contactsService.updateStatus(id, dto.status);
  }

  // ADMIN: Delete contact submission
  @Delete(':id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_MANAGER,
    AdminRole.CUSTOMER_SUPPORT,
  )
  async remove(@Param('id') id: string) {
    return await this.contactsService.remove(id);
  }
}
