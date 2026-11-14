import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { CreateServicePricingDto } from './dto/create-service-pricing.dto';
import { UpdateServicePricingDto } from './dto/update-service-pricing.dto';
import {
  ClientServicePricingResponseDto,
  ClientServicePricingAllResponseDto,
} from './dto/client-service-pricing-response.dto';

@Injectable()
export class ServicePricingService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) { }

  // ── Helper methods for Client UI language localization (similar to blogs.service.ts) ──
  private getLocalizedText(field: Record<string, string> | null | undefined, lang: string): string {
    if (!field) return '';
    return field[lang] || field['en'] || Object.values(field).find(Boolean) || '';
  }

  private getLocalizedList(field: Record<string, string[]> | null | undefined, lang: string): string[] {
    if (!field) return [];
    const list = field[lang] || field['en'] || Object.values(field)[0];
    return Array.isArray(list) ? list : [];
  }

  private mapToClientResponseDto(
    record: typeof schema.servicePricing.$inferSelect,
    lang: string = 'en',
  ): ClientServicePricingResponseDto {
    const targetLang =
      record.titleBase && record.titleBase[lang]
        ? lang
        : (record.titleBase && record.titleBase['en']
          ? 'en'
          : (record.titleBase ? Object.keys(record.titleBase)[0] || 'en' : 'en'));

    return {
      id: record.id,
      serviceType: record.serviceType,
      language: targetLang,
      titleBase: this.getLocalizedText(record.titleBase, targetLang),
      titleAccent: this.getLocalizedText(record.titleAccent, targetLang),
      subtitleStrong: this.getLocalizedText(record.subtitleStrong, targetLang),
      subtitle: this.getLocalizedText(record.subtitle, targetLang),
      popularBadge: this.getLocalizedText(record.popularBadge, targetLang),
      popularTitle: this.getLocalizedText(record.popularTitle, targetLang),
      popularDesc: this.getLocalizedText(record.popularDesc, targetLang),
      notes: this.getLocalizedList(record.notes, targetLang),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  // ── 1. Fetch Specific Pricing for Client / User UI (Single Language) ─────────
  async getClientPricingByServiceType(
    serviceType: string,
    lang: string = 'en',
  ): Promise<ClientServicePricingResponseDto> {
    const normalizedType = serviceType.toLowerCase().trim();

    const [record] = await this.db
      .select()
      .from(schema.servicePricing)
      .where(eq(schema.servicePricing.serviceType, normalizedType))
      .limit(1);

    if (!record) {
      throw new NotFoundException(`Service pricing for '${serviceType}' not found`);
    }

    return this.mapToClientResponseDto(record, lang);
  }

  // ── 2. Fetch All Pricing for Client / User UI (Single Language) ───────────────
  async getClientAllPricing(lang: string = 'en'): Promise<ClientServicePricingAllResponseDto> {
    const records = await this.db.select().from(schema.servicePricing);

    const recordMap: Record<string, ClientServicePricingResponseDto> = {};
    for (const rec of records) {
      recordMap[rec.serviceType] = this.mapToClientResponseDto(rec, lang);
    }

    return {
      charter: recordMap['charter'] || null,
      custom: recordMap['custom'] || null,
      transfer: recordMap['transfer'] || null,
    };
  }

  // ── 3. Fetch All Pricing Configurations (Admin Panel: returns full multilingual dicts) ──
  async getAllPricing() {
    const records = await this.db.select().from(schema.servicePricing);

    const recordMap: Record<string, typeof schema.servicePricing.$inferSelect> = {};
    for (const rec of records) {
      recordMap[rec.serviceType] = rec;
    }

    return {
      message: 'Service pricing retrieved successfully',
      data: {
        charter: recordMap['charter'] || null,
        custom: recordMap['custom'] || null,
        transfer: recordMap['transfer'] || null,
      },
    };
  }

  // ── 4. Fetch Pricing by Specific Service Type (Admin Panel: full multilingual dicts) ────
  async getPricingByServiceType(serviceType: string) {
    const normalizedType = serviceType.toLowerCase().trim();

    const [record] = await this.db
      .select()
      .from(schema.servicePricing)
      .where(eq(schema.servicePricing.serviceType, normalizedType))
      .limit(1);

    if (!record) {
      throw new NotFoundException(`Service pricing for '${serviceType}' not found`);
    }

    return {
      message: `${serviceType} pricing retrieved successfully`,
      data: record,
    };
  }

  // ── 5. Insert / Create (or Upsert) New Pricing Record (Admin Panel) ───────────
  async createPricing(dto: CreateServicePricingDto) {
    const normalizedType = dto.serviceType.toLowerCase().trim();

    if (!['charter', 'custom', 'transfer'].includes(normalizedType)) {
      throw new BadRequestException(
        `Invalid serviceType '${dto.serviceType}'. Must be 'charter', 'custom', or 'transfer'`,
      );
    }

    const [existing] = await this.db
      .select()
      .from(schema.servicePricing)
      .where(eq(schema.servicePricing.serviceType, normalizedType))
      .limit(1);

    if (existing) {
      const [updated] = await this.db
        .update(schema.servicePricing)
        .set({
          titleBase: dto.titleBase,
          titleAccent: dto.titleAccent,
          subtitleStrong: dto.subtitleStrong,
          subtitle: dto.subtitle,
          popularBadge: dto.popularBadge,
          popularTitle: dto.popularTitle,
          popularDesc: dto.popularDesc,
          notes: dto.notes,
          updatedAt: new Date(),
        })
        .where(eq(schema.servicePricing.serviceType, normalizedType))
        .returning();

      return {
        message: `${normalizedType} pricing updated successfully`,
        data: updated,
      };
    }

    const [created] = await this.db
      .insert(schema.servicePricing)
      .values({
        serviceType: normalizedType,
        titleBase: dto.titleBase,
        titleAccent: dto.titleAccent,
        subtitleStrong: dto.subtitleStrong,
        subtitle: dto.subtitle,
        popularBadge: dto.popularBadge,
        popularTitle: dto.popularTitle,
        popularDesc: dto.popularDesc,
        notes: dto.notes,
      })
      .returning();

    return {
      message: `${normalizedType} pricing created successfully`,
      data: created,
    };
  }

  // ── 6. Update Existing Pricing Record (Admin Panel) ───────────────────────────
  async updatePricing(serviceType: string, dto: UpdateServicePricingDto) {
    const normalizedType = serviceType.toLowerCase().trim();

    const [existing] = await this.db
      .select()
      .from(schema.servicePricing)
      .where(eq(schema.servicePricing.serviceType, normalizedType))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Service pricing for '${serviceType}' not found`);
    }

    const updatePayload: Partial<typeof schema.servicePricing.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.titleBase !== undefined) updatePayload.titleBase = dto.titleBase;
    if (dto.titleAccent !== undefined) updatePayload.titleAccent = dto.titleAccent;
    if (dto.subtitleStrong !== undefined) updatePayload.subtitleStrong = dto.subtitleStrong;
    if (dto.subtitle !== undefined) updatePayload.subtitle = dto.subtitle;
    if (dto.popularBadge !== undefined) updatePayload.popularBadge = dto.popularBadge;
    if (dto.popularTitle !== undefined) updatePayload.popularTitle = dto.popularTitle;
    if (dto.popularDesc !== undefined) updatePayload.popularDesc = dto.popularDesc;
    if (dto.notes !== undefined) updatePayload.notes = dto.notes;

    const [updated] = await this.db
      .update(schema.servicePricing)
      .set(updatePayload)
      .where(eq(schema.servicePricing.serviceType, normalizedType))
      .returning();

    return {
      message: `${normalizedType} pricing updated successfully`,
      data: updated,
    };
  }

  // ── 7. Delete Pricing Record (Admin Panel) ───────────────────────────────────
  async deletePricing(serviceType: string) {
    const normalizedType = serviceType.toLowerCase().trim();

    const [existing] = await this.db
      .select()
      .from(schema.servicePricing)
      .where(eq(schema.servicePricing.serviceType, normalizedType))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Service pricing for '${serviceType}' not found`);
    }

    await this.db
      .delete(schema.servicePricing)
      .where(eq(schema.servicePricing.serviceType, normalizedType));

    return {
      message: `Service pricing for '${serviceType}' deleted successfully`,
    };
  }
}
