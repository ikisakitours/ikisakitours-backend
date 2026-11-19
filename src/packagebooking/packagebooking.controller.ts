import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PackageBookingService } from './packagebooking.service';
import { CreatePackageBookingDto } from './dto/create-package-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { RolesGuard } from '../admin-auth/roles.guard';
import { Roles } from '../admin-auth/roles.decorator';
import { AdminRole } from '../admin-auth/roles.enum';

@Controller(['package-bookings', 'bookings'])
export class PackageBookingController {
  constructor(private readonly packageBookingService: PackageBookingService) {}

  //User submits a booking (Public)
  @Post()
  async create(@Body() createPackageBookingDto: CreatePackageBookingDto) {
    return await this.packageBookingService.create(createPackageBookingDto);
  }

  //Get all bookings (Admin)
  @Get()
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_MANAGER,
    AdminRole.BOOKING_AGENT,
  )
  async findAll() {
    return await this.packageBookingService.findAll();
  }

  //Get single booking by ID (Admin)
  @Get(':id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_MANAGER,
    AdminRole.BOOKING_AGENT,
  )
  async findOne(@Param('id') id: string) {
    return await this.packageBookingService.findOne(id);
  }

  //Update booking status (pending, confirmed, cancelled, completed) (Admin)
  @Patch(':id/status')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_MANAGER,
    AdminRole.BOOKING_AGENT,
  )
  async updateStatus(
    @Param('id') id: string,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
  ) {
    return await this.packageBookingService.updateStatus(
      id,
      updateBookingStatusDto,
    );
  }

  //Delete a booking (Admin)
  @Delete(':id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_MANAGER,
    AdminRole.BOOKING_AGENT,
  )
  async remove(@Param('id') id: string) {
    return await this.packageBookingService.remove(id);
  }
}
