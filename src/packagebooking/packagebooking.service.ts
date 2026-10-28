import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { CreatePackageBookingDto } from './dto/create-package-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Injectable()
export class PackageBookingService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(createDto: CreatePackageBookingDto) {
    const [newBooking] = await this.db
      .insert(schema.packageBookings)
      .values({
        packageId: createDto.packageId,
        packageName: createDto.packageName,
        journeyDate: createDto.journeyDate,
        travelers: createDto.travelers,
        firstname: createDto.firstname,
        lastname: createDto.lastname,
        email: createDto.email,
        country: createDto.country,
        type: createDto.type,
        status: 'pending',
      })
      .returning();

    return newBooking;
  }

  async findAll() {
    return await this.db.query.packageBookings.findMany({
      orderBy: (bookings, { desc }) => [desc(bookings.createdAt)],
    });
  }

  // NEW: Update status method for admin panel
  async updateStatus(id: string, dto: UpdateBookingStatusDto) {
    const existing = await this.db.query.packageBookings.findFirst({
      where: eq(schema.packageBookings.id, id),
    });

    if (!existing) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    const [updatedBooking] = await this.db
      .update(schema.packageBookings)
      .set({ status: dto.status })
      .where(eq(schema.packageBookings.id, id))
      .returning();

    return updatedBooking;
  }

  async remove(id: string) {
    const existing = await this.db.query.packageBookings.findFirst({
      where: eq(schema.packageBookings.id, id),
    });

    if (!existing) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    await this.db
      .delete(schema.packageBookings)
      .where(eq(schema.packageBookings.id, id));

    return { message: 'Booking deleted successfully' };
  }
}