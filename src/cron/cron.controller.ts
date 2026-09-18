import { Controller, Get, Headers, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Controller('cron')
export class CronController {
  private readonly logger = new Logger(CronController.name);

  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase,
  ) {}

  @Get('keep-alive')
  async handleKeepAlive(@Headers('x-vercel-cron') vercelCronHeader?: string) {
    // Protect endpoint in production so external users can't trigger it
    if (process.env.NODE_ENV === 'production' && !vercelCronHeader) {
      throw new UnauthorizedException('Unauthorized cron trigger');
    }

    try {
      // Execute a lightweight query to wake up/keep active the Supabase engine
      await this.db.execute(sql`SELECT 1`);
      this.logger.log('Supabase keep-alive ping succeeded.');
      
      return {
        status: 'success',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error('Database ping failed:', error);
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
}