import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { SocialAuthController } from './social-auth.controller';
import { SocialAuthService } from './social-auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { DatabaseModule } from '../database/database.module';
//import { InstagramStrategy } from './strategies/instagram.strategy';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_jwt_secret',
    }),
  ],
  controllers: [SocialAuthController],
  providers: [
    SocialAuthService,
    GoogleStrategy,
    // InstagramStrategy, // <-- Disabled for now
  ],
})
export class SocialAuthModule {}