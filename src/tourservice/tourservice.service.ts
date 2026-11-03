import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { CreateCustomServiceDto } from './dto/create-custom-service.dto';
import { CreateChauffeurServiceDto } from './dto/create-chauffeur-service.dto';
import { CreateTransferServiceDto } from './dto/create-transfer-service.dto';
import { UpdateServiceNotesDto } from './dto/service-notes/update-service-notes.dto';
import { CreateServiceNotesDto } from './dto/service-notes/create-service-notes.dto';

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

  // 4. Fetch Requests by Category
  async findAllByCategory(category: 'custom-made' | 'private-chauffeur' | 'transfer') {
    const records = await this.db
      .select()
      .from(schema.serviceRequests)
      .where(eq(schema.serviceRequests.serviceCategory, category))
      .orderBy(desc(schema.serviceRequests.createdAt));

    return records;
  }

  // 5 update status
  async updateServiceStatus(id: string, status: string) {
    const [updatedService] = await this.db
      .update(schema.serviceRequests)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(schema.serviceRequests.id, id))
      .returning();

    if (!updatedService) {
      throw new NotFoundException(`Service request with ID ${id} not found`);
    }

    return updatedService;
  }

  // --- SERVICE NOTES METHODS ---

  // 6. Create Service Note
  async createServiceNote(dto: CreateServiceNotesDto) {
    const [record] = await this.db
      .insert(schema.serviceNotes)
      .values({
        serviceType: dto.serviceType,
        vehicleType: dto.vehicleType,
        startingPrice: dto.startingPrice,
        vehicleCapacity: dto.vehicleCapacity,
        luggages: dto.luggages,
        driverOption: dto.driverOption,
        notes: dto.notes,
        updatedAt: new Date(),
      })
      .returning();

    return { message: 'Service note created successfully', data: record };
  }

  // 7. Find All Service Notes (Optional query filtering by serviceType can be done here or in controller)
  async findAllServiceNotes(serviceType?: string) {
    if (serviceType) {
      return await this.db
        .select()
        .from(schema.serviceNotes)
        .where(eq(schema.serviceNotes.serviceType, serviceType))
        .orderBy(desc(schema.serviceNotes.createdAt));
    }

    return await this.db
      .select()
      .from(schema.serviceNotes)
      .orderBy(desc(schema.serviceNotes.createdAt));
  }

  // 8. Update Service Note
  async updateServiceNote(id: string | number, dto: UpdateServiceNotesDto) {
    // Handle numeric or uuid string ID depending on your schema setup (serial id is typically number, but casting or handling appropriately)
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

    const [updatedRecord] = await this.db
      .update(schema.serviceNotes)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(schema.serviceNotes.id, numericId))
      .returning();

    if (!updatedRecord) {
      throw new NotFoundException(`Service note with ID ${id} not found`);
    }

    return { message: 'Service note updated successfully', data: updatedRecord };
  }
}