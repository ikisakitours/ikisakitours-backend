import { Injectable, Inject } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { CreateCustomServiceDto } from './dto/create-custom-service.dto';
import { CreateChauffeurServiceDto } from './dto/create-chauffeur-service.dto';
import { CreateTransferServiceDto } from './dto/create-transfer-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) { }

  // 1. Create Custom Made Service Request
  async createCustomService(dto: CreateCustomServiceDto) {
    const [record] = await this.db
      .insert(schema.serviceRequests)
      .values({
        serviceCategory: 'custom-made',
        vehicleType: dto.vehicleType,
        tourPackageType: dto.tourPackageType,
        pickupLocation: dto.pickupLocation,
        language: dto.language,
        journeyDate: dto.journeyDate,
        pickupTime: dto.pickupTime,
        travelers: dto.travelers,
        tourDuration: dto.tourDuration,
        description: dto.description,
        fullName: dto.fullName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        specialRequests: dto.specialRequests,
        status: 'pending',
      })
      .returning();

    return { message: 'Custom service request submitted successfully', data: record };
  }

  // 2. Create Private Chauffeur Service Request
  async createChauffeurService(dto: CreateChauffeurServiceDto) {
    const [record] = await this.db
      .insert(schema.serviceRequests)
      .values({
        serviceCategory: 'private-chauffeur',
        vehicleType: dto.vehicleType,
        tourPackageType: dto.tourPackageType,
        pickupLocation: dto.pickupLocation,
        language: dto.language,
        journeyDate: dto.journeyDate,
        pickupTime: dto.pickupTime,
        travelers: dto.travelers,
        tourDuration: dto.tourDuration,
        description: dto.description,
        fullName: dto.fullName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        specialRequests: dto.specialRequests,
        status: 'pending',
      })
      .returning();

    return { message: 'Private chauffeur request submitted successfully', data: record };
  }

  // 3. Create Transfer Service Request
  async createTransferService(dto: CreateTransferServiceDto) {
    const [record] = await this.db
      .insert(schema.serviceRequests)
      .values({
        serviceCategory: 'transfer',
        transferServiceType: dto.serviceType,
        vehicleType: dto.vehicleType,
        pickupLocation: dto.pickupLocation,
        dropOffLocation: dto.dropOffLocation,
        language: dto.language,
        journeyDate: dto.journeyDate,
        pickupTime: dto.pickupTime,
        travelers: dto.travelers,
        fullName: dto.fullName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        specialRequests: dto.specialRequests,
        status: 'pending',
      })
      .returning();

    return { message: 'Transfer request submitted successfully', data: record };
  }

  // 4. Fetch Requests by Category (for Admin Panel cards display)
  async findAllByCategory(category: 'custom-made' | 'private-chauffeur' | 'transfer') {
    const records = await this.db
      .select()
      .from(schema.serviceRequests)
      .where(eq(schema.serviceRequests.serviceCategory, category))
      .orderBy(desc(schema.serviceRequests.createdAt));

    return records;
  }
}