import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { R2_CLIENT } from '../uploads/r2.provider';
import { deleteR2Asset } from '../uploads/r2-delete.util';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffRoleDto } from './dto/update-staff-role.dto';
import { UpdateStaffStatusDto } from './dto/update-staff-status.dto';
import { ResetStaffPasswordDto } from './dto/reset-staff-password.dto';

@Injectable()
export class AdminStaffService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly configService: ConfigService,
    @Optional() @Inject(R2_CLIENT) private readonly s3Client?: S3Client,
  ) {}

  private getS3Client(): S3Client | null {
    if (this.s3Client) return this.s3Client;
    const accountId =
      this.configService.get('R2_ACCOUNT_ID') || process.env.R2_ACCOUNT_ID;
    const accessKeyId =
      this.configService.get('R2_ACCESS_KEY_ID') ||
      process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey =
      this.configService.get('R2_SECRET_ACCESS_KEY') ||
      process.env.R2_SECRET_ACCESS_KEY;
    if (accountId && accessKeyId && secretAccessKey) {
      return new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
    }
    return null;
  }

  private getBucketName(): string {
    return (
      this.configService.get<string>('R2_BUCKET_NAME') ||
      process.env.R2_BUCKET_NAME ||
      ''
    );
  }

  private async logAudit(
    adminId: string,
    action: string,
    resource: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      await this.db.insert(schema.adminAuditLogs).values({
        adminId,
        action,
        resource,
        details: details || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch (err) {
      console.error('Failed to log admin staff audit action:', err);
    }
  }

  // 1. Get all internal staff members
  async getAllStaff() {
    const staffList = await this.db.query.adminUsers.findMany({
      orderBy: [desc(schema.adminUsers.createdAt)],
    });

    return staffList.map((member) => ({
      id: member.id,
      email: member.email,
      fullName: member.fullName,
      role: member.role,
      avatarUrl: member.avatarUrl || null,
      isActive: member.isActive,
      isTwoFactorEnabled: member.isTwoFactorEnabled,
      lastLoginAt: member.lastLoginAt,
      lastLoginIp: member.lastLoginIp || null,
      createdAt: member.createdAt,
    }));
  }

  // 2. Create a new staff member
  async createStaff(
    dto: CreateStaffDto,
    requesterId: string,
    clientIp?: string,
    userAgent?: string,
  ) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existing = await this.db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.email, normalizedEmail),
    });

    if (existing) {
      throw new ConflictException('A staff member with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const [created] = await this.db
      .insert(schema.adminUsers)
      .values({
        fullName: dto.fullName.trim(),
        email: normalizedEmail,
        passwordHash,
        role: dto.role,
        isActive: true,
      })
      .returning();

    await this.logAudit(
      requesterId,
      'STAFF_CREATED',
      'admin_users',
      {
        createdStaffId: created.id,
        createdStaffEmail: created.email,
        role: created.role,
      },
      clientIp,
      userAgent,
    );

    return {
      id: created.id,
      email: created.email,
      fullName: created.fullName,
      role: created.role,
      avatarUrl: created.avatarUrl || null,
      isActive: created.isActive,
      isTwoFactorEnabled: created.isTwoFactorEnabled,
      lastLoginAt: created.lastLoginAt,
      lastLoginIp: created.lastLoginIp || null,
      createdAt: created.createdAt,
    };
  }

  // 3. Update staff role
  async updateStaffRole(
    id: string,
    dto: UpdateStaffRoleDto,
    requesterId: string,
    clientIp?: string,
    userAgent?: string,
  ) {
    const staff = await this.db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.id, id),
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    await this.db
      .update(schema.adminUsers)
      .set({
        role: dto.role,
        updatedAt: new Date(),
      })
      .where(eq(schema.adminUsers.id, id));

    await this.logAudit(
      requesterId,
      'STAFF_ROLE_UPDATED',
      'admin_users',
      {
        targetStaffId: id,
        previousRole: staff.role,
        newRole: dto.role,
      },
      clientIp,
      userAgent,
    );

    return {
      success: true,
      message: 'Staff role updated successfully!',
    };
  }

  // 4. Update staff status (Active / Suspended)
  async updateStaffStatus(
    id: string,
    dto: UpdateStaffStatusDto,
    requesterId: string,
    clientIp?: string,
    userAgent?: string,
  ) {
    if (!dto.isActive && (requesterId === id)) {
      throw new BadRequestException('Cannot suspend your own administrator account');
    }

    const staff = await this.db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.id, id),
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    await this.db
      .update(schema.adminUsers)
      .set({
        isActive: dto.isActive,
        updatedAt: new Date(),
      })
      .where(eq(schema.adminUsers.id, id));

    // If suspended, immediately revoke all active sessions
    if (!dto.isActive) {
      await this.db
        .update(schema.adminSessions)
        .set({ isRevoked: true })
        .where(eq(schema.adminSessions.adminId, id));
    }

    await this.logAudit(
      requesterId,
      'STAFF_STATUS_UPDATED',
      'admin_users',
      {
        targetStaffId: id,
        isActive: dto.isActive,
      },
      clientIp,
      userAgent,
    );

    return {
      success: true,
      message: 'Staff status updated successfully!',
    };
  }

  // 5. Reset staff password
  async resetStaffPassword(
    id: string,
    dto: ResetStaffPasswordDto,
    requesterId: string,
    clientIp?: string,
    userAgent?: string,
  ) {
    const staff = await this.db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.id, id),
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.db
      .update(schema.adminUsers)
      .set({
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.adminUsers.id, id));

    // Revoke existing sessions so staff must log in with the new password
    await this.db
      .update(schema.adminSessions)
      .set({ isRevoked: true })
      .where(eq(schema.adminSessions.adminId, id));

    await this.logAudit(
      requesterId,
      'STAFF_PASSWORD_RESET',
      'admin_users',
      {
        targetStaffId: id,
      },
      clientIp,
      userAgent,
    );

    return {
      success: true,
      message: 'Password reset successfully!',
    };
  }

  // 6. Delete staff member
  async deleteStaff(
    id: string,
    requesterId: string,
    clientIp?: string,
    userAgent?: string,
  ) {
    if (requesterId === id) {
      throw new BadRequestException('Cannot delete your own administrator account');
    }

    const staff = await this.db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.id, id),
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    // Automatic Cloudflare R2 Asset Cleanup (Staff Avatar Deletion)
    if (staff.avatarUrl) {
      const client = this.getS3Client();
      const bucket = this.getBucketName();
      if (client && bucket) {
        const deleted = await deleteR2Asset(client, bucket, staff.avatarUrl);
        if (deleted) {
          await this.logAudit(
            requesterId,
            'R2_AVATAR_CLEANUP',
            'storage',
            { purgedKeyOrUrl: staff.avatarUrl, targetStaffId: id },
            clientIp,
            userAgent,
          );
        }
      }
    }

    // Delete staff member (cascades sessions)
    await this.db
      .delete(schema.adminUsers)
      .where(eq(schema.adminUsers.id, id));

    await this.logAudit(
      requesterId,
      'STAFF_DELETED',
      'admin_users',
      {
        deletedStaffId: id,
        deletedStaffEmail: staff.email,
        role: staff.role,
      },
      clientIp,
      userAgent,
    );

    return {
      success: true,
      message: 'Staff member and associated assets deleted successfully.',
    };
  }
}
