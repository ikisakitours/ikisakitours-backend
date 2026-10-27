import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-instagram';

@Injectable()
export class InstagramStrategy extends PassportStrategy(Strategy, 'instagram') {
  constructor() {
    super({
      clientID: process.env.INSTAGRAM_CLIENT_ID,
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
      callbackURL:
        process.env.INSTAGRAM_CALLBACK_URL,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    const { id, username, displayName } = profile;

    // Instagram does not pass email by default, so generate fallback
    const userPayload = {
      email: `${username || id}@instagram.user`,
      firstName: displayName || username || 'Instagram User',
      lastName: '',
      avatarUrl: profile._json?.data?.profile_picture || null,
      provider: 'instagram',
      providerId: id,
    };

    done(null, userPayload);
  }
}