import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { CreateFaqDto } from './dto/create-faq.dto';
import { FaqResponseDto } from './dto/faq-response.dto';

@Injectable()
export class FaqService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  private toFaqResponseDto(faq: typeof schema.faqs.$inferSelect): FaqResponseDto {
    return {
      id: faq.id,
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
    };
  }

  // ADMIN: Create a new FAQ entry
  async create(dto: CreateFaqDto): Promise<FaqResponseDto> {
    try {
      const [newFaq] = await this.db
        .insert(schema.faqs)
        .values({
          category: dto.category,
          question: dto.question,
          answer: dto.answer,
        })
        .returning();

      return this.toFaqResponseDto(newFaq);
    } catch (error) {
      console.error('FAQ Creation Error:', error);
      throw new BadRequestException('Failed to create FAQ');
    }
  }

  // PUBLIC/CLIENT: Fetch all FAQs
  async findAll(): Promise<FaqResponseDto[]> {
    const faqList = await this.db.query.faqs.findMany({
      orderBy: (faqs, { desc }) => [desc(faqs.createdAt)],
    });

    return faqList.map((faq) => this.toFaqResponseDto(faq));
  }
}