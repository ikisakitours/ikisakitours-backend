import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { CreateFaqDto } from './dto/create-faq.dto';
import { FaqResponseDto } from './dto/faq-response.dto';
import { eq } from 'drizzle-orm';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Injectable()
export class FaqService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) { }

  private toFaqResponseDto(faq: typeof schema.faqs.$inferSelect, lang: string = 'en'): FaqResponseDto {
    const getLocalizedField = (fieldObj: any) => {
      if (!fieldObj) return '';
      if (typeof fieldObj === 'string') return fieldObj;
      return fieldObj[lang] || fieldObj['en'] || Object.values(fieldObj)[0] || '';
    };

    return {
      id: faq.id,
      category: getLocalizedField(faq.category) as any,
      question: getLocalizedField(faq.question) as any,
      answer: getLocalizedField(faq.answer) as any,
    };
  }

  // ADMIN: Create a new FAQ entry with multilingual JSONB support
  async create(dto: CreateFaqDto): Promise<any> {
    try {
      const [newFaq] = await this.db
        .insert(schema.faqs)
        .values({
          category: dto.category,
          question: dto.question,
          answer: dto.answer,
        })
        .returning();

      return newFaq;
    } catch (error) {
      console.error('FAQ Creation Error:', error);
      throw new BadRequestException('Failed to create FAQ');
    }
  }

  // PUBLIC/CLIENT vs ADMIN: Fetch all FAQs (flattens if lang is provided, returns raw dictionaries for admin if lang is omitted)
  async findAll(lang?: string): Promise<any> {
    const faqList = await this.db.query.faqs.findMany({
      orderBy: (faqs, { desc }) => [desc(faqs.createdAt)],
    });

    if (lang) {
      return faqList.map((faq) => this.toFaqResponseDto(faq, lang));
    }

    return faqList;
  }

  // ADMIN: Delete an FAQ entry by ID
  async remove(id: string): Promise<{ message: string }> {
    const faq = await this.db.query.faqs.findFirst({
      where: eq(schema.faqs.id, id),
    });

    if (!faq) {
      throw new NotFoundException(`FAQ with ID "${id}" not found`);
    }

    await this.db.delete(schema.faqs).where(eq(schema.faqs.id, id));

    return { message: 'FAQ deleted successfully' };
  }

  //admin update any faq
  async update(id: string, updateFaqDto: UpdateFaqDto) {
    const updatedRecord = await this.db
      .update(schema.faqs)
      .set(updateFaqDto) // Updates whatever fields (question, answer, etc.) are passed
      .where(eq(schema.faqs.id, id))
      .returning();

    if (!updatedRecord || updatedRecord.length === 0) {
      throw new NotFoundException(`FAQ with ID ${id} not found.`);
    }

    return {
      success: true,
      message: 'FAQ successfully updated',
      faq: updatedRecord[0],
    };
  }

  // Returns raw database rows (full { en, ja } objects) for the Admin List
  async findAllRaw() {
    return await this.db.query.faqs.findMany({
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });
  }

  // Returns a single raw database row by ID to pre-fill the Admin Edit Form
  async findOneRaw(id: string) {
    const faq = await this.db.query.faqs.findFirst({
      where: eq(schema.faqs.id, id),
    });

    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found.`);
    }

    return faq;
  }
}