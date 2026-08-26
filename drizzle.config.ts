import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Use DIRECT_URL for migrations (Port 5432)
    url: process.env.DIRECT_URL || process.env.DATABASE_URL!,
  },
});