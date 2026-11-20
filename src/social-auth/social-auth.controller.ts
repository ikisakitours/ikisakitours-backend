import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import express from 'express';
import { SocialAuthService } from './social-auth.service';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    return { state: req.query.state };
  }
}

@Injectable()
export class FacebookOAuthGuard extends AuthGuard('facebook') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    return { state: req.query.state };
  }
}
@Injectable()
export class InstagramOAuthGuard extends AuthGuard('instagram') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    return { state: req.query.state };
  }
}

@Controller('social-auth')
export class SocialAuthController {
  constructor(private readonly socialAuthService: SocialAuthService) {}

  // 1. Trigger Google Login Redirect
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(@Req() req) {
    // Initiates the Google OAuth flow
  }

  // 2. Google Callback Redirect
  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: express.Response) {
    const state = req.query.state as string;
    return this.handleAuthRedirect(req, res, state);
  }

  // 1. Trigger Instagram Login Redirect
  @Get('instagram')
  @UseGuards(InstagramOAuthGuard)
  async instagramAuth(@Req() req) {
    // Initiates the Instagram OAuth flow
  }

  // 2. Instagram Callback Redirect
  @Get('instagram/redirect')
  @UseGuards(AuthGuard('instagram'))
  async instagramAuthRedirect(@Req() req, @Res() res: express.Response) {
    const state = req.query.state as string;
    return this.handleAuthRedirect(req, res, state);
  }

  // 1. Trigger Facebook Login Redirect
  @Get('facebook')
  @UseGuards(FacebookOAuthGuard)
  async facebookAuth(@Req() req) {
    // Initiates the Facebook OAuth flow
  }

  // 2. Facebook Callback Redirect
  @Get('facebook/redirect')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthRedirect(@Req() req, @Res() res: express.Response) {
    const state = req.query.state as string;
    return this.handleAuthRedirect(req, res, state);
  }

  private async handleAuthRedirect(
    req: any,
    res: express.Response,
    state?: string,
  ) {
    const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');

    const redirectPath = state && state.startsWith('/') ? state : '/';
    try {
      const socialUser = req.user; // Comes from strategy validate()
      const result =
        await this.socialAuthService.validateSocialUser(socialUser);

      // If user has 2FA enabled, redirect to 2FA challenge step on frontend (do NOT set session cookie yet)
      if (result.requiresTwoFactor) {
        const queryParams = new URLSearchParams({
          step: '2fa_challenge',
          ticket: result.twoFactorTicket,
          email: result.email,
          ...(result.customerReferenceId
            ? { ref: result.customerReferenceId }
            : {}),
        });
        return res.redirect(`${frontendUrl}/login?${queryParams.toString()}`);
      }

      // Set the standard app cookie
      res.cookie('token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: result.maxAgeMs,
      });

      // Redirect user back to Next.js frontend
      return res.redirect(`${frontendUrl}${redirectPath}`);
    } catch (error: any) {
      const responseData =
        typeof error?.getResponse === 'function'
          ? error.getResponse()
          : error?.response;

      if (
        error instanceof ForbiddenException ||
        error?.status === 403 ||
        responseData?.error === 'ACCOUNT_SUSPENDED'
      ) {
        const refId = responseData?.user?.customerReferenceId || '';
        const email = responseData?.user?.email || '';

        const queryParams = new URLSearchParams({
          error: 'ACCOUNT_SUSPENDED',
          statusCode: '403',
          ...(refId ? { ref: refId } : {}),
          ...(email ? { email } : {}),
        });

        return res.redirect(`${frontendUrl}/login?${queryParams.toString()}`);
      }

      return res.redirect(`${frontendUrl}/login?error=SocialLoginFailed`);
    }
  }
}
