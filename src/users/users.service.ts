import { Injectable } from '@nestjs/common';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  // Placeholder data matching your database table layout
  private readonly users: UserResponseDto[] = [
    {
      id: 'usr_01',
      name: 'Alex Morgan',
      email: 'alex.m@example.com',
      role: 'Admin',
      passwordHash: 'p@ssword123',
      createdAt: 'Jan 2026',
    },
    {
      id: 'usr_02',
      name: 'Sarah Jenkins',
      email: 'sarah.j@example.com',
      role: 'Tour Operator',
      passwordHash: 'securePass#99',
      createdAt: 'Feb 2026',
    },
  ];

  findAll(): UserResponseDto[] {
    // When connecting Prisma/TypeORM later, replace this with: return this.userRepo.find();
    return this.users;
  }
}