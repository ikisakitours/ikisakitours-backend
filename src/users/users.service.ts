import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  private users: any[] = []; // In-memory store (Replace with DB repo later)

  // Private helper to format raw database entities into UserResponseDto
  private toUserResponseDto(user: any): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async register(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = this.users.find((u) => u.email === createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = {
      id: `usr_${Date.now()}`,
      name: createUserDto.name,
      email: createUserDto.email,
      role: createUserDto.role || 'User',
      passwordHash: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);

    // Formatted cleanly via DTO helper
    return this.toUserResponseDto(newUser);
  }

  async validateUser(loginDto: LoginDto): Promise<UserResponseDto> {
    const user = this.users.find((u) => u.email === loginDto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    return this.toUserResponseDto(user);
  }

  // Used by Admin Panel GET /users
  findAll(): UserResponseDto[] {
    return this.users.map((user) => this.toUserResponseDto(user));
  }
}