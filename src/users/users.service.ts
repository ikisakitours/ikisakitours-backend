import { Injectable, Inject, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';

type User = typeof schema.users.$inferSelect;

export interface AuthResponse {
  user: UserResponseDto;
  access_token: string;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly jwtService: JwtService,
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

  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
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

    return {
      user: this.toUserResponseDto(user),
      access_token: this.generateToken(user),
    };
  }

  async findAll(): Promise<UserResponseDto[]> {
    const allUsers = await this.db.query.users.findMany();
    return allUsers.map((user) => this.toUserResponseDto(user));
  }
}