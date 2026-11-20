import {
  Injectable,
  Inject,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import 'multer';

import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { UpdateUserDto } from './dto/update-user.dto';
import { UploadsService } from '../uploads/uploads.service';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../email/email.service';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { generateCustomerReferenceId } from '../common/utils/reference-id.util';
import * as QRCode from 'qrcode';
import {
  generateTotpSecret,
  verifyTotpCode,
  generateOtpAuthUrl,
} from '../admin-auth/totp.util';
import { EnableCustomer2FaDto } from './dto/enable-2fa.dto';
import { DisableCustomer2FaDto } from './dto/disable-2fa.dto';
import { VerifyTotpChallengeDto } from './dto/verify-totp-challenge.dto';

type User = typeof schema.users.$inferSelect;

export interface AuthResponse {
  success?: boolean;
  user?: UserResponseDto;
  access_token?: string;
  maxAgeMs?: number;
  requiresTwoFactor?: boolean;
  ticket?: string;
  email?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly jwtService: JwtService,
    private readonly uploadsService: UploadsService,
    private readonly emailService: EmailService,
  ) {}

  private async ensureCustomerReferenceId(user: User): Promise<User> {
    if (user.customerReferenceId) {
      return user;
    }
    const customerReferenceId = generateCustomerReferenceId();
    const [updated] = await this.db
      .update(schema.users)
      .set({ customerReferenceId })
      .where(eq(schema.users.id, user.id))
      .returning();
    return updated || { ...user, customerReferenceId };
  }

  private toUserResponseDto(user: User): UserResponseDto {
    const refId = user.customerReferenceId ?? null;
    return {
      id: user.id,
      customerReferenceId: refId,
      referenceId: refId,
      firstname: user.firstName,
      lastname: user.lastName,
      email: user.email,
      country: user.country,
      avatarUrl: user.avatarUrl ?? null,
      isVerified: user.isVerified,
      isVip: user.isVip,
      hasAccess: user.hasAccess,
      isTwoFactorEnabled: Boolean(user.isTwoFactorEnabled),
      createdAt: user.createdAt,
      provider: user.provider ?? null,
      providerId: user.providerId ?? null,
    };
  }

  // Updated generateToken to dynamically accept custom expiresIn options
  private generateToken(user: User, expiresIn?: string): string {
    const payload = { sub: user.id };

    // Explicitly construct the options object if expiresIn is provided
    const options = expiresIn ? { expiresIn: expiresIn as any } : undefined;

    return this.jwtService.sign(payload, options);
  }

  async register(createUserDto: CreateUserDto): Promise<AuthResponse> {
    const existingUser = await this.db.query.users.findFirst({
      where: eq(schema.users.email, createUserDto.email),
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const customerReferenceId = generateCustomerReferenceId();

    const [newUser] = await this.db
      .insert(schema.users)
      .values({
        firstName: createUserDto.firstname,
        lastName: createUserDto.lastname,
        email: createUserDto.email,
        country: createUserDto.country,
        terms: createUserDto.terms,
        passwordHash: hashedPassword,
        avatarUrl: null,
        customerReferenceId,
        isVerified: createUserDto.isVerified ?? true,
        isVip: createUserDto.isVip ?? true,
        hasAccess: createUserDto.hasAccess ?? true,
      })
      .returning();

    return {
      user: this.toUserResponseDto(newUser),
      access_token: this.generateToken(newUser),
    };
  }

  async validateUser(loginDto: LoginDto): Promise<AuthResponse> {
    let user = await this.db.query.users.findFirst({
      where: eq(schema.users.email, loginDto.email),
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Backfill customerReferenceId if missing
    if (!user.customerReferenceId) {
      user = await this.ensureCustomerReferenceId(user);
    }

    // ─── Zero-Trust Account Suspension Check ───
    if (!user.hasAccess) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account access has been restricted by administration.',
        user: {
          id: user.id,
          customerReferenceId: user.customerReferenceId,
          email: user.email,
          firstname: user.firstName,
          lastname: user.lastName,
          hasAccess: false,
        },
      });
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'SOCIAL_ACCOUNT_LOGIN_REQUIRED',
        message:
          'This account uses social login. Please log in with your social account (Google, Facebook, or Instagram), or use Forgot Password to set a password.',
        provider: user.provider || 'social',
      });
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    // ─── 2FA Verification ───
    if (user.isTwoFactorEnabled) {
      if (!loginDto.totpCode) {
        const ticket = this.jwtService.sign(
          {
            sub: user.id,
            email: user.email,
            is2FaChallenge: true,
            staySignedIn: Boolean(loginDto.staySignedIn),
          },
          { expiresIn: '5m' },
        );

        return {
          success: true,
          requiresTwoFactor: true,
          ticket,
          email: user.email,
        };
      }

      const isTotpValid =
        user.twoFactorSecret &&
        verifyTotpCode(loginDto.totpCode.trim(), user.twoFactorSecret);

      if (!isTotpValid) {
        throw new UnauthorizedException('Invalid 6-digit authenticator code.');
      }
    }

    const isLongSession = Boolean(loginDto.staySignedIn);

    // Set JWT token expiration (30 days vs 1 day)
    const expiresIn = isLongSession ? '30d' : '1d';

    // Calculate cookie maxAge duration in milliseconds (30 days vs 1 day)
    const maxAgeMs = isLongSession
      ? 30 * 24 * 60 * 60 * 1000
      : 1 * 24 * 60 * 60 * 1000;

    return {
      user: this.toUserResponseDto(user),
      // Pass dynamic expiresIn option to token generator
      access_token: this.generateToken(user, expiresIn),
      // Return maxAgeMs to be used by the controller for cookie creation
      maxAgeMs,
    };
  }

  async findAll(): Promise<UserResponseDto[]> {
    const allUsers = await this.db.query.users.findMany();
    return allUsers.map((user) => this.toUserResponseDto(user));
  }

  async findMe(userId: string): Promise<UserResponseDto> {
    let user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    // Backfill customerReferenceId if missing
    if (!user.customerReferenceId) {
      user = await this.ensureCustomerReferenceId(user);
    }

    if (!user.hasAccess) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account access has been restricted by administration.',
        user: {
          id: user.id,
          customerReferenceId: user.customerReferenceId,
          email: user.email,
          firstname: user.firstName,
          lastname: user.lastName,
          hasAccess: false,
        },
      });
    }

    return this.toUserResponseDto(user);
  }

  // Update customer profile
  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const existingUser = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!existingUser) {
      throw new NotFoundException('User profile not found');
    }

    // Automatic Cloudflare R2 Asset Cleanup (Orphaned Avatar Deletion)
    const currentAvatarUrl = existingUser.avatarUrl;
    const targetToDelete =
      updateUserDto.oldAvatarUrl ||
      (updateUserDto.avatarUrl !== undefined &&
      updateUserDto.avatarUrl !== currentAvatarUrl
        ? currentAvatarUrl
        : null);

    if (targetToDelete && targetToDelete !== updateUserDto.avatarUrl) {
      await this.uploadsService.deleteAsset(targetToDelete);
    }

    const updateData: Partial<typeof schema.users.$inferInsert> = {};
    if (updateUserDto.firstname !== undefined)
      updateData.firstName = updateUserDto.firstname;
    if (updateUserDto.lastname !== undefined)
      updateData.lastName = updateUserDto.lastname;
    if (updateUserDto.email !== undefined)
      updateData.email = updateUserDto.email;
    if (updateUserDto.country !== undefined)
      updateData.country = updateUserDto.country;
    if (updateUserDto.avatarUrl !== undefined)
      updateData.avatarUrl = updateUserDto.avatarUrl;

    let updatedUser = existingUser;
    if (Object.keys(updateData).length > 0) {
      const [result] = await this.db
        .update(schema.users)
        .set(updateData)
        .where(eq(schema.users.id, userId))
        .returning();
      updatedUser = result;
    }

    return this.toUserResponseDto(updatedUser);
  }

  //update pfp only
  async updateAvatar(
    userId: string,
    avatar: Express.Multer.File,
  ): Promise<UserResponseDto> {
    const existingUser = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!existingUser) {
      throw new NotFoundException('User profile not found');
    }

    // Clean up previous avatar from Cloudflare R2 before uploading new one
    if (existingUser.avatarUrl) {
      await this.uploadsService.deleteAsset(existingUser.avatarUrl);
    }

    const avatarUrl = await this.uploadsService.uploadImage(avatar, 'avatars');

    const [updatedUser] = await this.db
      .update(schema.users)
      .set({ avatarUrl })
      .where(eq(schema.users.id, userId))
      .returning();

    return this.toUserResponseDto(updatedUser);
  }

  // Delete user account securely
  async deleteAccount(userId: string, payloadDto: DeleteAccountDto) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    if (!user.hasAccess) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account access has been restricted by administration.',
        user: {
          id: user.id,
          customerReferenceId: user.customerReferenceId,
          email: user.email,
          firstname: user.firstName,
          lastname: user.lastName,
          hasAccess: false,
        },
      });
    }

    // Verify password using bcrypt (just like login)
    if (payloadDto.deleteMethod === 'password') {
      if (!user.passwordHash) {
        throw new UnauthorizedException(
          'Social login accounts do not have a password. Please use the text confirmation method instead.',
        );
      }

      const isPasswordValid = await bcrypt.compare(
        payloadDto.value,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException(
          'Incorrect password. Account deletion failed.',
        );
      }
    } else if (payloadDto.deleteMethod === 'text') {
      if (payloadDto.value !== 'DELETE') {
        throw new UnauthorizedException(
          'Confirmation text does not match. Type DELETE to confirm.',
        );
      }
    }

    // Clean up customer avatar from Cloudflare R2 if it exists
    if (user.avatarUrl) {
      await this.uploadsService.deleteAsset(user.avatarUrl);
    }

    // Delete user from database
    await this.db.delete(schema.users).where(eq(schema.users.id, userId));

    return { message: 'Account deleted successfully' };
  }

  //update status of a user
  async updateUserStatus(userId: string, dto: UpdateUserStatusDto) {
    // 1. Check if user exists
    const existingUser = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 2. Build dynamic update payload matching your Drizzle schema fields
    const updateData: Partial<typeof schema.users.$inferInsert> = {};
    if (dto.isVip !== undefined) updateData.isVip = dto.isVip;
    if (dto.hasAccess !== undefined) updateData.hasAccess = dto.hasAccess;
    if (dto.isVerified !== undefined) updateData.isVerified = dto.isVerified;

    // 3. Execute update in PostgreSQL
    const [updatedUser] = await this.db
      .update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, userId))
      .returning();

    return updatedUser;
  }

  //---------------------
  //forget password methods
  // 1. Forgot Password: Generate OTP and send email
  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    // Check if user exists
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail))
      .limit(1);

    // If user is suspended, immediately throw structured 403
    if (user && !user.hasAccess) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account access has been restricted by administration.',
        user: {
          id: user.id,
          customerReferenceId: user.customerReferenceId,
          email: user.email,
          firstname: user.firstName,
          lastname: user.lastName,
          hasAccess: false,
        },
      });
    }

    // Security practice: Always return success even if email doesn't exist
    if (!user) {
      return {
        message: 'If an account with that email exists, an OTP has been sent.',
      };
    }

    // Generate a random 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration time to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Remove any existing active reset request for this email first
    await this.db
      .delete(schema.passwordResets)
      .where(eq(schema.passwordResets.email, normalizedEmail));

    // Save the new OTP into the permanent password_resets table
    await this.db.insert(schema.passwordResets).values({
      email: normalizedEmail,
      otp,
      expiresAt,
    });

    // Send the email via Resend
    await this.emailService.sendOtpEmail(normalizedEmail, otp);

    return {
      message: 'If an account with that email exists, an OTP has been sent.',
    };
  }

  // 2. Reset Password: Verify OTP and update password
  async resetPassword(dto: ResetPasswordDto) {
    const { email, otp, newPassword } = dto;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user is suspended
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail))
      .limit(1);

    if (user && !user.hasAccess) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account access has been restricted by administration.',
        user: {
          id: user.id,
          customerReferenceId: user.customerReferenceId,
          email: user.email,
          firstname: user.firstName,
          lastname: user.lastName,
          hasAccess: false,
        },
      });
    }

    // Find the reset record for this email
    const [resetRecord] = await this.db
      .select()
      .from(schema.passwordResets)
      .where(eq(schema.passwordResets.email, normalizedEmail))
      .limit(1);

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired OTP request');
    }

    // Verify OTP code matches
    if (resetRecord.otp !== otp) {
      throw new BadRequestException('Incorrect OTP code');
    }

    // Check if OTP has expired
    if (new Date() > new Date(resetRecord.expiresAt)) {
      throw new BadRequestException('OTP code has expired');
    }

    // Hash the new password securely
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the users table (using 'passwordHash')
    await this.db
      .update(schema.users)
      .set({ passwordHash: hashedPassword })
      .where(eq(schema.users.email, normalizedEmail));

    // Clean up: Delete the used reset row from the password_resets table
    await this.db
      .delete(schema.passwordResets)
      .where(eq(schema.passwordResets.email, normalizedEmail));

    return {
      message: 'Password has been successfully reset. You can now log in.',
    };
  }

  //password update
  async updateProfilePassword(dto: UpdatePasswordDto) {
    const { email, currentPassword, newPassword } = dto;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Find the user by email
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is suspended
    if (!user.hasAccess) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account access has been restricted by administration.',
        user: {
          id: user.id,
          customerReferenceId: user.customerReferenceId,
          email: user.email,
          firstname: user.firstName,
          lastname: user.lastName,
          hasAccess: false,
        },
      });
    }

    if (!user.passwordHash) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'SOCIAL_ACCOUNT_NO_PASSWORD',
        message:
          'This account was registered using social login and does not have a password set.',
        provider: user.provider || 'social',
      });
    }

    // 2. Verify that the provided current password matches the database record
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Incorrect current password');
    }

    // 3. Ensure the new password is NOT the same as the current password
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password cannot be the same as your current password',
      );
    }

    // 4. Hash the new password securely
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 5. Update the user's password in the database
    await this.db
      .update(schema.users)
      .set({ passwordHash: hashedNewPassword })
      .where(eq(schema.users.email, normalizedEmail));

    return { message: 'Password updated successfully' };
  }

  // ─── Customer 2FA: Generate Base32 Secret & QR Code Data URL ───
  async generate2Fa(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    if (!user.hasAccess) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account access has been restricted by administration.',
      });
    }

    const secret = generateTotpSecret();
    const otpAuthUrl = generateOtpAuthUrl('Ikisaki Tours', user.email, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    // Persist temporary secret in users.twoFactorTempSecret
    await this.db
      .update(schema.users)
      .set({
        twoFactorTempSecret: secret,
      })
      .where(eq(schema.users.id, userId));

    return {
      success: true,
      secret,
      qrCodeDataUrl,
    };
  }

  // ─── Customer 2FA: Enable / Activate ───
  async enable2Fa(userId: string, dto: EnableCustomer2FaDto) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    if (!user.hasAccess) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account access has been restricted by administration.',
      });
    }

    const tempSecret = user.twoFactorTempSecret;
    if (!tempSecret) {
      throw new BadRequestException(
        'No pending 2FA setup found. Please generate a QR code first.',
      );
    }

    const isValid = verifyTotpCode(dto.totpCode.trim(), tempSecret);
    if (!isValid) {
      throw new BadRequestException(
        'Invalid 6-digit verification code. Please check your authenticator app.',
      );
    }

    await this.db
      .update(schema.users)
      .set({
        isTwoFactorEnabled: true,
        twoFactorSecret: tempSecret,
        twoFactorTempSecret: null,
      })
      .where(eq(schema.users.id, userId));

    return {
      success: true,
      message: 'Two-Factor Authentication activated successfully.',
    };
  }

  // ─── Customer 2FA: Disable ───
  async disable2Fa(userId: string, dto: DisableCustomer2FaDto) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    if (!user.hasAccess) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account access has been restricted by administration.',
      });
    }

    if (!user.isTwoFactorEnabled) {
      return {
        success: true,
        message: 'Two-Factor Authentication is already disabled.',
      };
    }

    let verified = false;

    if (dto.currentPassword && user.passwordHash) {
      const isPasswordValid = await bcrypt.compare(
        dto.currentPassword,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        throw new BadRequestException('Incorrect current password.');
      }
      verified = true;
    } else if (dto.totpCode && user.twoFactorSecret) {
      const isTotpValid = verifyTotpCode(
        dto.totpCode.trim(),
        user.twoFactorSecret,
      );
      if (!isTotpValid) {
        throw new BadRequestException(
          'Invalid 6-digit verification code. Please check your authenticator app.',
        );
      }
      verified = true;
    } else {
      if (user.passwordHash) {
        throw new BadRequestException(
          'Please provide your current password or 6-digit authenticator code to disable 2FA.',
        );
      } else {
        throw new BadRequestException(
          'Please provide your 6-digit authenticator code to disable 2FA.',
        );
      }
    }

    if (!verified) {
      throw new BadRequestException('Verification failed.');
    }

    await this.db
      .update(schema.users)
      .set({
        isTwoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorTempSecret: null,
      })
      .where(eq(schema.users.id, userId));

    return {
      success: true,
      message: 'Two-Factor Authentication disabled successfully.',
    };
  }

  // ─── Verify 2FA Challenge during Login (Social or Email/Password) ───
  async verifyTwoFactorChallenge(
    dto: VerifyTotpChallengeDto,
  ): Promise<AuthResponse> {
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.ticket);
    } catch {
      throw new UnauthorizedException(
        '2FA verification session has expired. Please log in again.',
      );
    }

    if (!payload?.sub || !payload?.is2FaChallenge) {
      throw new UnauthorizedException('Invalid 2FA challenge ticket.');
    }

    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, payload.sub),
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    if (!user.hasAccess) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account access has been restricted by administration.',
        user: {
          id: user.id,
          customerReferenceId: user.customerReferenceId,
          email: user.email,
          firstname: user.firstName,
          lastname: user.lastName,
          hasAccess: false,
        },
      });
    }

    if (!user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled for this account.');
    }

    const isValid = verifyTotpCode(dto.totpCode.trim(), user.twoFactorSecret);
    if (!isValid) {
      throw new UnauthorizedException('Invalid 6-digit authenticator code.');
    }

    const isLongSession = Boolean(dto.staySignedIn ?? payload.staySignedIn);
    const expiresIn = isLongSession ? '30d' : '1d';
    const maxAgeMs = isLongSession
      ? 30 * 24 * 60 * 60 * 1000
      : 1 * 24 * 60 * 60 * 1000;

    const access_token = this.generateToken(user, expiresIn);

    return {
      success: true,
      user: this.toUserResponseDto(user),
      access_token,
      maxAgeMs,
    };
  }
}
