import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { CreateLegalDocDto } from './dto/create-legal-doc.dto';
import { UpdateLegalDocDto } from './dto/update-legal-doc.dto';
import {
  ClientLegalDocResponseDto,
  ClientLegalSectionDto,
  ClientLegalSubItemDto,
} from './dto/client-legal-doc-response.dto';

@Injectable()
export class LegalDocsService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  // ── Helper methods for Client UI Language Localization ─────────────────────
  private getLocalizedText(
    field: Record<string, string> | null | undefined,
    lang: string,
  ): string {
    if (!field) return '';
    return field[lang] || field['en'] || Object.values(field).find(Boolean) || '';
  }

  private mapToClientResponseDto(
    record: typeof schema.legalDocs.$inferSelect,
    lang: string = 'en',
  ): ClientLegalDocResponseDto {
    const targetLang =
      record.title && record.title[lang]
        ? lang
        : record.title && record.title['en']
          ? 'en'
          : Object.keys(record.title || {})[0] || lang;

    const sections = (record.sections || []).map((sec): ClientLegalSectionDto => {
      const subItems = (sec.subItems || []).map((si): ClientLegalSubItemDto => ({
        id: si.id,
        title: si.title ? this.getLocalizedText(si.title, targetLang) : undefined,
        body: si.body ? this.getLocalizedText(si.body, targetLang) : undefined,
        icon: si.icon,
      }));

      return {
        id: sec.id,
        heading: this.getLocalizedText(sec.heading, targetLang),
        sectionIcon: sec.sectionIcon,
        type: sec.type,
        content: sec.content ? this.getLocalizedText(sec.content, targetLang) : undefined,
        subItems: subItems.length > 0 ? subItems : undefined,
        expanded: sec.expanded,
      };
    });

    return {
      id: record.id,
      language: targetLang,
      title: this.getLocalizedText(record.title, targetLang),
      eyebrow: record.eyebrow ? this.getLocalizedText(record.eyebrow, targetLang) : undefined,
      accent: record.accent ?? undefined,
      lastUpdated: record.lastUpdated,
      sections,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  // ── 1. Fetch All Legal Documents (Admin Panel) ─────────────────────────────
  async getAllDocuments() {
    const records = await this.db.select().from(schema.legalDocs);
    return records;
  }

  // ── 2. Fetch Single Document by ID (Admin Panel) ───────────────────────────
  async getDocumentById(id: string) {
    const [record] = await this.db
      .select()
      .from(schema.legalDocs)
      .where(eq(schema.legalDocs.id, id))
      .limit(1);

    if (!record) {
      throw new NotFoundException(`Legal document with ID "${id}" not found.`);
    }

    return record;
  }

  // ── 3. Fetch Localized Document for Client / User UI ───────────────────────
  async getClientDocumentById(
    id: string,
    lang: string = 'en',
  ): Promise<ClientLegalDocResponseDto> {
    const [record] = await this.db
      .select()
      .from(schema.legalDocs)
      .where(eq(schema.legalDocs.id, id))
      .limit(1);

    if (!record) {
      throw new NotFoundException(`Legal document with ID "${id}" not found.`);
    }

    return this.mapToClientResponseDto(record, lang);
  }

  // ── 3.1 Fetch All Localized Documents for Client / User UI ──────────────────
  async getClientAllDocuments(lang: string = 'en'): Promise<ClientLegalDocResponseDto[]> {
    const records = await this.db.select().from(schema.legalDocs);
    return records.map((rec) => this.mapToClientResponseDto(rec, lang));
  }

  // ── 4. Insert / Create New Document (Upsert if exists) ─────────────────────
  async createDocument(dto: CreateLegalDocDto) {
    const [existing] = await this.db
      .select()
      .from(schema.legalDocs)
      .where(eq(schema.legalDocs.id, dto.id))
      .limit(1);

    if (existing) {
      const [updated] = await this.db
        .update(schema.legalDocs)
        .set({
          title: dto.title,
          eyebrow: dto.eyebrow ?? null,
          accent: dto.accent ?? 'emerald',
          lastUpdated: dto.lastUpdated,
          sections: dto.sections as any,
          updatedAt: new Date(),
        })
        .where(eq(schema.legalDocs.id, dto.id))
        .returning();

      return updated;
    }

    const [created] = await this.db
      .insert(schema.legalDocs)
      .values({
        id: dto.id,
        title: dto.title,
        eyebrow: dto.eyebrow ?? null,
        accent: dto.accent ?? 'emerald',
        lastUpdated: dto.lastUpdated,
        sections: dto.sections as any,
      })
      .returning();

    return created;
  }

  // ── 5. Update Existing Document by ID (returns 404 if not found) ───────────
  async updateDocument(id: string, dto: UpdateLegalDocDto) {
    const [existing] = await this.db
      .select()
      .from(schema.legalDocs)
      .where(eq(schema.legalDocs.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Legal document with ID "${id}" not found.`);
    }

    const updatePayload: Partial<typeof schema.legalDocs.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.title !== undefined) updatePayload.title = dto.title;
    if (dto.eyebrow !== undefined) updatePayload.eyebrow = dto.eyebrow;
    if (dto.accent !== undefined) updatePayload.accent = dto.accent;
    if (dto.lastUpdated !== undefined) updatePayload.lastUpdated = dto.lastUpdated;
    if (dto.sections !== undefined) updatePayload.sections = dto.sections as any;

    const [updated] = await this.db
      .update(schema.legalDocs)
      .set(updatePayload)
      .where(eq(schema.legalDocs.id, id))
      .returning();

    return updated;
  }

  // ── 6. Delete Document from DB ─────────────────────────────────────────────
  async deleteDocument(id: string) {
    const [existing] = await this.db
      .select()
      .from(schema.legalDocs)
      .where(eq(schema.legalDocs.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Legal document with ID "${id}" not found.`);
    }

    await this.db
      .delete(schema.legalDocs)
      .where(eq(schema.legalDocs.id, id));

    return {
      message: `Legal document "${id}" deleted successfully`,
    };
  }
}
