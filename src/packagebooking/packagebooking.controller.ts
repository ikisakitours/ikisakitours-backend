import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { PackageBookingService } from './packagebooking.service';
import { CreatePackageBookingDto } from './dto/create-package-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { AdminApiKeyGuard } from '../users/admin-api-key.guard';

@Controller('package-bookings')
export class PackageBookingController {
  constructor(private readonly packageBookingService: PackageBookingService) {}

  //User submits a booking
  @Post()
  async create(@Body() createPackageBookingDto: CreatePackageBookingDto) {
    return await this.packageBookingService.create(createPackageBookingDto);
  }

  //Get all bookings
  @Get()
  async findAll() {
    return await this.packageBookingService.findAll();
  }

  //Update booking status (pending, confirmed, cancelled, completed)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
  ) {
    return await this.packageBookingService.updateStatus(id, updateBookingStatusDto);
  }

  //Delete a booking
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.packageBookingService.remove(id);
  }
}