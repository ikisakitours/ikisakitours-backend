import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // PUBLIC: Handles POST /api/auth/signup
  @Post('signup')
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.register(createUserDto);
  }

  // PUBLIC: Handles POST /api/auth/login
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.usersService.validateUser(loginDto);
  }

  // PROTECTED: Handles GET /api/auth/users (Requires valid Bearer Token)
  @UseGuards(JwtAuthGuard)
  @Get('users')
  async findAll() {
    return await this.usersService.findAll();
  }
}