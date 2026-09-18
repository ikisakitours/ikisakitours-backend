import { Controller, Get, Headers, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE_DB } from '../database/database.provider';

@Controller('cron')
export class CronController {
  private readonly logger = new Logger(CronController.name);

  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase,
  ) {}

  @Get('keep-alive')
  async handleKeepAlive(
    @Headers('x-vercel-cron') vercelCronHeader?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const isVercelCron = Boolean(vercelCronHeader);
    const hasAuthHeader = Boolean(authHeader);
    const matchesCronSecret = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;

    // Allow request if:
    // 1. It's not production (local dev), OR
    // 2. It has the 'x-vercel-cron' header, OR
    // 3. It has an Authorization header (Vercel Dashboard manual trigger), OR
    // 4. It matches your custom CRON_SECRET.
    if (process.env.NODE_ENV === 'production' && !isVercelCron && !hasAuthHeader && !matchesCronSecret) {
      throw new UnauthorizedException('Unauthorized cron trigger');
    }

    try {
      await this.db.execute(sql`SELECT 1`);
      this.logger.log('Supabase keep-alive ping succeeded.');
      
      return { 
        status: 'success', 
        timestamp: new Date().toISOString() 
      };
    } catch (error: any) {
      this.logger.error('Database ping failed:', error);
      return { 
        status: 'error', 
        message: error.message 
      };
    }
  }
}