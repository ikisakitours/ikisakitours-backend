import {
  Controller,
  Post,
  Get,
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

    const isProduction = process.env.NODE_ENV === 'production';

    // Set 15-minute Access Token cookie
    res.cookie('admin_session', result.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    // Set 7-day Refresh Token cookie
    res.cookie('admin_refresh', result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      success: true,
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  // 2. POST /api/admin/auth/logout
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['admin_refresh'];
    const adminId = (req as any).user?.sub;

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
  async getMe(@Req() req: Request & { user: { sub: string } }) {
    return await this.authService.getMe(req.user.sub);
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
      user: result.user,
      accessToken: result.accessToken,
    };
  }
}
