import { Injectable, Inject, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
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

type User = typeof schema.users.$inferSelect;

export interface AuthResponse {
  user: UserResponseDto;
  access_token: string;
  maxAgeMs?: number; // Added maxAgeMs to pass cookie duration to controller
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly jwtService: JwtService,
    private readonly uploadsService: UploadsService, // new
  ) {}

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

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    // Check if user checked 'staySignedIn'
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

  // new cloudflareR2
  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
    avatar?: Express.Multer.File,
  ): Promise<UserResponseDto> {
    const existingUser = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!existingUser) {
      throw new NotFoundException('User profile not found');
    }

    // If a new avatar was uploaded, send it to R2 and get the URL back
    let avatarUrl: string | undefined;
    if (avatar) {
      avatarUrl = await this.uploadsService.uploadImage(avatar, 'avatars');
    }

    const [updatedUser] = await this.db
      .update(schema.users)
      .set({
        ...(updateUserDto.firstName && { firstName: updateUserDto.firstName }),
        ...(updateUserDto.lastName && { lastName: updateUserDto.lastName }),
        ...(updateUserDto.email && { email: updateUserDto.email }),
        ...(updateUserDto.country && { country: updateUserDto.country }),
        ...(avatarUrl && { avatarUrl }),
      })
      .where(eq(schema.users.id, userId))
      .returning();

    return this.toUserResponseDto(updatedUser);
  }
}