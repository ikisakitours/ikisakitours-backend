import { Controller, Get, Post, Body, UseGuards, Res, Req } from '@nestjs/common'; // Added Res import
import type { Response } from 'express'; // Added Response type import
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminApiKeyGuard } from './admin-api-key.guard';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // PUBLIC: Handles POST /api/auth/signup
  @Post('signup')
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.register(createUserDto);
  }

  // PUBLIC: Handles POST /api/auth/login
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response, // Added response decorator to attach cookies dynamically
  ) {
    const authResult = await this.usersService.validateUser(loginDto);

    // Check if maxAgeMs was provided by usersService
    if (authResult.maxAgeMs) {
      // Set the token inside an HTTP-only cookie
      res.cookie('token', authResult.access_token, {
        httpOnly: true,                                // Protects from XSS (JavaScript cannot access cookie)
        //secure: process.env.NODE_ENV === 'production', // Requires HTTPS in production
        secure: true,
        //sameSite: 'lax',                               // Protects against CSRF attacks
        sameSite: 'none',
        maxAge: authResult.maxAgeMs,                   // Dynamic duration (1 day vs 30 days)
      });
    }

    // Return the response object (access_token and user remain intact for JSON responses)
    return authResult;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      //secure: process.env.NODE_ENV === 'production',
      //sameSite: 'lax',
      sameSite: 'none',
      secure: true,
    });

    return { message: 'Logged out successfully' };
  }

  // PROTECTED: Handles GET /api/auth/users (Requires valid Bearer Token)
  @UseGuards(AdminApiKeyGuard)
  @Get('users')
  async findAll() {
    return await this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findMe(@Req() req: Request & { user: { sub: string } }): Promise<UserResponseDto> {
    return await this.usersService.findMe(req.user.sub);
  }
}