import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Access token missing');
    }

    let payload: { sub: string; [key: string]: any };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Real-time Database Check for Suspension
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, payload.sub),
      columns: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        hasAccess: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (!user.hasAccess) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account access has been restricted by administration.',
        user: {
          id: user.id,
          email: user.email,
          firstname: user.firstName,
          lastname: user.lastName,
          hasAccess: false,
        },
      });
    }

    // Attach user to request, preserving req.user.sub for existing controllers
    request['user'] = {
      ...user,
      sub: user.id,
    };

    return true;
  }

  private extractToken(request: Request): string | undefined {
    if (request.cookies && request.cookies.token) {
      return request.cookies.token;
    }
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
