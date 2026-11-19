import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminStaffService } from './admin-staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffRoleDto } from './dto/update-staff-role.dto';
import { UpdateStaffStatusDto } from './dto/update-staff-status.dto';
import { ResetStaffPasswordDto } from './dto/reset-staff-password.dto';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { RolesGuard } from '../admin-auth/roles.guard';
import { Roles } from '../admin-auth/roles.decorator';
import { AdminRole } from '../admin-auth/roles.enum';

@Controller('admin/staff')
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN)
export class AdminStaffController {
  constructor(private readonly staffService: AdminStaffService) {}

  // 1. GET /api/admin/staff
  @Get()
  async getAllStaff() {
    return await this.staffService.getAllStaff();
  }

  // 2. POST /api/admin/staff
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createStaff(
    @Body() dto: CreateStaffDto,
    @Req() req: Request & { user: { id?: string; sub?: string } },
  ) {
    const requesterId = req.user.id || req.user.sub!;
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return await this.staffService.createStaff(
      dto,
      requesterId,
      clientIp,
      userAgent,
    );
  }

  // 3. PATCH /api/admin/staff/:id/role
  @Patch(':id/role')
  async updateStaffRole(
    @Param('id') id: string,
    @Body() dto: UpdateStaffRoleDto,
    @Req() req: Request & { user: { id?: string; sub?: string } },
  ) {
    const requesterId = req.user.id || req.user.sub!;
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return await this.staffService.updateStaffRole(
      id,
      dto,
      requesterId,
      clientIp,
      userAgent,
    );
  }

  // 4. PATCH /api/admin/staff/:id/status
  @Patch(':id/status')
  async updateStaffStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStaffStatusDto,
    @Req() req: Request & { user: { id?: string; sub?: string } },
  ) {
    const requesterId = req.user.id || req.user.sub!;
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return await this.staffService.updateStaffStatus(
      id,
      dto,
      requesterId,
      clientIp,
      userAgent,
    );
  }

  // 5. PATCH /api/admin/staff/:id/reset-password
  @Patch(':id/reset-password')
  async resetStaffPassword(
    @Param('id') id: string,
    @Body() dto: ResetStaffPasswordDto,
    @Req() req: Request & { user: { id?: string; sub?: string } },
  ) {
    const requesterId = req.user.id || req.user.sub!;
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return await this.staffService.resetStaffPassword(
      id,
      dto,
      requesterId,
      clientIp,
      userAgent,
    );
  }

  // 6. DELETE /api/admin/staff/:id
  @Delete(':id')
  async deleteStaff(
    @Param('id') id: string,
    @Req() req: Request & { user: { id?: string; sub?: string } },
  ) {
    const requesterId = req.user.id || req.user.sub!;
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return await this.staffService.deleteStaff(
      id,
      requesterId,
      clientIp,
      userAgent,
    );
  }
}
