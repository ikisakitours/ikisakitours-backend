import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';

@Injectable()
export class NewsletterService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  // 1. Subscribe user to the newsletter
  async subscribe(dto: CreateNewsletterDto) {
    const { email, userId } = dto;

    try {
      // Check if this email is already subscribed
      const existing = await this.db.query.newsletterSubscriptions.findFirst({
        where: eq(schema.newsletterSubscriptions.email, email),
      });

      if (existing) {
        return {
          message: 'This email is already subscribed to our newsletter!',
          status: 'already_exists',
        };
      }

      // Insert new newsletter subscription
      const [newSubscription] = await this.db
        .insert(schema.newsletterSubscriptions)
        .values({
          email,
          userId: userId || null, // Optional handling if guest vs logged-in user
        })
        .returning();

      return {
        message: 'Successfully subscribed to the newsletter!',
        data: newSubscription,
      };
    } catch (error) {
      console.error('Newsletter Subscription Error:', error);
      throw new BadRequestException('Failed to process newsletter subscription');
    }
  }
}