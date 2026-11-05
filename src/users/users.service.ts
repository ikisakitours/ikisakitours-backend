import { Injectable, Inject, ConflictException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
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

type User = typeof schema.users.$inferSelect;

export interface AuthResponse {
  user: UserResponseDto;
  access_token: string;
  maxAgeMs?: number;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly jwtService: JwtService,
    private readonly uploadsService: UploadsService,
    private readonly emailService: EmailService,
  ) { }

  private toUserResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      firstname: user.firstName,
      lastname: user.lastName,
      email: user.email,
      country: user.country,
      avatarUrl: user.avatarUrl ?? null,
      isVerified: user.isVerified,
      isVip: user.isVip,
      hasAccess: user.hasAccess,
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
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.email, loginDto.email),
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    // ─── NEW ADDITION: Check if user is blocked (hasAccess is false) ───
    // If the user's account has been blocked or access is revoked, 
    // reject the login attempt and send an "Access denied" response.
    if (!user.hasAccess) {
      throw new UnauthorizedException('Access denied');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('This account uses social login. Please log in with Google or Instagram.');
    }
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

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
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return this.toUserResponseDto(user);
  }

  // without user pfp route
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

    const [updatedUser] = await this.db
      .update(schema.users)
      .set({
        ...(updateUserDto.firstname && { firstName: updateUserDto.firstname }),
        ...(updateUserDto.lastname && { lastName: updateUserDto.lastname }),
        ...(updateUserDto.email && { email: updateUserDto.email }),
        ...(updateUserDto.country && { country: updateUserDto.country }),
      })
      .where(eq(schema.users.id, userId))
      .returning();

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

    // Verify password using bcrypt (just like login)
    if (payloadDto.deleteMethod === 'password') {
      if (!user.passwordHash) {
        throw new UnauthorizedException('Social login accounts do not have a password. Please use the text confirmation method instead.');
      }

      const isPasswordValid = await bcrypt.compare(payloadDto.value, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Incorrect password. Account deletion failed.');
      }
    } else if (payloadDto.deleteMethod === 'text') {
      if (payloadDto.value !== 'DELETE') {
        throw new UnauthorizedException('Confirmation text does not match. Type DELETE to confirm.');
      }
    }

    // Delete user from database
    await this.db
      .delete(schema.users)
      .where(eq(schema.users.id, userId));

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
    // Check if user exists
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    // Security practice: Always return success even if email doesn't exist
    if (!user) {
      return { message: 'If an account with that email exists, an OTP has been sent.' };
    }

    // Generate a random 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration time to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Remove any existing active reset request for this email first
    await this.db
      .delete(schema.passwordResets)
      .where(eq(schema.passwordResets.email, email));

    // Save the new OTP into the permanent password_resets table
    await this.db.insert(schema.passwordResets).values({
      email,
      otp,
      expiresAt,
    });

    // Send the email via Resend
    await this.emailService.sendOtpEmail(email, otp);

    return { message: 'If an account with that email exists, an OTP has been sent.' };
  }

  // 2. Reset Password: Verify OTP and update password
  async resetPassword(dto: ResetPasswordDto) {
    const { email, otp, newPassword } = dto;

    // Find the reset record for this email
    const [resetRecord] = await this.db
      .select()
      .from(schema.passwordResets)
      .where(eq(schema.passwordResets.email, email))
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
      .where(eq(schema.users.email, email));

    // Clean up: Delete the used reset row from the password_resets table
    await this.db
      .delete(schema.passwordResets)
      .where(eq(schema.passwordResets.email, email));

    return { message: 'Password has been successfully reset. You can now log in.' };
  }


  //password update
  async updateProfilePassword(dto: UpdatePasswordDto) {
    const { email, currentPassword, newPassword } = dto;

    // 1. Find the user by email
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (!user || !user.passwordHash) {
      throw new NotFoundException('User not found or password not set');
    }

    // 2. Verify that the provided current password matches the database record
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Incorrect current password');
    }

    // 3. Ensure the new password is NOT the same as the current password
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new BadRequestException('New password cannot be the same as your current password');
    }

    // 4. Hash the new password securely
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 5. Update the user's password in the database
    await this.db
      .update(schema.users)
      .set({ passwordHash: hashedNewPassword })
      .where(eq(schema.users.email, email));

    return { message: 'Password updated successfully' };
  }
}
