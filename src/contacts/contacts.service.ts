import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { ContactResponseDto } from './dto/contact-response.dto';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  // Helper formatter to transform database row into your Response DTO structure
  private toContactResponseDto(contact: typeof schema.contacts.$inferSelect): ContactResponseDto {
    return {
      id: contact.id,
      inquiryType: contact.inquiryType,
      // Formats timestamp nicely for your admin panel (e.g., "Aug 03, 2026")
      date: new Date(contact.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
      status: contact.status,
      fullName: contact.fullName,
      email: contact.email,
      phone: contact.phone,
      subject: contact.subject,
      message: contact.message,
      tourInterest: contact.tourInterest ?? undefined,
    };
  }

  // Save new contact form submission to the database
  async create(dto: CreateContactDto): Promise<ContactResponseDto> {
    try {
      const [newContact] = await this.db
        .insert(schema.contacts)
        .values({
          fullName: dto.fullName,
          email: dto.email,
          phone: dto.phone,
          inquiryType: dto.inquiryType,
          subject: dto.subject,
          message: dto.message,
          tourInterest: dto.tourInterest || null,
          status: 'Pending Review',
        })
        .returning();

      return this.toContactResponseDto(newContact);
    } catch (error) {
      console.error('Contact Submission Error:', error);
      throw new BadRequestException('Failed to submit contact form');
    }
  }

  // Fetch all contact entries for the admin panel
  async findAll(): Promise<ContactResponseDto[]> {
    const contactsList = await this.db.query.contacts.findMany({
      orderBy: (contacts, { desc }) => [desc(contacts.createdAt)],
    });

    return contactsList.map((contact) => this.toContactResponseDto(contact));
  }

  // Fetch a single entry by ID
  async findOne(id: string): Promise<ContactResponseDto> {
    const contact = await this.db.query.contacts.findFirst({
      where: eq(schema.contacts.id, id),
    });

    if (!contact) {
      throw new NotFoundException(`Contact inquiry with ID "${id}" not found`);
    }

    return this.toContactResponseDto(contact);
  }
}