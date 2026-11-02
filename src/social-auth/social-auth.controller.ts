import { Controller, Get, Req, Res, UseGuards,ExecutionContext, Injectable } from '@nestjs/common';
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
  constructor(private readonly socialAuthService: SocialAuthService) { }

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

  private async handleAuthRedirect(req: any, res: express.Response,state?: string) {
   const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    
    const redirectPath = (state && state.startsWith('/')) ? state : '/';
    try {
      const socialUser = req.user; // Comes from strategy validate()
      const { access_token, maxAgeMs } =
        await this.socialAuthService.validateSocialUser(socialUser);

      // Set the standard app cookie
      res.cookie('token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: maxAgeMs,
      });

      // Redirect user back to Next.js frontend
    return res.redirect(`${frontendUrl}${redirectPath}`);
    } catch (error) {
      return res.redirect(`${frontendUrl}/login?error=SocialLoginFailed`);
    }
  }
}
