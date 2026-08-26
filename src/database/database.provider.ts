import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DRIZZLE_DB = 'DRIZZLE_DB';

export const databaseProvider = {
  provide: DRIZZLE_DB,
  useFactory: () => {
    const client = postgres(process.env.DATABASE_URL!, { prepare: false });
    return drizzle(client, { schema });
  },
};