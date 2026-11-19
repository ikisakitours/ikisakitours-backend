import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { CreatePackageBookingDto } from './dto/create-package-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { calculateDynamicPricing } from './pricingUtils';

@Injectable()
export class PackageBookingService {
  private readonly logger = new Logger(PackageBookingService.name);

  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(createDto: CreatePackageBookingDto) {
    // Zero-Trust Suspension Check: If the booking is made by or on behalf of a registered user who is suspended, reject it.
    // Public guest bookings (where user is null or email does not belong to a suspended account) remain 100% functional.
    if (createDto.userId || createDto.email) {
      const user = await this.db.query.users.findFirst({
        where: createDto.userId
          ? eq(schema.users.id, createDto.userId)
          : eq(schema.users.email, createDto.email.toLowerCase().trim()),
        columns: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          hasAccess: true,
        },
      });

      if (user && !user.hasAccess) {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'ACCOUNT_SUSPENDED',
          message: 'Your account access has been restricted by administration.',
          user: {
            id: user.id,
            email: user.email,
            firstname: user.firstName,
            lastname: user.lastName,
            hasAccess: false,
          },
        });
      }
    }

    // 1. Generate unique human-readable booking reference (e.g., IK-2611-X4D9)
    const bookingReference =
      'IK-' +
      Date.now().toString().slice(-4) +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    // 2. Server-side price recalculation & anti-tampering verification using DB values
    let verifiedAmount: number | null = null;
    let isPriceTampered = false;

    try {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          createDto.packageId,
        );

      let pkg: any = null;
      if (isUuid) {
        pkg = await this.db.query.packages.findFirst({
          where: eq(schema.packages.id, createDto.packageId),
        });
      }

      if (!pkg && createDto.packageSlug) {
        pkg = await this.db.query.packages.findFirst({
          where: eq(schema.packages.slug, createDto.packageSlug),
        });
      }

      if (pkg) {
        verifiedAmount = this.calculateVerifiedPrice(pkg, createDto);

        if (
          createDto.totalAmount !== undefined &&
          createDto.totalAmount !== null
        ) {
          const clientTotal = Number(createDto.totalAmount);
          const diff = Math.abs(clientTotal - verifiedAmount);
          // Allow small tolerance ($2) for exchange rates or rounding
          if (diff > 2.0) {
            isPriceTampered = true;
            this.logger.warn(
              `[PackageBooking] Potential price tampering detected on booking for package "${pkg.slug || pkg.id}". Client sent: ${clientTotal}, Server verified: ${verifiedAmount}`,
            );
          }
        }
      }
    } catch (err: any) {
      this.logger.error(
        'Error during price verification calculation:',
        err?.message || err,
      );
    }

    // 3. Resolve package name safely (string or multilingual dictionary)
    const resolvedPackageName =
      typeof createDto.packageName === 'object'
        ? createDto.packageName['en'] ||
          Object.values(createDto.packageName)[0] ||
          JSON.stringify(createDto.packageName)
        : String(createDto.packageName);

    // 4. Calculate totalPax if not provided (1 couple = 2 travelers)
    const totalPax =
      createDto.totalPax ??
      (createDto.travelers.adults || 0) +
        (createDto.travelers.couples || 0) * 2 +
        (createDto.travelers.children || 0) +
        (createDto.travelers.infants || 0);

    // 5. Insert booking with full audit & payment-readiness fields
    const [newBooking] = await this.db
      .insert(schema.packageBookings)
      .values({
        bookingReference,
        packageId: createDto.packageId,
        packageSlug: createDto.packageSlug || null,
        packageName: resolvedPackageName,
        packageType: createDto.packageType || createDto.type,
        type: createDto.type,
        journeyDate: createDto.journeyDate,
        travelers: createDto.travelers,
        totalPax,
        selectedOptions:
          (createDto.selectedOptions as schema.BookingSelectedOption[]) || [],
        basePrice: (createDto.basePrice ?? 0).toString(),
        optionsTotal: (createDto.optionsTotal ?? 0).toString(),
        totalAmount: (createDto.totalAmount ?? verifiedAmount ?? 0).toString(),
        currency: createDto.currency || 'USD',
        locale: createDto.locale || 'en',
        pricingSummary: createDto.pricingSummary || {},
        verifiedAmount:
          verifiedAmount !== null ? verifiedAmount.toString() : null,
        isPriceTampered,
        userId: createDto.userId || null,
        firstname: createDto.firstname,
        lastname: createDto.lastname,
        email: createDto.email,
        country: createDto.country,
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod: null,
        paymentTransactionId: null,
      })
      .returning();

    return newBooking;
  }

  // Authoritative server-side recalculation using exact frontend pricing algorithm
  private calculateVerifiedPrice(
    pkg: any,
    dto: CreatePackageBookingDto,
  ): number {
    const rawBasePrice = Number(pkg.price || 0);
    const travelerCounts: Record<string, number> = {
      adult: dto.travelers?.adults || 0,
      couple: dto.travelers?.couples || 0,
      child: dto.travelers?.children || 0,
      infant: dto.travelers?.infants || 0,
    };

    // 1. Calculate dynamic base tour pricing (Tiers, Couples, Children, Infants)
    const dynamicResult = calculateDynamicPricing(
      rawBasePrice,
      travelerCounts,
      pkg.pricingConfig,
    );

    // 2. Calculate selected add-ons using prices directly from DB package options
    let optionsTotal = 0;
    const dbOptions: schema.PackageOptionItem[] =
      pkg.pricingConfig?.options || [];
    const dbOptionsMap = new Map<string, schema.PackageOptionItem>(
      dbOptions.map((o) => [o.id, o]),
    );

    const adults = Number(dto.travelers?.adults || 0);
    const couples = Number(dto.travelers?.couples || 0);
    const children = Number(dto.travelers?.children || 0);
    const totalPayingPax = adults + couples * 2 + children;
    const totalRooms = couples + Math.ceil(adults / 2) || 1;

    for (const clientOpt of dto.selectedOptions || []) {
      // Skip if explicitly unselected or zero count
      const isExplicitlyUnselected =
        clientOpt.selected === false ||
        clientOpt.enabled === false ||
        clientOpt.count === 0 ||
        clientOpt.quantity === 0;

      if (isExplicitlyUnselected) {
        continue;
      }

      // Only include options that are genuinely selected
      const isSelected =
        clientOpt.selected === true ||
        (typeof clientOpt.count === 'number' && clientOpt.count > 0) ||
        (typeof clientOpt.quantity === 'number' && clientOpt.quantity > 0) ||
        (typeof clientOpt.total === 'number' && clientOpt.total > 0) ||
        (typeof clientOpt.subtotal === 'number' && clientOpt.subtotal > 0);

      if (!isSelected) {
        continue;
      }

      const dbOpt = dbOptionsMap.get(clientOpt.id);
      const optPrice = dbOpt
        ? Number(dbOpt.price)
        : Number(clientOpt.unitPrice ?? clientOpt.price ?? 0);
      const calcType = dbOpt
        ? dbOpt.calculationType
        : clientOpt.calculationType || 'per_person';

      let count = 1;
      if (typeof clientOpt.count === 'number' && clientOpt.count > 0) {
        count = clientOpt.count;
      } else if (
        typeof clientOpt.quantity === 'number' &&
        clientOpt.quantity > 0
      ) {
        count = clientOpt.quantity;
      } else if (calcType === 'per_person') {
        count = totalPayingPax;
      } else if (calcType === 'per_room') {
        count = totalRooms;
      }

      optionsTotal += optPrice * count;
    }

    return Math.round((dynamicResult.totalPrice + optionsTotal) * 100) / 100;
  }

  async findAll() {
    return await this.db.query.packageBookings.findMany({
      orderBy: (bookings, { desc }) => [desc(bookings.createdAt)],
    });
  }

  async findOne(id: string) {
    const booking = await this.db.query.packageBookings.findFirst({
      where: eq(schema.packageBookings.id, id),
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto) {
    await this.findOne(id);

    const updateData: Partial<typeof schema.packageBookings.$inferInsert> = {
      updatedAt: new Date().toISOString(),
    };

    if (dto.status) updateData.status = dto.status;
    if (dto.paymentStatus) updateData.paymentStatus = dto.paymentStatus;
    if (dto.paymentMethod !== undefined)
      updateData.paymentMethod = dto.paymentMethod;
    if (dto.paymentTransactionId !== undefined)
      updateData.paymentTransactionId = dto.paymentTransactionId;

    const [updatedBooking] = await this.db
      .update(schema.packageBookings)
      .set(updateData)
      .where(eq(schema.packageBookings.id, id))
      .returning();

    return updatedBooking;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.db
      .delete(schema.packageBookings)
      .where(eq(schema.packageBookings.id, id));

    return { message: 'Booking deleted successfully' };
  }
}
