import {
  Injectable,
  Inject,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, sql, desc } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly jwtService: JwtService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // 1. Log Audit Actions
  async logAudit(
    adminId: string | null,
    action: string,
    resource: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      await this.db.insert(schema.adminAuditLogs).values({
        adminId: adminId || null,
        action,
        resource,
        details: details || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch (err) {
      console.error('Failed to log admin audit action:', err);
    }
  }

  // 2. Admin Login
  async login(dto: AdminLoginDto, clientIp?: string, userAgent?: string) {
    const admin = await this.db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.email, dto.email.toLowerCase().trim()),
    });

    // Zero knowledge: Do not reveal if email exists
    if (!admin || !admin.isActive) {
      await this.logAudit(
        null,
        'LOGIN_FAILED',
        'auth',
        { reason: 'Unknown or inactive admin' },
        clientIp,
        userAgent,
      );
      throw new UnauthorizedException('Invalid administrative credentials');
    }

    // Check account lockout
    if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
      const remainingMinutes = Math.ceil(
        (new Date(admin.lockedUntil).getTime() - Date.now()) / (60 * 1000),
      );
      throw new HttpException(
        `Account locked due to consecutive failed attempts. Please try again in ${remainingMinutes} minutes.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Verify Password with bcrypt (work factor >= 12)
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      admin.passwordHash,
    );

    if (!isPasswordValid) {
      const newAttempts = (admin.failedLoginAttempts || 0) + 1;
      let lockedUntil: Date | null = null;

      if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 mins lock
      }

      await this.db
        .update(schema.adminUsers)
        .set({
          failedLoginAttempts: newAttempts,
          lockedUntil: lockedUntil,
          updatedAt: new Date(),
        })
        .where(eq(schema.adminUsers.id, admin.id));

      await this.logAudit(
        admin.id,
        'LOGIN_FAILED',
        'auth',
        { attempts: newAttempts },
        clientIp,
        userAgent,
      );

      if (newAttempts >= 5) {
        throw new HttpException(
          'Maximum login attempts exceeded. Account is locked for 30 minutes.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new UnauthorizedException('Invalid administrative credentials');
    }

    // Password valid -> reset counters
    await this.db
      .update(schema.adminUsers)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: clientIp || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.adminUsers.id, admin.id));

    // Generate Tokens
    const accessToken = this.jwtService.sign(
      { sub: admin.id, role: admin.role, email: admin.email },
      { expiresIn: '15m' },
    );

    const rawRefreshToken = crypto.randomUUID();
    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.db.insert(schema.adminSessions).values({
      adminId: admin.id,
      refreshTokenHash,
      userAgent: userAgent || null,
      ipAddress: clientIp || null,
      expiresAt,
      isRevoked: false,
    });

    await this.logAudit(
      admin.id,
      'LOGIN_SUCCESS',
      'auth',
      { role: admin.role },
      clientIp,
      userAgent,
    );

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    };
  }

  // 3. Admin Logout
  async logout(rawRefreshToken?: string, adminId?: string) {
    if (rawRefreshToken) {
      const hashed = this.hashToken(rawRefreshToken);
      await this.db
        .update(schema.adminSessions)
        .set({ isRevoked: true })
        .where(eq(schema.adminSessions.refreshTokenHash, hashed));
    }

    if (adminId) {
      await this.logAudit(adminId, 'LOGOUT', 'auth');
    }

    return { success: true, message: 'Logged out successfully' };
  }

  // 4. Admin Refresh Session
  async refreshSession(
    rawRefreshToken: string,
    clientIp?: string,
    userAgent?: string,
  ) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const hashed = this.hashToken(rawRefreshToken);
    const session = await this.db.query.adminSessions.findFirst({
      where: eq(schema.adminSessions.refreshTokenHash, hashed),
    });

    if (!session) {
      throw new UnauthorizedException('Invalid administrative session');
    }

    // Token reuse detection: If revoked token is presented, revoke ALL active sessions for that admin!
    if (session.isRevoked) {
      await this.db
        .update(schema.adminSessions)
        .set({ isRevoked: true })
        .where(eq(schema.adminSessions.adminId, session.adminId));

      await this.logAudit(
        session.adminId,
        'REVOKED_TOKEN_REUSE_DETECTED',
        'auth',
        { attemptedTokenHash: hashed },
        clientIp,
        userAgent,
      );

      throw new UnauthorizedException(
        'Session compromise detected. All sessions revoked.',
      );
    }

    if (new Date(session.expiresAt) < new Date()) {
      throw new UnauthorizedException(
        'Session has expired. Please log in again.',
      );
    }

    const admin = await this.db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.id, session.adminId),
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException(
        'Administrator account inactive or removed',
      );
    }

    // Revoke old session (Rotation)
    await this.db
      .update(schema.adminSessions)
      .set({ isRevoked: true })
      .where(eq(schema.adminSessions.id, session.id));

    // Issue new Access Token and Refresh Token
    const accessToken = this.jwtService.sign(
      { sub: admin.id, role: admin.role, email: admin.email },
      { expiresIn: '15m' },
    );

    const newRawRefreshToken = crypto.randomUUID();
    const newRefreshTokenHash = this.hashToken(newRawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.db.insert(schema.adminSessions).values({
      adminId: admin.id,
      refreshTokenHash: newRefreshTokenHash,
      userAgent: userAgent || null,
      ipAddress: clientIp || null,
      expiresAt,
      isRevoked: false,
    });

    await this.logAudit(
      admin.id,
      'TOKEN_REFRESH',
      'auth',
      undefined,
      clientIp,
      userAgent,
    );

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    };
  }

  // 5. Get Current Admin Profile
  async getMe(adminId: string) {
    const admin = await this.db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.id, adminId),
    });

    if (!admin) {
      throw new NotFoundException('Administrator profile not found');
    }

    return {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      lastLoginAt: admin.lastLoginAt,
    };
  }
}
