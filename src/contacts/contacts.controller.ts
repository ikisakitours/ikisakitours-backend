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
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactResponseDto } from './dto/contact-response.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactStatusDto } from './dto/update-contact-status.dto';

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
  async findAll(): Promise<ContactResponseDto[]> {
    return await this.contactsService.findAll();
  }

  // ADMIN: Fetch a single contact submission by ID
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ContactResponseDto> {
    return await this.contactsService.findOne(id);
  }

  // ADMIN: Update contact status
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateContactStatusDto,
  ): Promise<ContactResponseDto> {
    return await this.contactsService.updateStatus(id, dto.status);
  }

  // ADMIN: Delete contact submission
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.contactsService.remove(id);
  }
}
