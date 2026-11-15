import { Injectable, Inject } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { eq } from 'drizzle-orm';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  // GET: Fetch current availability config (with optional language localization for notes)
  async getAvailability(lang?: string) {
    const record = await this.db.query.availability.findFirst();

    // If no row exists yet, return default empty structure without inserting into DB
    if (!record) {
      return {
        apiClosedDates: [],
        dateDetails: {},
        closedDateDetails: [],
        updatedAt: null,
      };
    }

    const apiClosedDates = record.apiClosedDates || [];
    let dateDetails = record.dateDetails || {};
    let closedDateDetails = record.closedDateDetails || [];

    // If client requested a specific language, resolve only that language and strip out multilingual notes dict
    if (lang) {
      const targetLang = lang.toLowerCase().trim();
      const localizedDateDetails: Record<string, any> = {};

      for (const [dateKey, detail] of Object.entries(dateDetails)) {
        const { notes, ...rest } = detail;
        const resolvedNote =
          notes?.[targetLang] ||
          notes?.['en'] ||
          (notes ? Object.values(notes)[0] : '') ||
          detail.note ||
          '';

        localizedDateDetails[dateKey] = {
          ...rest,
          note: resolvedNote,
        };
      }
      dateDetails = localizedDateDetails;

      closedDateDetails = closedDateDetails.map((item) => {
        const { notes, ...rest } = item;
        const resolvedNote =
          notes?.[targetLang] ||
          notes?.['en'] ||
          (notes ? Object.values(notes)[0] : '') ||
          item.note ||
          '';

        return {
          ...rest,
          note: resolvedNote,
        };
      });
    }

    return {
      apiClosedDates,
      dateDetails,
      closedDateDetails,
      updatedAt: record.updatedAt,
    };
  }

  // UPDATE / UPSERT: Overwrites/updates the closed dates, date details, and closed date items
  async updateAvailability(dto: UpdateAvailabilityDto) {
    const existing = await this.db.query.availability.findFirst();

    const apiClosedDates = dto.apiClosedDates || [];
    const dateDetails = dto.dateDetails || {};
    const closedDateDetails = dto.closedDateDetails || [];

    if (existing) {
      const [updated] = await this.db
        .update(schema.availability)
        .set({
          apiClosedDates,
          dateDetails,
          closedDateDetails,
          updatedAt: new Date(),
        })
        .where(eq(schema.availability.id, existing.id))
        .returning();

      return {
        message: 'Availability updated successfully',
        apiClosedDates: updated.apiClosedDates || [],
        dateDetails: updated.dateDetails || {},
        closedDateDetails: updated.closedDateDetails || [],
        updatedAt: updated.updatedAt,
      };
    } else {
      const [created] = await this.db
        .insert(schema.availability)
        .values({
          apiClosedDates,
          dateDetails,
          closedDateDetails,
        })
        .returning();

      return {
        message: 'Availability created successfully',
        apiClosedDates: created.apiClosedDates || [],
        dateDetails: created.dateDetails || {},
        closedDateDetails: created.closedDateDetails || [],
        updatedAt: created.updatedAt,
      };
    }
  }
}
