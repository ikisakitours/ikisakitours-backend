import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactResponseDto } from './dto/contact-response.dto';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  // PUBLIC: Submit contact form from the front-end web app
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createContactDto: CreateContactDto): Promise<ContactResponseDto> {
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
}