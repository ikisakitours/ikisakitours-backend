import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc, count, sql, and, inArray } from 'drizzle-orm';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { AddPackageResponseDto } from './dto/addpackage-response.dto'; import { CreateAddPackageDto } from './dto/create-addpackage.dto';
import { PackageResponseDto, PackageType } from './dto/PackageResponse.dto';
import { UploadsService } from '../uploads/uploads.service';
import { PackageSummaryResponseDto } from './dto/package-summary-response.dto';
import { PackageListItemDto } from './dto/package-list-item.dto';

@Injectable()
export class AddpackagesService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly uploadsService: UploadsService,
  ) { }

  // --- POST /addpackages -> Returns AddPackageResponseDto ---
  async create(
    dto: CreateAddPackageDto,
    images: Express.Multer.File[],
  ): Promise<AddPackageResponseDto> {
    // 1. Upload all images first, get back the array of URLs
    const gallery = await this.uploadsService.uploadMultiple(images, 'package-images');

    // 2. Ensure JSONB destinations are plain JavaScript objects (stripping class prototypes)
    const plainDestinations = JSON.parse(JSON.stringify(dto.destinations));

    // 3. Insert into database
    const [newPackage] = await this.db
      .insert(schema.packages)
      .values({
        type: dto.type,
        category: dto.category,
        origin: dto.origin,
        duration: dto.duration,
        badge: dto.badge,
        slug: dto.slug,
        titleEmphasis: dto.titleEmphasis,
        title: dto.title,
        price: dto.price.toString(),
        discount: dto.discount !== undefined ? dto.discount.toString() : '0',
        provider: dto.provider,
        leadTitle: dto.leadTitle,
        leadDescription: dto.leadDescription,
        gallery: gallery,
        activityDetails: JSON.parse(JSON.stringify(dto.activityDetails)),
        highlights: dto.highlights,
        description: dto.description,
        itinerary: JSON.parse(JSON.stringify(dto.itinerary)),
        destinations: plainDestinations,
        includes: dto.includes,
        excludes: dto.excludes,
        likes: 0,
      })
      .returning();

    // 4. Return matching the AddPackageResponseDto structure
    return {
      ...dto,
      gallery: gallery,
      destinations: plainDestinations,
      id: newPackage.id,
      likes: newPackage.likes,
      createdAt: newPackage.createdAt,
      updatedAt: newPackage.updatedAt,
    };
  }

  // --- GET /addpackages -> Returns minimal admin list (id, slug, title) ---
  async findAll(): Promise<PackageListItemDto[]> {
    const records = await this.db
      .select({
        id: schema.packages.id,
        slug: schema.packages.slug,
        title: schema.packages.title,
      })
      .from(schema.packages)
      .orderBy(desc(schema.packages.createdAt));

    return records;
  }

  // --- GET /addpackages/:slug -> Returns PackageResponseDto ---
  async findOne(slug: string): Promise<PackageResponseDto> {
    const pkg = await this.db.query.packages.findFirst({
      where: eq(schema.packages.slug, slug),
    });

    if (!pkg) {
      throw new NotFoundException(`Package with slug "${slug}" not found`);
    }

    return this.mapToPackageResponseDto(pkg);
  }

  // --- PATCH /addpackages/:slug -> Update package without re-uploading images ---
  async updateTextOnly(
    slug: string,
    dto: Partial<CreateAddPackageDto>,
  ): Promise<PackageResponseDto> {
    const existing = await this.findOne(slug);

    const [updatedPkg] = await this.db
      .update(schema.packages)
      .set({
        type: dto.type ?? (existing.type as any),
        category: dto.category ?? existing.category,
        origin: dto.origin ?? existing.origin,
        duration: dto.duration ?? existing.duration,
        badge: dto.badge ?? existing.badge,
        slug: dto.slug ?? existing.slug,
        titleEmphasis: dto.titleEmphasis ?? existing.titleEmphasis,
        title: dto.title ?? existing.title,
        price: dto.price !== undefined ? dto.price.toString() : existing.price.toString(),
        discount: dto.discount !== undefined ? dto.discount.toString() : (existing.discount ?? 0).toString(),
        provider: dto.provider ?? existing.provider,
        leadTitle: dto.leadTitle ?? existing.leadTitle,
        leadDescription: dto.leadDescription ?? existing.leadDescription,
        description: dto.description ?? existing.description,
        activityDetails: dto.activityDetails ? JSON.parse(JSON.stringify(dto.activityDetails)) : existing.activityDetails,
        highlights: dto.highlights ?? existing.highlights,
        itinerary: dto.itinerary ? JSON.parse(JSON.stringify(dto.itinerary)) : existing.itinerary,
        destinations: dto.destinations ? JSON.parse(JSON.stringify(dto.destinations)) : existing.destinations,
        includes: dto.includes ?? existing.includes,
        excludes: dto.excludes ?? existing.excludes,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.slug, slug))
      .returning();

    return this.mapToPackageResponseDto(updatedPkg);
  }

  // --- DELETE /addpackages/:slug -> Delete package by slug ---
  async remove(slug: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.findOne(slug);

    await this.db
      .delete(schema.packages)
      .where(eq(schema.packages.slug, slug));

    return {
      success: true,
      message: `Package "${existing.title}" (${slug}) was successfully deleted.`,
    };
  }

  async findSummariesPaginated(
    page: number = 1,
    limit: number = 5,
    packageType: string,
  ): Promise<{ data: PackageSummaryResponseDto[]; totalCount: number; hasMore: boolean }> {
    const offset = (page - 1) * limit;

    // 1. Fetch total count of packages for this specific type
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(schema.packages)
      .where(eq(schema.packages.type, packageType));

    const totalCount = Number(total);

    // 2. Fetch paginated summary records using the Core Select API
    const records = await this.db
      .select()
      .from(schema.packages)
      .where(eq(schema.packages.type, packageType))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(schema.packages.createdAt));

    const packageIds = records.map((p) => p.id);

    // 3. Fetch average ratings for the current page package IDs
    const ratingsMap = new Map<string, number>();
    if (packageIds.length > 0) {
      const ratingResults = await this.db
        .select({
          packageId: schema.packageReviews.packageId,
          avgRating: sql<number>`avg(${schema.packageReviews.rating})`,
        })
        .from(schema.packageReviews)
        .where(inArray(schema.packageReviews.packageId, packageIds))
        .groupBy(schema.packageReviews.packageId);

      for (const row of ratingResults) {
        ratingsMap.set(row.packageId, Number(row.avgRating) || 0);
      }
    }

    // 4. Map records to the summary DTO, including averageRating (rounded to 1 decimal place)
    const data: PackageSummaryResponseDto[] = records.map((pkg: any) => {
      const galleryArray = (pkg.gallery as string[]) || [];
      const heroImage = galleryArray.length > 0 ? galleryArray[0] : null;
      const rawRating = ratingsMap.get(pkg.id) || 0;

      return {
        id: pkg.id,
        title: pkg.title,
        origin: pkg.origin,
        price: Number(pkg.price),
        slug: pkg.slug,
        discount: pkg.discount,
        badge: pkg.badge,
        description: pkg.description,
        heroImage: heroImage,
        category: pkg.category,
        duration: pkg.duration,
        likes: pkg.likes ?? 0,
        averageRating: Number(rawRating.toFixed(1)),
      };
    });

    return {
      data,
      totalCount,
      hasMore: offset + data.length < totalCount,
    };
  }


  //like button
  async toggleLike(packageId: string, userId: string) {
    return await this.db.transaction(async (tx) => {
      const existingLike = await tx.query.packageLikes.findFirst({
        where: and(
          eq(schema.packageLikes.packageId, packageId),
          eq(schema.packageLikes.userId, userId),
        ),
      });

      if (existingLike) {
        // --- UNLIKE: Remove the record and decrement likes count ---
        await tx.delete(schema.packageLikes).where(eq(schema.packageLikes.id, existingLike.id));

        await tx.update(schema.packages)
          .set({ likes: sql`${schema.packages.likes} - 1` }) // FIXED: added missing minus sign
          .where(eq(schema.packages.id, packageId));

        return { liked: false, message: 'Package unliked successfully' };
      } else {
        // --- LIKE: Insert the record and increment likes count ---
        await tx.insert(schema.packageLikes).values({
          packageId,
          userId,
        });

        await tx.update(schema.packages)
          .set({ likes: sql`${schema.packages.likes} + 1` })
          .where(eq(schema.packages.id, packageId));

        return { liked: true, message: 'Package liked successfully' };
      }
    });
  }

  // Helper method for GET requests mapping database values to PackageResponseDto
  private mapToPackageResponseDto(pkg: any): PackageResponseDto {
    return {
      id: pkg.id,
      slug: pkg.slug,
      type: pkg.type as PackageType,
      category: pkg.category,
      origin: pkg.origin,
      duration: pkg.duration,
      badge: pkg.badge || undefined,
      titleEmphasis: pkg.titleEmphasis,
      title: pkg.title,
      price: Number(pkg.price),
      discount: pkg.discount ? Number(pkg.discount) : 0,
      provider: pkg.provider,
      leadTitle: pkg.leadTitle,
      leadDescription: pkg.leadDescription,
      description: pkg.description,
      gallery: pkg.gallery || [],
      highlights: pkg.highlights || [],
      includes: pkg.includes || [],
      excludes: pkg.excludes || [],
      activityDetails: pkg.activityDetails || [],
      itinerary: pkg.itinerary || [],
      destinations: pkg.destinations || [],
      likes: pkg.likes ?? 0,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
    };
  }
}