import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';
import { isNull, eq } from 'drizzle-orm';
import {
  generateCustomerReferenceId,
  generateServiceReferenceId,
  generateInquiryReferenceId,
  generateReviewReferenceId,
  generateFeedbackReferenceId,
  generateFaqReferenceId,
} from '../common/utils/reference-id.util';

async function backfillReferenceIds() {
  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('ERROR: DIRECT_URL or DATABASE_URL not set in environment.');
    process.exit(1);
  }

  console.log('Connecting to database to backfill Reference IDs...');
  const client = postgres(dbUrl, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  try {
    // 1. Backfill Tour Services (SRV-XXXXXXXX)
    const servicesWithoutRef = await db
      .select({ id: schema.serviceRequests.id })
      .from(schema.serviceRequests)
      .where(isNull(schema.serviceRequests.referenceId));

    console.log(`[Tour Services] Found ${servicesWithoutRef.length} rows to backfill.`);
    for (const row of servicesWithoutRef) {
      await db
        .update(schema.serviceRequests)
        .set({ referenceId: generateServiceReferenceId() })
        .where(eq(schema.serviceRequests.id, row.id));
    }

    // 2. Backfill Contact Inquiries (INQ-XXXXXXXX)
    const contactsWithoutRef = await db
      .select({ id: schema.contacts.id })
      .from(schema.contacts)
      .where(isNull(schema.contacts.referenceId));

    console.log(`[Contact Inquiries] Found ${contactsWithoutRef.length} rows to backfill.`);
    for (const row of contactsWithoutRef) {
      await db
        .update(schema.contacts)
        .set({ referenceId: generateInquiryReferenceId() })
        .where(eq(schema.contacts.id, row.id));
    }

    // 3. Backfill Package Reviews (REV-XXXXXXXX)
    const reviewsWithoutRef = await db
      .select({ id: schema.packageReviews.id })
      .from(schema.packageReviews)
      .where(isNull(schema.packageReviews.referenceId));

    console.log(`[Package Reviews] Found ${reviewsWithoutRef.length} rows to backfill.`);
    for (const row of reviewsWithoutRef) {
      await db
        .update(schema.packageReviews)
        .set({ referenceId: generateReviewReferenceId() })
        .where(eq(schema.packageReviews.id, row.id));
    }

    // 4. Backfill Comments & Website Feedback (FDB-XXXXXXXX)
    const commentsWithoutRef = await db
      .select({ id: schema.comments.id })
      .from(schema.comments)
      .where(isNull(schema.comments.referenceId));

    console.log(`[Comments & Feedback] Found ${commentsWithoutRef.length} rows to backfill.`);
    for (const row of commentsWithoutRef) {
      await db
        .update(schema.comments)
        .set({ referenceId: generateFeedbackReferenceId() })
        .where(eq(schema.comments.id, row.id));
    }

    // 5. Backfill FAQs (FAQ-XXXXXX)
    const faqsWithoutRef = await db
      .select({ id: schema.faqs.id })
      .from(schema.faqs)
      .where(isNull(schema.faqs.referenceId));

    console.log(`[FAQs] Found ${faqsWithoutRef.length} rows to backfill.`);
    for (const row of faqsWithoutRef) {
      await db
        .update(schema.faqs)
        .set({ referenceId: generateFaqReferenceId() })
        .where(eq(schema.faqs.id, row.id));
    }

    // 6. Backfill Customers (IKISAKI-XXXXXX)
    const usersWithoutRef = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(isNull(schema.users.customerReferenceId));

    console.log(`[Customers] Found ${usersWithoutRef.length} rows to backfill.`);
    for (const row of usersWithoutRef) {
      await db
        .update(schema.users)
        .set({ customerReferenceId: generateCustomerReferenceId() })
        .where(eq(schema.users.id, row.id));
    }

    console.log('✅ [BACKFILL COMPLETED] All database entities now possess permanent reference IDs.');
  } catch (error) {
    console.error('[BACKFILL ERROR] Failed to backfill reference IDs:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

backfillReferenceIds();
