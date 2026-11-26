import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { CreateFaqDto } from './dto/create-faq.dto';

export type LocalizedMap = Record<string, string>;

export interface AskResponse {
  matched: boolean;
  locale: string;
  reply: string;
  topic?: string;
  faqId?: string;
}

type BotFaqRow = typeof schema.botFaqs.$inferSelect;

@Injectable()
export class ChatbotService {
  private readonly minScoreThreshold = 2;

  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async ask(rawMessage: string, locale = 'en'): Promise<AskResponse> {
    const normalizedLocale = this.normalizeLocale(locale);
    const message = rawMessage.trim();

    if (!message) {
      return {
        matched: false,
        locale: normalizedLocale,
        reply: this.getFallbackMessage(normalizedLocale),
      };
    }

    const faqs = await this.db.select().from(schema.botFaqs);
    const normalizedQuery = message.toLowerCase();

    let bestFaq: BotFaqRow | null = null;
    let bestScore = 0;

    for (const faq of faqs) {
      const score = this.scoreFaq(faq, normalizedQuery, normalizedLocale);
      if (score > bestScore) {
        bestScore = score;
        bestFaq = faq;
      }
    }

    if (bestFaq && bestScore >= this.minScoreThreshold) {
      return {
        matched: true,
        locale: normalizedLocale,
        reply: this.pickLocalized(
          bestFaq.answer as LocalizedMap,
          normalizedLocale,
        ),
        topic: bestFaq.topic,
        faqId: bestFaq.id,
      };
    }

    await this.logMissedQuestion(message, normalizedLocale);

    return {
      matched: false,
      locale: normalizedLocale,
      reply: this.getFallbackMessage(normalizedLocale),
    };
  }

  async logMissedQuestion(userMessage: string, locale = 'en'): Promise<void> {
    await this.db.insert(schema.botMissedQuestions).values({
      userMessage: userMessage.trim(),
      locale: this.normalizeLocale(locale),
    });
  }

  async getFaqs(locale = 'en') {
    const normalizedLocale = this.normalizeLocale(locale);
    const rows = await this.db.select().from(schema.botFaqs);
    return rows.map((row) => ({
      id: row.id,
      topic: row.topic,
      question: this.pickLocalized(
        row.question as LocalizedMap,
        normalizedLocale,
      ),
      answer: this.pickLocalized(
        row.answer as LocalizedMap,
        normalizedLocale,
      ),
    }));
  }

  async getMissedQuestions(limit = 50) {
    return this.db
      .select()
      .from(schema.botMissedQuestions)
      .orderBy(desc(schema.botMissedQuestions.createdAt))
      .limit(limit);
  }

  async createFaq(dto: CreateFaqDto) {
    const topic = dto.topic.trim();
    const cleanQuestion = this.sanitizeLocalizedMap(dto.question);
    const cleanAnswer = this.sanitizeLocalizedMap(dto.answer);

    if (
      !topic ||
      Object.keys(cleanQuestion).length === 0 ||
      Object.keys(cleanAnswer).length === 0
    ) {
      throw new BadRequestException(
        'Topic, at least one question translation, and at least one answer translation are required.',
      );
    }

    const cleanKeywords = Array.isArray(dto.keywords)
      ? [...new Set(dto.keywords.map((k) => k.trim()).filter(Boolean))]
      : [];

    const [created] = await this.db
      .insert(schema.botFaqs)
      .values({
        topic,
        question: cleanQuestion,
        answer: cleanAnswer,
        keywords: cleanKeywords,
      })
      .returning();

    if (dto.missedQuestionId) {
      await this.db
        .delete(schema.botMissedQuestions)
        .where(eq(schema.botMissedQuestions.id, dto.missedQuestionId));
    }

    return created;
  }

  async deleteFaq(id: string) {
    const [deleted] = await this.db
      .delete(schema.botFaqs)
      .where(eq(schema.botFaqs.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`FAQ with id ${id} not found.`);
    }

    return { deleted: true, id: deleted.id };
  }

  private scoreFaq(
    faq: BotFaqRow,
    normalizedQuery: string,
    locale: string,
  ): number {
    let score = 0;

    const keywords = Array.isArray(faq.keywords) ? faq.keywords : [];
    for (const kw of keywords) {
      const cleanKw = String(kw).trim().toLowerCase();
      if (cleanKw && normalizedQuery.includes(cleanKw)) {
        score += 3;
      }
    }

    const questionText = this.pickLocalized(
      faq.question as LocalizedMap,
      locale,
    ).toLowerCase();
    const tokens = this.tokenize(normalizedQuery);
    for (const token of tokens) {
      if (token.length >= 2 && questionText.includes(token)) {
        score += 1;
      }
    }

    return score;
  }

  private tokenize(text: string): string[] {
    const words = text
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean);

    const jaChars =
      text.match(/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/gu) ??
      [];

    return [...new Set([...words, ...jaChars])];
  }

  private sanitizeLocalizedMap(map: Record<string, string>): LocalizedMap {
    const result: LocalizedMap = {};
    for (const [rawLang, rawVal] of Object.entries(map ?? {})) {
      const lang = rawLang.trim().toLowerCase();
      const val = typeof rawVal === 'string' ? rawVal.trim() : '';
      if (lang && val) {
        result[lang] = val;
      }
    }
    return result;
  }

  private pickLocalized(
    field: LocalizedMap | undefined | null,
    locale: string,
  ): string {
    if (!field) return '';
    const normalized = this.normalizeLocale(locale);

    if (field[normalized] && field[normalized].trim().length > 0) {
      return field[normalized];
    }
    if (field.en && field.en.trim().length > 0) {
      return field.en;
    }
    const firstAvailable = Object.values(field).find(
      (v) => typeof v === 'string' && v.trim().length > 0,
    );
    return firstAvailable ?? '';
  }

  private normalizeLocale(locale?: string): string {
    const cleaned = (locale ?? 'en').trim().toLowerCase();
    return cleaned.split(/[-_]/)[0] || 'en';
  }

  private getFallbackMessage(locale: string): string {
    if (locale === 'ja') {
      return '該当する回答が見つかりませんでした。詳しくはサポートまでお問い合わせください。';
    }
    return "I couldn't find an answer for that yet. Please contact support for more help.";
  }
}