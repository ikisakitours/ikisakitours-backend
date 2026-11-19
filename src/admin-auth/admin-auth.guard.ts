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
    const req = context.switchToHttp().getRequest<Request>();

    // 1. Extract Bearer token from Authorization header (case-insensitive)
    const authHeader = (req.headers['authorization'] ||
      req.headers['Authorization']) as string | undefined;
    let token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    // 2. Fallback to HTTP-only cookie if Authorization header is absent
    if (!token && req.cookies) {
      token =
        req.cookies['admin_session'] ||
        req.cookies['admin_token'] ||
        req.cookies['jwt'] ||
        req.cookies['token'] ||
        null;
    }

    // 3. Fallback: Allow super admin bypass if valid x-admin-key matches ADMIN_API_KEY
    const adminKey = req.headers['x-admin-key'] as string | undefined;
    if (
      !token &&
      adminKey &&
      process.env.ADMIN_API_KEY &&
      adminKey === process.env.ADMIN_API_KEY
    ) {
      (req as any).user = {
        id: 'super-admin-key',
        sub: 'super-admin-key',
        role: 'SUPER_ADMIN',
        email: 'admin@ikisakitours.com',
      };
      return true;
    }

    if (!token) {
      throw new UnauthorizedException(
        'Authentication required: Missing administrative session',
      );
    }

    try {
      const secret =
        process.env.ADMIN_JWT_SECRET ||
        process.env.JWT_SECRET ||
        'super-admin-secret-ikisaki-2026';
      const payload = this.jwtService.verify(token, { secret });

      const adminId = payload.sub || payload.id;
      if (!adminId) {
        throw new UnauthorizedException('Invalid administrative token payload');
      }

      // Verify admin user still exists and isActive = true in DB
      const admin = await this.db.query.adminUsers.findFirst({
        where: eq(schema.adminUsers.id, adminId),
        columns: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          avatarUrl: true,
          isTwoFactorEnabled: true,
        },
      });

      if (!admin || !admin.isActive) {
        throw new UnauthorizedException(
          'Administrative account has been disabled or revoked',
        );
      }

      (req as any).user = {
        ...payload,
        id: admin.id,
        sub: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        avatarUrl: admin.avatarUrl,
        isTwoFactorEnabled: admin.isTwoFactorEnabled,
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
