import { Injectable, Inject } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { SaveConsentDto } from './dto/save-consent.dto';

@Injectable()
export class CookiesService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  // 1. Save or update consent for a logged-in user
  async saveConsent(dto: SaveConsentDto) {
    const { userId, preferences } = dto;

    const existing = await this.db.query.cookieConsents.findFirst({
      where: eq(schema.cookieConsents.userId, userId),
    });

    if (existing) {
      const [updated] = await this.db
        .update(schema.cookieConsents)
        .set({
          preferences,
          updatedAt: new Date(),
        })
        .where(eq(schema.cookieConsents.userId, userId))
        .returning();

      return { message: 'Cookie preferences updated successfully', data: updated };
    }

    const [created] = await this.db
      .insert(schema.cookieConsents)
      .values({
        userId,
        preferences,
      })
      .returning();

    return { message: 'Cookie preferences saved successfully', data: created };
  }

  // 2. Fetch user consent status (used on frontend after login to check if popup is needed)
  async getConsent(userId: string) {
    const record = await this.db.query.cookieConsents.findFirst({
      where: eq(schema.cookieConsents.userId, userId),
    });

    if (!record) {
      return { hasConsent: false, preferences: null };
    }

    return { hasConsent: true, preferences: record.preferences };
  }
}