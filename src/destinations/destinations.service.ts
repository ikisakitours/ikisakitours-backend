import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { DestinationResponseDto } from './dto/destination-response.dto';
import { DestinationPreviewResponseDto } from './dto/destination-preview-response.dto';
import { DestinationMapResponseDto } from './dto/destination-map-response.dto';

@Injectable()
export class DestinationsService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) { }

  // Helper method: Generate URL-friendly slug from text
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Helper method: Map database row -> DestinationResponseDto
  private mapToDestinationResponseDto(
    dest: typeof schema.destinations.$inferSelect,
  ): DestinationResponseDto {
    return {
      id: dest.id,
      title: dest.title,
      slug: dest.slug,
      summary: dest.summary,
      description: dest.description,
      province: dest.province,
      highlights: dest.highlights,
      images: dest.images || [],
      bestTimeToVisit: dest.bestTimeToVisit,
      climate: dest.climate,
      primaryLanguage: dest.primaryLanguage,
      localCurrency: dest.localCurrency,
      coordinates: dest.coordinates,
      createdAt: dest.createdAt,
      updatedAt: dest.updatedAt,
    };
  }

  // Helper method: Map database row -> DestinationPreviewResponseDto
  private mapToDestinationPreviewResponseDto(
    dest: typeof schema.destinations.$inferSelect,
  ): DestinationPreviewResponseDto {
    return {
      id: dest.id,
      title: dest.title,
      slug: dest.slug,
      summary: dest.summary,
      province: dest.province,
      heroImage: dest.images && dest.images.length > 0 ? dest.images[0] : null,
      bestTimeToVisit: dest.bestTimeToVisit,
      climate: dest.climate,
    };
  }

  // Helper method: Map database row -> DestinationMapResponseDto
  private mapToDestinationMapResponseDto(
    dest: typeof schema.destinations.$inferSelect,
  ): DestinationMapResponseDto {
    return {
      id: dest.id,
      title: dest.title,
      slug: dest.slug,
      coordinates: dest.coordinates,
      heroImage: dest.images && dest.images.length > 0 ? dest.images[0] : null,
    };
  }

  // 1. Create Destination
  async create(dto: CreateDestinationDto): Promise<DestinationResponseDto> {
    const generatedSlug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.title);

    const [newDest] = await this.db
      .insert(schema.destinations)
      .values({
        title: dto.title,
        slug: generatedSlug,
        summary: dto.summary,
        description: dto.description,
        province: dto.province,
        highlights: dto.highlights,
        images: dto.images ?? [],
        bestTimeToVisit: dto.bestTimeToVisit,
        climate: dto.climate,
        primaryLanguage: dto.primaryLanguage,
        localCurrency: dto.localCurrency,
        coordinates: dto.coordinates,
      })
      .returning();

    return this.mapToDestinationResponseDto(newDest);
  }

  // 2. Fetch small previews for card display on frontend
  async findPreviews(): Promise<DestinationPreviewResponseDto[]> {
    const records = await this.db.query.destinations.findMany({
      orderBy: [desc(schema.destinations.createdAt)],
    });

    return records.map((d) => this.mapToDestinationPreviewResponseDto(d));
  }

  // 3. Fetch single destination by ID
  async findOne(id: string): Promise<DestinationResponseDto> {
    const dest = await this.db.query.destinations.findFirst({
      where: eq(schema.destinations.id, id),
    });

    if (!dest) {
      throw new NotFoundException(`Destination with ID "${id}" not found`);
    }

    return this.mapToDestinationResponseDto(dest);
  }

  // 4. Fetch single destination by Slug (for public frontend view)
  async findBySlug(slug: string): Promise<DestinationResponseDto> {
    const dest = await this.db.query.destinations.findFirst({
      where: eq(schema.destinations.slug, slug),
    });

    if (!dest) {
      throw new NotFoundException(`Destination with slug "${slug}" not found`);
    }

    return this.mapToDestinationResponseDto(dest);
  }

  // 5. Delete destination by ID
  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.db.delete(schema.destinations).where(eq(schema.destinations.id, id));

    return { message: `Destination with ID "${id}" deleted successfully.` };
  }

  // 6. Fetch lightweight data specifically for map markers
  async findForMap(): Promise<DestinationMapResponseDto[]> {
    const records = await this.db.query.destinations.findMany({
      orderBy: [desc(schema.destinations.createdAt)],
    });

    return records.map((d) => this.mapToDestinationMapResponseDto(d));
  }
}