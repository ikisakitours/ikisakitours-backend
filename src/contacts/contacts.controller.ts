import { Controller, Get, Param } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactResponseDto } from './dto/contact-response.dto';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  async findAll(): Promise<ContactResponseDto[]> {
    return await this.contactsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ContactResponseDto> {
    return await this.contactsService.findOne(id);
  }
}