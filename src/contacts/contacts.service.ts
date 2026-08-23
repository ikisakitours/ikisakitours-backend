import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactResponseDto } from './dto/contact-response.dto';

@Injectable()
export class ContactsService {
  private readonly mockContacts: ContactResponseDto[] = [
    {
      id: 'cnt_01',
      inquiryType: 'Tour Inquiry & Availability',
      date: 'Aug 03, 2026',
      status: 'Pending Review',
      fullName: 'Alexander Knight',
      email: 'alex@example.com',
      phone: '+94 77 123 4567',
      subject: 'AVAILABILITY FOR SIGIRIYA & KANDY 3-DAY TOUR IN SEPTEMBER',
      message:
        'Hi, I would like to check if you have an available driver and guide for a 3-day trip starting September 12th from Colombo.',
    },
    {
      id: 'cnt_02',
      inquiryType: 'General Question',
      date: 'Aug 01, 2026',
      status: 'Reviewed',
      fullName: 'Jessica Taylor',
      email: 'jessica.t@example.com',
      phone: '+1 202 555 0143',
      subject: 'CUSTOM ITINERARY REQUEST',
      message:
        'Hello, can you help us build a custom 5-day nature and wildlife itinerary for a family of 4?',
    },
  ];

  async findAll(): Promise<ContactResponseDto[]> {
    return this.mockContacts;
  }

  async findOne(id: string): Promise<ContactResponseDto> {
    const contact = this.mockContacts.find((item) => item.id === id);

    if (!contact) {
      throw new NotFoundException(`Contact inquiry with ID "${id}" not found`);
    }

    return contact;
  }
}