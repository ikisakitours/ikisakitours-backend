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

    // 2. Ensure JSONB fields are plain JavaScript objects
    const plainDestinations = JSON.parse(JSON.stringify(dto.destinations));
    const plainActivityDetails = JSON.parse(JSON.stringify(dto.activityDetails));
    const plainItinerary = JSON.parse(JSON.stringify(dto.itinerary));

    // 3. Resolve the English and Japanese fields directly.
    // English is required (guaranteed by DTO validation).
    // Japanese is optional (nullish coalescing ensures undefined becomes null).
    const titleEn: string = dto.titleEn;
    const titleJa: string | null = dto.titleJa ?? null;

    const titleEmphasisEn: string = dto.titleEmphasisEn;
    const titleEmphasisJa: string | null = dto.titleEmphasisJa ?? null;

    const leadTitleEn: string = dto.leadTitleEn;
    const leadTitleJa: string | null = dto.leadTitleJa ?? null;

    const leadDescriptionEn: string = dto.leadDescriptionEn;
    const leadDescriptionJa: string | null = dto.leadDescriptionJa ?? null;

    const descriptionEn: string = dto.descriptionEn;
    const descriptionJa: string | null = dto.descriptionJa ?? null;

    const highlightsEn: string[] = dto.highlightsEn;
    const highlightsJa: string[] | null = dto.highlightsJa ?? null;

    const includesEn: string[] = dto.includesEn;
    const includesJa: string[] | null = dto.includesJa ?? null;

    const excludesEn: string[] = dto.excludesEn;
    const excludesJa: string[] | null = dto.excludesJa ?? null;

    // 4. Insert into database
    const [newPackage] = await this.db
      .insert(schema.packages)
      .values({
        // Shared Fields
        type: dto.type,
        category: dto.category,
        origin: dto.origin,
        duration: dto.duration,
        badge: dto.badge,
        slug: dto.slug,
        price: dto.price.toString(),
        discount: dto.discount !== undefined ? dto.discount.toString() : '0',
        provider: dto.provider,
        gallery: gallery,
        likes: 0,

        // JSONB Fields
        activityDetails: plainActivityDetails,
        itinerary: plainItinerary,
        destinations: plainDestinations,

        // Localized Text Fields
        titleEn,
        titleJa,
        titleEmphasisEn,
        titleEmphasisJa,
        leadTitleEn,
        leadTitleJa,
        leadDescriptionEn,
        leadDescriptionJa,
        descriptionEn,
        descriptionJa,

        // Localized Array Fields
        highlightsEn,
        highlightsJa,
        includesEn,
        includesJa,
        excludesEn,
        excludesJa,
      })
      .returning();

    // 5. Return the minimal response for the success message
    return {
      id: newPackage.id,
      slug: newPackage.slug,
      message: "Package created successfully!",
      createdAt: newPackage.createdAt,
    };
  }

  // --- GET /addpackages -> Returns minimal admin list (id, slug, title) ---
  async findAll(): Promise<PackageListItemDto[]> {
    const records = await this.db
      .select({
        id: schema.packages.id,
        slug: schema.packages.slug,
        title: schema.packages.titleEn,
      })
      .from(schema.packages)
      .orderBy(desc(schema.packages.createdAt));

    return records;
  }

  // --- GET /addpackages/:slug -> Returns PackageResponseDto ---
  async findOne(slug: string): Promise<PackageResponseDto> {
    const [pkg] = await this.db
      .select()
      .from(schema.packages)
      .where(eq(schema.packages.slug, slug))
      .limit(1);

    if (!pkg) {
      throw new NotFoundException(`Package with slug "${slug}" not found`);
    }

    return this.mapToPackageResponseDto(pkg);
  }

  async updateTextOnly(
    slug: string,
    dto: Partial<CreateAddPackageDto>,
  ): Promise<PackageResponseDto> {
    // 1. Fetch existing to fill in any missing fields from the partial DTO
    const existing = await this.findOne(slug);

    // 2. Perform update
    const [updatedPkg] = await this.db
      .update(schema.packages)
      .set({
        // Shared fields
        type: dto.type ?? (existing.type as any),
        category: dto.category ?? existing.category,
        origin: dto.origin ?? existing.origin,
        duration: dto.duration ?? existing.duration,
        badge: dto.badge ?? existing.badge,
        slug: dto.slug ?? existing.slug,
        price: dto.price !== undefined ? dto.price.toString() : existing.price.toString(),
        discount: dto.discount !== undefined ? dto.discount.toString() : (existing.discount ?? 0).toString(),
        provider: dto.provider ?? existing.provider,

        // ── Localized Scalar Fields ──
        titleEn: dto.titleEn ?? existing.titleEn,
        titleJa: dto.titleJa !== undefined ? dto.titleJa : existing.titleJa,

        titleEmphasisEn: dto.titleEmphasisEn ?? existing.titleEmphasisEn,
        titleEmphasisJa: dto.titleEmphasisJa !== undefined ? dto.titleEmphasisJa : existing.titleEmphasisJa,

        leadTitleEn: dto.leadTitleEn ?? existing.leadTitleEn,
        leadTitleJa: dto.leadTitleJa !== undefined ? dto.leadTitleJa : existing.leadTitleJa,

        leadDescriptionEn: dto.leadDescriptionEn ?? existing.leadDescriptionEn,
        leadDescriptionJa: dto.leadDescriptionJa !== undefined ? dto.leadDescriptionJa : existing.leadDescriptionJa,

        descriptionEn: dto.descriptionEn ?? existing.descriptionEn,
        descriptionJa: dto.descriptionJa !== undefined ? dto.descriptionJa : existing.descriptionJa,

        // ── Localized Arrays ──
        highlightsEn: dto.highlightsEn ?? existing.highlightsEn,
        highlightsJa: dto.highlightsJa !== undefined ? dto.highlightsJa : existing.highlightsJa,

        includesEn: dto.includesEn ?? existing.includesEn,
        includesJa: dto.includesJa !== undefined ? dto.includesJa : existing.includesJa,

        excludesEn: dto.excludesEn ?? existing.excludesEn,
        excludesJa: dto.excludesJa !== undefined ? dto.excludesJa : existing.excludesJa,

        // ── JSONB Fields ──
        activityDetails: dto.activityDetails ? JSON.parse(JSON.stringify(dto.activityDetails)) : existing.activityDetails,
        itinerary: dto.itinerary ? JSON.parse(JSON.stringify(dto.itinerary)) : existing.itinerary,
        destinations: dto.destinations ? JSON.parse(JSON.stringify(dto.destinations)) : existing.destinations,

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
      message: `Package "${existing.titleEn}" (${slug}) was successfully deleted.`,
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

    // 2. Fetch paginated summary records
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

    // 4. Map records to the summary DTO
    const data: PackageSummaryResponseDto[] = records.map((pkg: any) => {
      const galleryArray = (pkg.gallery as string[]) || [];
      const heroImage = galleryArray.length > 0 ? galleryArray[0] : null;
      const rawRating = ratingsMap.get(pkg.id) || 0;

      return {
        id: pkg.id,
        slug: pkg.slug,
        origin: pkg.origin,
        price: Number(pkg.price),
        discount: pkg.discount,
        badge: pkg.badge,
        heroImage: heroImage,
        category: pkg.category,
        duration: pkg.duration,
        likes: pkg.likes ?? 0,
        averageRating: Number(rawRating.toFixed(1)),

        // ── English Fields ──
        titleEn: pkg.titleEn,
        descriptionEn: pkg.descriptionEn,

        // ── Japanese Fields ──
        titleJa: pkg.titleJa,
        descriptionJa: pkg.descriptionJa,
      };
    });

    return {
      data,
      totalCount,
      hasMore: offset + data.length < totalCount,
    };
  }

  //check the user like already
  async hasLiked(packageId: string, userId: string): Promise<{ liked: boolean }> {
    const existing = await this.db.query.packageLikes.findFirst({
      where: and(
        eq(schema.packageLikes.packageId, packageId),
        eq(schema.packageLikes.userId, userId),
      ),
      columns: { id: true },
    });

    return { liked: !!existing };
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

  // Helper method for mapping database values to PackageResponseDto
  private mapToPackageResponseDto(pkg: any): PackageResponseDto {
    return {
      id: pkg.id,
      slug: pkg.slug,
      type: pkg.type as PackageType,
      category: pkg.category,
      origin: pkg.origin,
      duration: pkg.duration,
      badge: pkg.badge || undefined,

      // Localized English Fields
      titleEn: pkg.titleEn,
      titleEmphasisEn: pkg.titleEmphasisEn,
      leadTitleEn: pkg.leadTitleEn,
      leadDescriptionEn: pkg.leadDescriptionEn,
      descriptionEn: pkg.descriptionEn,
      highlightsEn: pkg.highlightsEn || [],
      includesEn: pkg.includesEn || [],
      excludesEn: pkg.excludesEn || [],

      // Localized Japanese Fields
      titleJa: pkg.titleJa,
      titleEmphasisJa: pkg.titleEmphasisJa,
      leadTitleJa: pkg.leadTitleJa,
      leadDescriptionJa: pkg.leadDescriptionJa,
      descriptionJa: pkg.descriptionJa,
      highlightsJa: pkg.highlightsJa || [],
      includesJa: pkg.includesJa || [],
      excludesJa: pkg.excludesJa || [],

      // Shared fields
      price: Number(pkg.price),
      discount: pkg.discount ? Number(pkg.discount) : 0,
      provider: pkg.provider,
      gallery: pkg.gallery || [],
      activityDetails: pkg.activityDetails || [],
      itinerary: pkg.itinerary || [],
      destinations: pkg.destinations || [],
      likes: pkg.likes ?? 0,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
    };
  }
}