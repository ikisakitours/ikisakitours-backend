import {
  Injectable,
  Inject,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { JwtService } from '@nestjs/jwt';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { generateCustomerReferenceId } from '../common/utils/reference-id.util';

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

    // Backfill customerReferenceId for existing social login users if missing
    if (user && !user.customerReferenceId) {
      const customerReferenceId = generateCustomerReferenceId();
      const [updated] = await this.db
        .update(schema.users)
        .set({ customerReferenceId })
        .where(eq(schema.users.id, user.id))
        .returning();
      if (updated) user = updated;
    }

    // ─── Zero-Trust Account Suspension Check ───
    if (user && !user.hasAccess) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account access has been restricted by administration.',
        user: {
          id: user.id,
          customerReferenceId: user.customerReferenceId,
          email: user.email,
          firstname: user.firstName,
          lastname: user.lastName,
          hasAccess: false,
        },
      });
    }

    // 2. If user doesn't exist, auto-register them
    if (!user) {
      const customerReferenceId = generateCustomerReferenceId();
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
          customerReferenceId,
          provider: profile.provider,
          providerId: profile.providerId,
          isVerified: true,
          isVip: false,
          hasAccess: true,
        })
        .returning();

      user = newUser;
    }

    // ─── Zero-Trust 2FA Challenge for Social Logins ───
    if (user.isTwoFactorEnabled) {
      const twoFactorTicket = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          is2FaChallenge: true,
        },
        { expiresIn: '5m' },
      );

      return {
        requiresTwoFactor: true,
        twoFactorTicket,
        email: user.email,
        customerReferenceId: user.customerReferenceId,
        user: {
          ...user,
          referenceId: user.customerReferenceId,
        },
        access_token: '',
        maxAgeMs: 0,
      };
    }

    // 3. Generate your standard app JWT token & cookie configurations
    const accessToken = this.generateToken(user);
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days

    return {
      user: {
        ...user,
        referenceId: user.customerReferenceId,
      },
      access_token: accessToken,
      maxAgeMs,
    };
  }
}
