import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { DRIZZLE_DB } from '../database/database.provider';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Check x-admin-key header first (Service-to-service / CI / Scripts bypass)
    const adminKey = request.headers['x-admin-key'] as string;
    if (
      adminKey &&
      process.env.ADMIN_API_KEY &&
      adminKey === process.env.ADMIN_API_KEY
    ) {
      (request as any).user = {
        sub: 'system-admin-key',
        role: 'SUPER_ADMIN',
        email: 'system@ikisakitours.com',
      };
      return true;
    }

    // 2. Extract JWT token from HttpOnly cookie or Authorization Bearer header
    const token =
      request.cookies?.['admin_session'] ||
      (request.headers.authorization?.startsWith('Bearer ')
        ? request.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      throw new UnauthorizedException(
        'Authentication required: Missing administrative session',
      );
    }

    try {
      const payload = this.jwtService.verify(token);

      // Verify admin user still exists and isActive = true in DB
      const admin = await this.db.query.adminUsers.findFirst({
        where: eq(schema.adminUsers.id, payload.sub),
        columns: { id: true, email: true, role: true, isActive: true },
      });

      if (!admin || !admin.isActive) {
        throw new UnauthorizedException(
          'Administrative account has been disabled or revoked',
        );
      }

      (request as any).user = {
        sub: admin.id,
        email: admin.email,
        role: admin.role,
      };

      return true;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException(
        'Invalid or expired administrative session token',
      );
    }
  }
}
