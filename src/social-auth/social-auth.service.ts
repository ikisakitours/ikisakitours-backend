import { Injectable, Inject } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { JwtService } from '@nestjs/jwt';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';

type User = typeof schema.users.$inferSelect;

@Injectable()
export class SocialAuthService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly jwtService: JwtService,
  ) {}

  private generateToken(user: User): string {
    const payload = { sub: user.id };
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  async validateSocialUser(profile: {
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    provider: string;
    providerId: string;
  }) {
    // 1. Check if user already exists by email
    let user = await this.db.query.users.findFirst({
      where: eq(schema.users.email, profile.email),
    });

    // 2. If user doesn't exist, auto-register them
    if (!user) {
      const [newUser] = await this.db
        .insert(schema.users)
        .values({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          country: 'Unknown',
          terms: true,
          passwordHash: '',
          avatarUrl: profile.avatarUrl,
          provider: profile.provider,
          providerId: profile.providerId,
          isVerified: true,
          isVip: false,
          hasAccess: true,
        })
        .returning();

      user = newUser;
    }

    // 3. Generate your standard app JWT token & cookie configurations
    const accessToken = this.generateToken(user);
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days

    return {
      user,
      access_token: accessToken,
      maxAgeMs,
    };
  }
}