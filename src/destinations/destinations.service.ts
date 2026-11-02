import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc, inArray, and } from 'drizzle-orm';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { DestinationResponseDto } from './dto/destination-response.dto';
import { DestinationPreviewResponseDto } from './dto/destination-preview-response.dto';
import { DestinationMapResponseDto } from './dto/destination-map-response.dto';
import { DestinationPackageResponseDto } from './dto/destination-package-response.dto';

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

  // Helper method: Map database row -> DestinationResponseDto with language fallback
  private mapToDestinationResponseDto(
    dest: typeof schema.destinations.$inferSelect,
    lang: string = 'en',
  ): DestinationResponseDto {
    // Determine the best language to serve (requested -> fallback to 'en' -> first available key)
    const targetLang =
      dest.title && dest.title[lang]
        ? lang
        : (dest.title && dest.title['en']
          ? 'en'
          : (dest.title ? Object.keys(dest.title)[0] || 'en' : 'en'));

    return {
      id: dest.id,
      slug: dest.slug,
      title: dest.title?.[targetLang] || '',
      summary: dest.summary?.[targetLang] || '',
      description: dest.description?.[targetLang] || '',
      province: dest.province?.[targetLang] || '',
      bestTimeToVisit: dest.bestTimeToVisit?.[targetLang] || '',
      climate: dest.climate?.[targetLang] || '',
      primaryLanguage: dest.primaryLanguage?.[targetLang] || '',
      localCurrency: dest.localCurrency?.[targetLang] || '',
      highlights: dest.highlights?.[targetLang] || [],
      images: dest.images || [],
      coordinates: dest.coordinates,
      language: targetLang,
      createdAt: dest.createdAt,
      updatedAt: dest.updatedAt,
    };
  }

  // Helper method: Map database row -> DestinationPreviewResponseDto with language fallback
  private mapToDestinationPreviewResponseDto(
    dest: typeof schema.destinations.$inferSelect,
    lang: string = 'en',
  ): DestinationPreviewResponseDto {
    // Determine the best language to serve (requested -> fallback to 'en' -> first available key)
    const targetLang =
      dest.title && dest.title[lang]
        ? lang
        : (dest.title && dest.title['en']
          ? 'en'
          : (dest.title ? Object.keys(dest.title)[0] || 'en' : 'en'));

    return {
      id: dest.id,
      slug: dest.slug,
      title: dest.title?.[targetLang] || '',
      summary: dest.summary?.[targetLang] || '',
      province: dest.province?.[targetLang] || '',
      bestTimeToVisit: dest.bestTimeToVisit?.[targetLang] || '',
      climate: dest.climate?.[targetLang] || '',
      language: targetLang, // Tells the frontend which language version was served
      heroImage: dest.images && dest.images.length > 0 ? dest.images[0] : null,
    };
  }

  // Helper method: Map database row -> DestinationMapResponseDto with language fallback
  private mapToDestinationMapResponseDto(
    dest: typeof schema.destinations.$inferSelect,
    lang: string = 'en',
  ): DestinationMapResponseDto {
    // Determine the best language to serve (requested -> fallback to 'en' -> first available key)
    const targetLang =
      dest.title && dest.title[lang]
        ? lang
        : (dest.title && dest.title['en']
          ? 'en'
          : (dest.title ? Object.keys(dest.title)[0] || 'en' : 'en'));

    return {
      id: dest.id,
      slug: dest.slug,
      title: dest.title?.[targetLang] || '',
      summary: dest.summary?.[targetLang] || '',
      coordinates: dest.coordinates,
      language: targetLang, // Optional, but great to include for consistency if your map DTO supports it
      heroImage: dest.images && dest.images.length > 0 ? dest.images[0] : null,
    };
  }

  // 1. Create Destination
  async create(dto: CreateDestinationDto): Promise<DestinationResponseDto> {
    // Generate slug from English title, first available language title, or fallback timestamp
    const titleForSlug =
      typeof dto.title === 'string'
        ? dto.title
        : dto.title?.['en'] || (dto.title ? Object.values(dto.title)[0] : '');

    const slug =
      dto.slug?.trim() ||
      (titleForSlug ? this.slugify(titleForSlug) : `destination-${Date.now()}`);

    const [newDest] = await this.db
      .insert(schema.destinations)
      .values({
        title: dto.title,
        slug: slug,
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

    return this.mapToDestinationResponseDto(newDest, 'en');
  }

  // 2. Fetch small previews for card display on frontend
  async findPreviews(lang: string = 'en'): Promise<DestinationPreviewResponseDto[]> {
    const records = await this.db.query.destinations.findMany({
      orderBy: [desc(schema.destinations.createdAt)],
    });

    return records.map((d) => this.mapToDestinationPreviewResponseDto(d, lang));
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
  async findBySlug(slug: string, lang: string = 'en'): Promise<DestinationResponseDto> {
    const dest = await this.db.query.destinations.findFirst({
      where: eq(schema.destinations.slug, slug),
    });

    if (!dest) {
      throw new NotFoundException(
        `Destination with slug "${slug}" not found`
      );
    }

    return this.mapToDestinationResponseDto(dest, lang);
  }

  // 5. Delete destination by ID
  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.db.delete(schema.destinations).where(eq(schema.destinations.id, id));

    return { message: `Destination with ID "${id}" deleted successfully.` };
  }

  // 6. Fetch lightweight data specifically for map markers
  async findForMap(lang: string = 'en'): Promise<DestinationMapResponseDto[]> {
    const records = await this.db.query.destinations.findMany({
      orderBy: [desc(schema.destinations.createdAt)],
    });

    return records.map((d) => this.mapToDestinationMapResponseDto(d, lang));
  }

  // destination data that need by create package
  async findPackagePreviewsByIds(ids: string[]): Promise<DestinationPackageResponseDto[]> {
    if (!ids || ids.length === 0) return [];

    const destinations = await this.db.query.destinations.findMany({
      where: inArray(schema.destinations.id, ids),
      columns: {
        id: true,
        slug: true,
      },
    });

    return destinations.map((dest) => ({
      id: dest.id,
      slug: dest.slug,
    }));
  }
}