import { Injectable, Inject, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';

type User = typeof schema.users.$inferSelect;

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}


  private toUserResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      firstname: user.firstName,
      lastname: user.lastName,
      email: user.email,
      country: user.country,
      createdAt: user.createdAt,
    };
  }

  async register(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Check if user exists in Supabase DB
    const existingUser = await this.db.query.users.findFirst({
      where: eq(schema.users.email, createUserDto.email),
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Insert into Supabase DB via Drizzle
    const [newUser] = await this.db
      .insert(schema.users)
      .values({
        firstName: createUserDto.firstname,
        lastName: createUserDto.lastname,
        email: createUserDto.email,
        country: createUserDto.country,
        terms: createUserDto.terms,
        passwordHash: hashedPassword,
      })
      .returning();

    // Formatted cleanly via DTO helper
    return this.toUserResponseDto(newUser);
  }

  async validateUser(loginDto: LoginDto): Promise<UserResponseDto> {
    // Fetch user from DB by email
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.email, loginDto.email),
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    return this.toUserResponseDto(user);
  }

  // Used by Admin Panel GET /users
  async findAll(): Promise<UserResponseDto[]> {
    const allUsers = await this.db.query.users.findMany();
    return allUsers.map((user) => this.toUserResponseDto(user));
  }
}