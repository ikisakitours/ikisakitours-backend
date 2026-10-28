import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL:
        process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
      scope: ['email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const email = emails && emails[0] ? emails[0].value : `${id}@facebook.user`;
    const firstName = name?.givenName || 'Facebook';
    const lastName = name?.familyName || 'User';
    const avatarUrl = photos && photos[0] ? photos[0].value : null;

    const userPayload = {
      email,
      firstName,
      lastName,
      avatarUrl,
      provider: 'facebook',
      providerId: id,
    };

    done(null, userPayload);
  }
}