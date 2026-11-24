import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { CreateFaqDto } from './dto/create-faq.dto';
import { FaqResponseDto } from './dto/faq-response.dto';
import { eq } from 'drizzle-orm';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { generateFaqReferenceId } from '../common/utils/reference-id.util';

@Injectable()
export class FaqService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  private async ensureFaqReferenceId(
    faq: typeof schema.faqs.$inferSelect,
  ): Promise<typeof schema.faqs.$inferSelect> {
    if (faq.referenceId) {
      return faq;
    }
    const referenceId = generateFaqReferenceId();
    try {
      const [updated] = await this.db
        .update(schema.faqs)
        .set({ referenceId })
        .where(eq(schema.faqs.id, faq.id))
        .returning();
      return updated || { ...faq, referenceId };
    } catch {
      return { ...faq, referenceId };
    }
  }

  private toFaqResponseDto(
    faq: typeof schema.faqs.$inferSelect,
    lang: string = 'en',
  ): FaqResponseDto {
    const getLocalizedField = (fieldObj: any) => {
      if (!fieldObj) return '';
      if (typeof fieldObj === 'string') return fieldObj;
      return (
        fieldObj[lang] || fieldObj['en'] || Object.values(fieldObj)[0] || ''
      );
    };

    return {
      id: faq.id,
      referenceId: faq.referenceId || generateFaqReferenceId(),
      category: getLocalizedField(faq.category),
      question: getLocalizedField(faq.question),
      answer: getLocalizedField(faq.answer),
    };
  }

  // ADMIN: Create a new FAQ entry with multilingual JSONB support
  async create(dto: CreateFaqDto): Promise<any> {
    try {
      const [newFaq] = await this.db
        .insert(schema.faqs)
        .values({
          referenceId: generateFaqReferenceId(),
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
  async findAll(lang?: string, onlyLive: boolean = true): Promise<any> {
    const faqList = await this.db.query.faqs.findMany({
      where: onlyLive ? eq(schema.faqs.isLive, true) : undefined,
      orderBy: (faqs, { desc }) => [desc(faqs.createdAt)],
    });

    const ensuredList = await Promise.all(
      faqList.map((faq) => this.ensureFaqReferenceId(faq)),
    );

    if (lang) {
      return ensuredList.map((faq) => this.toFaqResponseDto(faq, lang));
    }

    return ensuredList;
  }

  // ADMIN: Fetch all FAQs (both live and hidden) with isLive boolean flag
  async findAllAdmin(): Promise<any> {
    const list = await this.db.query.faqs.findMany({
      orderBy: (faqs, { desc }) => [desc(faqs.createdAt)],
    });
    return await Promise.all(list.map((faq) => this.ensureFaqReferenceId(faq)));
  }

  // ADMIN: Update visibility (isLive)
  async updateVisibility(id: string, isLive: boolean): Promise<any> {
    const [updated] = await this.db
      .update(schema.faqs)
      .set({ isLive })
      .where(eq(schema.faqs.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException(`FAQ with ID "${id}" not found`);
    }

    return updated;
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

  // ADMIN: Update any FAQ
  async update(id: string, updateFaqDto: UpdateFaqDto) {
    const updatedRecord = await this.db
      .update(schema.faqs)
      .set(updateFaqDto)
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
    const list = await this.db.query.faqs.findMany({
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });
    return await Promise.all(list.map((faq) => this.ensureFaqReferenceId(faq)));
  }

  // Returns a single raw database row by ID to pre-fill the Admin Edit Form
  async findOneRaw(id: string) {
    const faq = await this.db.query.faqs.findFirst({
      where: eq(schema.faqs.id, id),
    });

    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found.`);
    }

    return await this.ensureFaqReferenceId(faq);
  }
}
