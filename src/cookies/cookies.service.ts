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

  // 2. Fetch user consent status and a list of what they accepted
  async getConsent(userId: string) {
    const record = await this.db.query.cookieConsents.findFirst({
      where: eq(schema.cookieConsents.userId, userId),
    });

    if (!record || !record.preferences) {
      return { hasConsent: false, acceptedList: [], preferences: null };
    }

    // Filter out only the keys/categories where the user's preference is true
    const acceptedList = Object.entries(record.preferences)
      .filter(([key, value]) => value === true)
      .map(([key]) => key);

    return { 
      hasConsent: true, 
      acceptedList, // e.g., ['analytics', 'marketing'] depending on your keys
      preferences: record.preferences 
    };
  }
}