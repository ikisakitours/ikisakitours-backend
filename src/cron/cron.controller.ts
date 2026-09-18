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
    // 1. Verify request source in production
    const isVercelCron = Boolean(vercelCronHeader);
    const isAuthorized = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (process.env.NODE_ENV === 'production' && !isVercelCron && !isAuthorized) {
      throw new UnauthorizedException('Unauthorized cron trigger');
    }

    // 2. Perform the database keep-alive ping
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