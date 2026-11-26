import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { CreateFaqDto } from './dto/create-faq.dto';

export type SupportedLocale = 'en' | 'ja';

export interface LocalizedText {
    en: string;
    ja?: string;
}

export interface AskResponse {
    matched: boolean;
    locale: SupportedLocale;
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
    ) { }

    async ask(
        rawMessage: string,
        locale: SupportedLocale = 'en',
    ): Promise<AskResponse> {
        const message = rawMessage.trim();

        if (!message) {
            return {
                matched: false,
                locale,
                reply: this.getFallbackMessage(locale),
            };
        }

        const faqs = await this.db.select().from(schema.botFaqs);
        const normalizedQuery = message.toLowerCase();

        let bestFaq: BotFaqRow | null = null;
        let bestScore = 0;

        for (const faq of faqs) {
            const score = this.scoreFaq(faq, normalizedQuery, locale);
            if (score > bestScore) {
                bestScore = score;
                bestFaq = faq;
            }
        }

        if (bestFaq && bestScore >= this.minScoreThreshold) {
            return {
                matched: true,
                locale,
                reply: this.pickLocalized(bestFaq.answer as LocalizedText, locale),
                topic: bestFaq.topic,
                faqId: bestFaq.id,
            };
        }

        await this.logMissedQuestion(message, locale);

        return {
            matched: false,
            locale,
            reply: this.getFallbackMessage(locale),
        };
    }

    async logMissedQuestion(
        userMessage: string,
        locale: SupportedLocale = 'en',
    ): Promise<void> {
        await this.db.insert(schema.botMissedQuestions).values({
            userMessage: userMessage.trim(),
            locale,
        });
    }

    async getFaqs(locale: SupportedLocale = 'en') {
        const rows = await this.db.select().from(schema.botFaqs);
        return rows.map((row) => ({
            id: row.id,
            topic: row.topic,
            question: this.pickLocalized(row.question as LocalizedText, locale),
            answer: this.pickLocalized(row.answer as LocalizedText, locale),
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
        const enQuestion = dto.question.en.trim();
        const enAnswer = dto.answer.en.trim();
        const jaQuestion = dto.question.ja?.trim();
        const jaAnswer = dto.answer.ja?.trim();

        const cleanKeywords = Array.isArray(dto.keywords)
            ? [...new Set(dto.keywords.map((k) => k.trim()).filter(Boolean))]
            : [];

        const [created] = await this.db
            .insert(schema.botFaqs)
            .values({
                topic,
                question: {
                    en: enQuestion,
                    ...(jaQuestion ? { ja: jaQuestion } : {}),
                },
                answer: {
                    en: enAnswer,
                    ...(jaAnswer ? { ja: jaAnswer } : {}),
                },
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
        locale: SupportedLocale,
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
            faq.question as LocalizedText,
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

    private pickLocalized(
        field: LocalizedText | undefined | null,
        locale: SupportedLocale,
    ): string {
        if (!field) return '';
        if (locale === 'ja' && field.ja && field.ja.trim().length > 0) {
            return field.ja;
        }
        return field.en ?? '';
    }

    private getFallbackMessage(locale: SupportedLocale): string {
        if (locale === 'ja') {
            return '該当する回答が見つかりませんでした。詳しくはサポートまでお問い合わせください。';
        }
        return "I couldn't find an answer for that yet. Please contact support for more help.";
    }
}