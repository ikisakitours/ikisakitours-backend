import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as bcrypt from 'bcrypt';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';

async function seedAdmin() {
  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('ERROR: DIRECT_URL or DATABASE_URL not set in environment.');
    process.exit(1);
  }

  const email = (process.env.INITIAL_ADMIN_EMAIL || 'admin@ikisakitours.com')
    .toLowerCase()
    .trim();
  const password = process.env.INITIAL_ADMIN_PASSWORD || 'SecurePassword123!';
  const fullName = process.env.INITIAL_ADMIN_NAME || 'Operations Director';

  console.log(`Connecting to database to provision Super Admin: ${email}...`);

  const client = postgres(dbUrl, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  try {
    const existing = await db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.email, email),
    });

    if (existing) {
      console.log(
        `[SEED] Admin user already exists with email: ${email} (ID: ${existing.id}, Role: ${existing.role})`,
      );
    } else {
      console.log(`[SEED] Hashing password with bcrypt (work factor: 12)...`);
      const passwordHash = await bcrypt.hash(password, 12);

      const [newAdmin] = await db
        .insert(schema.adminUsers)
        .values({
          email,
          passwordHash,
          fullName,
          role: 'SUPER_ADMIN',
          isActive: true,
          failedLoginAttempts: 0,
        })
        .returning();

      console.log(
        `[SEED SUCCESS] Super Admin created: ${newAdmin.email} (ID: ${newAdmin.id}, Role: ${newAdmin.role})`,
      );
    }
  } catch (error) {
    console.error('[SEED ERROR] Failed to provision Super Admin:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('[SEED] Database connection closed.');
  }
}

seedAdmin();
