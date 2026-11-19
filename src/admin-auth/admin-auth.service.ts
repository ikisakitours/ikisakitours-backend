import {
  Injectable,
  Inject,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, sql, desc } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import * as QRCode from 'qrcode';
import {
  generateTotpSecret,
  generateOtpauthUri,
  verifyTotpCode,
} from './totp.util';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { AdminLoginDto } from './dto/admin-login.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';
import { Enable2FaDto } from './dto/enable-2fa.dto';
import { Disable2FaDto } from './dto/disable-2fa.dto';

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

    if (!admin) {
      await this.logAudit(
        null,
        'LOGIN_FAILED',
        'auth',
        { reason: 'Admin user not found' },
        clientIp,
        userAgent,
      );
      throw new UnauthorizedException('Invalid administrative credentials');
    }

    if (!admin.isActive) {
      await this.logAudit(
        admin.id,
        'LOGIN_BLOCKED_SUSPENDED',
        'auth',
        { reason: 'Suspended staff account' },
        clientIp,
        userAgent,
      );
      throw new ForbiddenException({
        success: false,
        message:
          'Your staff account has been suspended. Please contact your Super Administrator.',
      });
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

    // Check 2FA Challenge when enabled
    if (admin.isTwoFactorEnabled) {
      // Case A: totpCode is NOT provided in body
      if (!dto.totpCode || dto.totpCode.trim() === '') {
        return {
          requiresTwoFactor: true,
          message: 'Two-factor authentication code required.',
        };
      }

      // Case B: totpCode IS provided in body
      const is2FaValid =
        admin.twoFactorSecret &&
        verifyTotpCode(dto.totpCode.trim(), admin.twoFactorSecret);

      if (!is2FaValid) {
        await this.logAudit(
          admin.id,
          'LOGIN_2FA_FAILED',
          'auth',
          { reason: 'Invalid TOTP code' },
          clientIp,
          userAgent,
        );
        throw new UnauthorizedException({
          success: false,
          message: 'Invalid 2FA code. Please check your authenticator app.',
        });
      }
    }

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
        avatarUrl: admin.avatarUrl || null,
        isTwoFactorEnabled: admin.isTwoFactorEnabled || false,
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
        avatarUrl: admin.avatarUrl || null,
        isTwoFactorEnabled: admin.isTwoFactorEnabled || false,
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
      avatarUrl: admin.avatarUrl || null,
      isTwoFactorEnabled: admin.isTwoFactorEnabled || false,
    };
  }

  // 6. Update Admin Profile
  async updateProfile(
    adminId: string,
    dto: UpdateAdminProfileDto,
    clientIp?: string,
    userAgent?: string,
  ) {
    const admin = await this.db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.id, adminId),
    });

    if (!admin) {
      throw new NotFoundException('Administrator profile not found');
    }

    const updateData: Partial<typeof schema.adminUsers.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.fullName !== undefined) {
      updateData.fullName = dto.fullName.trim();
    }
    if (dto.avatarUrl !== undefined) {
      updateData.avatarUrl = dto.avatarUrl;
    }

    await this.db
      .update(schema.adminUsers)
      .set(updateData)
      .where(eq(schema.adminUsers.id, adminId));

    await this.logAudit(
      adminId,
      'PROFILE_UPDATED',
      'admin_users',
      {
        updatedFields: Object.keys(updateData).filter(
          (k) => k !== 'updatedAt',
        ),
      },
      clientIp,
      userAgent,
    );

    const updated = await this.db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.id, adminId),
    });

    return {
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updated!.id,
        email: updated!.email,
        fullName: updated!.fullName,
        role: updated!.role,
        avatarUrl: updated!.avatarUrl || null,
        isTwoFactorEnabled: updated!.isTwoFactorEnabled || false,
      },
    };
  }

  // 7. Change Password
  async changePassword(
    adminId: string,
    dto: ChangeAdminPasswordDto,
    clientIp?: string,
    userAgent?: string,
  ) {
    const admin = await this.db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.id, adminId),
    });

    if (!admin) {
      throw new NotFoundException('Administrator profile not found');
    }

    const isMatch = await bcrypt.compare(
      dto.currentPassword,
      admin.passwordHash,
    );
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (!dto.newPassword || dto.newPassword.length < 8) {
      throw new BadRequestException(
        'New password must be at least 8 characters long',
      );
    }

    const newHash = await bcrypt.hash(dto.newPassword, 12);

    await this.db
      .update(schema.adminUsers)
      .set({
        passwordHash: newHash,
        updatedAt: new Date(),
      })
      .where(eq(schema.adminUsers.id, adminId));

    await this.logAudit(
      adminId,
      'PASSWORD_CHANGED',
      'admin_users',
      undefined,
      clientIp,
      userAgent,
    );

    return {
      success: true,
      message: 'Password updated successfully',
    };
  }

  // 8. Generate 2FA Secret & QR Code
  async generate2Fa(
    adminId: string,
    clientIp?: string,
    userAgent?: string,
  ) {
    const admin = await this.db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.id, adminId),
    });

    if (!admin) {
      throw new NotFoundException('Administrator profile not found');
    }

    const secret = generateTotpSecret();
    const otpauth = generateOtpauthUri({
      issuer: 'IkisakiTours',
      label: admin.email,
      secret,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    // Save secret in pending state (isTwoFactorEnabled remains false until verified)
    await this.db
      .update(schema.adminUsers)
      .set({
        twoFactorSecret: secret,
        updatedAt: new Date(),
      })
      .where(eq(schema.adminUsers.id, adminId));

    return {
      success: true,
      secret,
      qrCodeDataUrl,
    };
  }

  // 9. Enable 2FA
  async enable2Fa(
    adminId: string,
    dto: Enable2FaDto,
    clientIp?: string,
    userAgent?: string,
  ) {
    const admin = await this.db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.id, adminId),
    });

    if (!admin) {
      throw new NotFoundException('Administrator profile not found');
    }

    const secretToVerify = dto.secret || admin.twoFactorSecret;
    if (!secretToVerify) {
      throw new BadRequestException({
        success: false,
        message: 'No 2FA setup found. Please generate a QR code first.',
      });
    }

    const isValid = verifyTotpCode(dto.totpCode, secretToVerify);

    if (!isValid) {
      throw new BadRequestException({
        success: false,
        message: 'Invalid verification code. Please try again.',
      });
    }

    await this.db
      .update(schema.adminUsers)
      .set({
        twoFactorSecret: secretToVerify,
        isTwoFactorEnabled: true,
        updatedAt: new Date(),
      })
      .where(eq(schema.adminUsers.id, adminId));

    await this.logAudit(
      adminId,
      '2FA_ENABLED',
      'admin_users',
      undefined,
      clientIp,
      userAgent,
    );

    return {
      success: true,
      message: 'Two-Factor Authentication activated successfully!',
    };
  }

  // 10. Disable 2FA
  async disable2Fa(
    adminId: string,
    dto: Disable2FaDto,
    clientIp?: string,
    userAgent?: string,
  ) {
    const admin = await this.db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.id, adminId),
    });

    if (!admin) {
      throw new NotFoundException('Administrator profile not found');
    }

    const isMatch = await bcrypt.compare(
      dto.currentPassword,
      admin.passwordHash,
    );
    if (!isMatch) {
      throw new BadRequestException({
        success: false,
        message: 'Incorrect password.',
      });
    }

    await this.db
      .update(schema.adminUsers)
      .set({
        twoFactorSecret: null,
        isTwoFactorEnabled: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.adminUsers.id, adminId));

    await this.logAudit(
      adminId,
      '2FA_DISABLED',
      'admin_users',
      undefined,
      clientIp,
      userAgent,
    );

    return {
      success: true,
      message: 'Two-Factor Authentication disabled.',
    };
  }
}
