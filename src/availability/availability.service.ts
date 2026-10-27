import { Injectable, Inject } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { eq } from 'drizzle-orm';

@Injectable()
export class AvailabilityService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  // GET: Fetch current availability config
  async getAvailability() {
    let record = await this.db.query.availability.findFirst();

    // If no row exists yet, initialize a default empty record
    if (!record) {
      const [newRecord] = await this.db
        .insert(schema.availability)
        .values({ apiClosedDates: [] })
        .returning();
      record = newRecord;
    }

    return record;
  }

  // UPDATE / UPSERT: Overwrites/updates the closed dates array
  async updateAvailability(apiClosedDates: string[]) {
    const existing = await this.db.query.availability.findFirst();

    if (existing) {
      const [updated] = await this.db
        .update(schema.availability)
        .set({
          apiClosedDates,
          updatedAt: new Date(),
        })
        .where(eq(schema.availability.id, existing.id))
        .returning();

      return updated;
    } else {
      const [created] = await this.db
        .insert(schema.availability)
        .values({ apiClosedDates })
        .returning();

      return created;
    }
  }
}