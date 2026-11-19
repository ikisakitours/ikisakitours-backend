import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';
import { Enable2FaDto } from './dto/enable-2fa.dto';
import { Disable2FaDto } from './dto/disable-2fa.dto';
import { AdminAuthGuard } from './admin-auth.guard';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AdminAuthService) {}

  // 1. POST /api/admin/auth/login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: AdminLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.login(dto, clientIp, userAgent);

    // If 2FA is required and code not provided, return HTTP 200 without issuing cookies/tokens
    if (result.requiresTwoFactor) {
      return {
        success: false,
        requiresTwoFactor: true,
        message: result.message || 'Two-factor authentication code required.',
      };
    }

    const isProduction = process.env.NODE_ENV === 'production';

    // Set 15-minute Access Token cookie
    res.cookie('admin_session', result.accessToken!, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    // Set 7-day Refresh Token cookie
    res.cookie('admin_refresh', result.refreshToken!, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      success: true,
      token: result.accessToken,
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  // 2. POST /api/admin/auth/logout
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['admin_refresh'];
    const adminId = (req as any).user?.sub || (req as any).user?.id;

    await this.authService.logout(refreshToken, adminId);

    const isProduction = process.env.NODE_ENV === 'production';

    res.clearCookie('admin_session', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
    });

    res.clearCookie('admin_refresh', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
    });

    return { success: true, message: 'Logged out successfully' };
  }

  // 3. GET /api/admin/auth/me
  @UseGuards(AdminAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request & { user: { sub?: string; id?: string } }) {
    const adminId = req.user.sub || req.user.id!;
    return await this.authService.getMe(adminId);
  }

  // 4. POST /api/admin/auth/refresh
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['admin_refresh'];
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.refreshSession(
      refreshToken,
      clientIp,
      userAgent,
    );

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('admin_session', result.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('admin_refresh', result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      success: true,
      token: result.accessToken,
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  // 5. PATCH /api/admin/auth/profile
  @UseGuards(AdminAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Req() req: Request & { user: { sub: string; id?: string } },
    @Body() dto: UpdateAdminProfileDto,
  ) {
    const adminId = req.user.sub || req.user.id!;
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return await this.authService.updateProfile(
      adminId,
      dto,
      clientIp,
      userAgent,
    );
  }

  // 6. PATCH /api/admin/auth/change-password
  @UseGuards(AdminAuthGuard)
  @Patch('change-password')
  async changePassword(
    @Req() req: Request & { user: { sub: string; id?: string } },
    @Body() dto: ChangeAdminPasswordDto,
  ) {
    const adminId = req.user.sub || req.user.id!;
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return await this.authService.changePassword(
      adminId,
      dto,
      clientIp,
      userAgent,
    );
  }

  // 7. POST /api/admin/auth/2fa/generate
  @UseGuards(AdminAuthGuard)
  @Post('2fa/generate')
  @HttpCode(HttpStatus.OK)
  async generate2Fa(
    @Req() req: Request & { user: { sub: string; id?: string } },
  ) {
    const adminId = req.user.sub || req.user.id!;
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return await this.authService.generate2Fa(adminId, clientIp, userAgent);
  }

  // 8. POST /api/admin/auth/2fa/enable
  @UseGuards(AdminAuthGuard)
  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  async enable2Fa(
    @Req() req: Request & { user: { sub: string; id?: string } },
    @Body() dto: Enable2FaDto,
  ) {
    const adminId = req.user.sub || req.user.id!;
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return await this.authService.enable2Fa(
      adminId,
      dto,
      clientIp,
      userAgent,
    );
  }

  // 9. POST /api/admin/auth/2fa/disable
  @UseGuards(AdminAuthGuard)
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  async disable2Fa(
    @Req() req: Request & { user: { sub: string; id?: string } },
    @Body() dto: Disable2FaDto,
  ) {
    const adminId = req.user.sub || req.user.id!;
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return await this.authService.disable2Fa(
      adminId,
      dto,
      clientIp,
      userAgent,
    );
  }
}
