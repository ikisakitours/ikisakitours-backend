import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Res,
  Req,
  Patch,
  UseInterceptors,
  UploadedFile,
  Delete,
  Param,
} from '@nestjs/common'; // Added Res import
import type { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminApiKeyGuard } from './admin-api-key.guard';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { EnableCustomer2FaDto } from './dto/enable-2fa.dto';
import { DisableCustomer2FaDto } from './dto/disable-2fa.dto';
import { VerifyTotpChallengeDto } from './dto/verify-totp-challenge.dto';

import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';

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
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authResult = await this.usersService.validateUser(loginDto);

    // If 2FA is required, do NOT set cookie or issue token, return 2FA challenge prompt with verification ticket
    if (authResult.requiresTwoFactor) {
      return {
        success: true,
        requiresTwoFactor: true,
        ticket: authResult.ticket,
        email: authResult.email,
      };
    }

    // Check if maxAgeMs was provided by usersService
    if (authResult.maxAgeMs && authResult.access_token) {
      // Set the token inside an HTTP-only cookie
      res.cookie('token', authResult.access_token, {
        httpOnly: true, // Protects from XSS (JavaScript cannot access cookie)
        //secure: process.env.NODE_ENV === 'production', // Requires HTTPS in production
        secure: true,
        //sameSite: 'lax',                               // Protects against CSRF attacks
        sameSite: 'none',
        maxAge: authResult.maxAgeMs, // Dynamic duration (1 day vs 30 days)
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

  // PROTECTED: Handles GET /api/auth/users (Requires valid Admin Session or API Key)
  @UseGuards(AdminAuthGuard)
  @Get('users')
  async findAll() {
    return await this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findMe(
    @Req() req: Request & { user: { sub: string } },
  ): Promise<UserResponseDto> {
    return await this.usersService.findMe(req.user.sub);
  }

  // Text fields only
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(
    @Req() req: Request & { user: { sub: string } },
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return await this.usersService.updateProfile(req.user.sub, updateUserDto);
  }

  // Avatar only
  @UseGuards(JwtAuthGuard)
  @Patch('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateAvatar(
    @Req() req: Request & { user: { sub: string } },
    @UploadedFile() avatar: Express.Multer.File,
  ): Promise<UserResponseDto> {
    return await this.usersService.updateAvatar(req.user.sub, avatar);
  }

  //update status of a user
  @UseGuards(AdminApiKeyGuard)
  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return await this.usersService.updateUserStatus(
      userId,
      updateUserStatusDto,
    );
  }

  // PROTECTED: Handles DELETE /api/auth/me
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteMe(
    @Req() req: Request & { user: { sub: string } },
    @Body() deleteAccountDto: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // 1. Delete the user from the database after password validation
    const result = await this.usersService.deleteAccount(
      req.user.sub,
      deleteAccountDto,
    );

    // 2. Clear the cookie since the user's account is now deleted and they are logged out
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    return result;
  }

  //---------------------------------------------------
  //profile password update
  @Post('update-password')
  async updatePassword(@Body() dto: UpdatePasswordDto) {
    return this.usersService.updateProfilePassword(dto);
  }

  //---------------------------------------------------
  //forget password section
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.usersService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.usersService.resetPassword(dto);
  }

  // ─── Customer 2FA Endpoints ───
  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  async generate2Fa(@Req() req: Request & { user: { sub: string } }) {
    return await this.usersService.generate2Fa(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  async enable2Fa(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: EnableCustomer2FaDto,
  ) {
    return await this.usersService.enable2Fa(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  async disable2Fa(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: DisableCustomer2FaDto,
  ) {
    return await this.usersService.disable2Fa(req.user.sub, dto);
  }

  // PUBLIC: Handles POST /api/auth/2fa/verify-challenge (Completes 2FA login for Social or Password)
  @Post('2fa/verify-challenge')
  async verifyTwoFactorChallenge(
    @Body() dto: VerifyTotpChallengeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authResult = await this.usersService.verifyTwoFactorChallenge(dto);

    if (authResult.maxAgeMs && authResult.access_token) {
      res.cookie('token', authResult.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: authResult.maxAgeMs,
      });
    }

    return authResult;
  }
}
