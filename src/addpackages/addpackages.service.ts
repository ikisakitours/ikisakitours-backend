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

    // 3. Insert into database using unified jsonb fields
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

        // Complex JSONB Structures
        activityDetails: plainActivityDetails,
        itinerary: plainItinerary,
        destinations: plainDestinations,

        // Multilingual JSONB Text Fields
        title: dto.title,
        titleEmphasis: dto.titleEmphasis,
        leadTitle: dto.leadTitle,
        leadDescription: dto.leadDescription,
        description: dto.description,

        // Multilingual JSONB Array Fields
        highlights: dto.highlights,
        includes: dto.includes,
        excludes: dto.excludes,
      })
      .returning();

    // 4. Return the minimal response for the success message
    return {
      id: newPackage.id,
      slug: newPackage.slug,
      message: "Package created successfully!",
      createdAt: newPackage.createdAt,
    };
  }

  // --- GET /addpackages -> Returns minimal admin list ---
  async findAll(lang: string = 'en'): Promise<PackageListItemDto[]> {
    const records = await this.db
      .select({
        id: schema.packages.id,
        slug: schema.packages.slug,
        title: schema.packages.title,
        type: schema.packages.type,
      })
      .from(schema.packages)
      .orderBy(desc(schema.packages.createdAt));

    // If your PackageListItemDto expects a string title for the requested language, 
    // you can map it like this:
    return records.map((record) => ({
      id: record.id,
      slug: record.slug,
      type: record.type,
      title: (record.title as Record<string, string>)?.[lang] || (record.title as Record<string, string>)?.['en'] || '',
    }));
  }

  // --- GET /addpackages/:slug -> Returns PackageResponseDto ---
  async findOne(slug: string, lang?: string) {
    const [pkg] = await this.db
      .select()
      .from(schema.packages)
      .where(eq(schema.packages.slug, slug))
      .limit(1);

    if (!pkg) {
      throw new NotFoundException(`Package with slug "${slug}" not found`);
    }

    // ONLY map and flatten if a specific language is requested (public client).
    // If no 'lang' query param is passed (admin edit form), return raw pkg with full JSONB dictionaries!
    if (lang) {
      return this.mapToPackageResponseDto(pkg, lang);
    }

    return pkg;
  }


  //update text only
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

        // ── Multilingual JSONB Text Fields ──
        title: dto.title ?? existing.title,
        titleEmphasis: dto.titleEmphasis ?? existing.titleEmphasis,
        leadTitle: dto.leadTitle ?? existing.leadTitle,
        leadDescription: dto.leadDescription ?? existing.leadDescription,
        description: dto.description ?? existing.description,

        // ── Multilingual JSONB Arrays ──
        highlights: dto.highlights ?? existing.highlights,
        includes: dto.includes ?? existing.includes,
        excludes: dto.excludes ?? existing.excludes,

        // ── Complex JSONB Structures ──
        activityDetails: dto.activityDetails ? JSON.parse(JSON.stringify(dto.activityDetails)) : existing.activityDetails,
        itinerary: dto.itinerary ? JSON.parse(JSON.stringify(dto.itinerary)) : existing.itinerary,
        destinations: dto.destinations ? JSON.parse(JSON.stringify(dto.destinations)) : existing.destinations,

        updatedAt: new Date(),
      })
      .where(eq(schema.packages.slug, slug))
      .returning();

    return this.mapToPackageResponseDto(updatedPkg);
  }

  // --- DELETE /addpackages/:slug -> Removes a package ---
  async remove(slug: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.findOne(slug);

    await this.db
      .delete(schema.packages)
      .where(eq(schema.packages.slug, slug));

    // Extract title for the message using the dictionary (falling back to English or empty string)
    const titleObj = (existing.title as Record<string, string>) || {};
    const displayTitle = titleObj['en'] || Object.values(titleObj)[0] || slug;

    return {
      success: true,
      message: `Package "${displayTitle}" (${slug}) was successfully deleted.`,
    };
  }

  // retrive summery data
  async findSummariesPaginated(
    page: number = 1,
    limit: number = 5,
    packageType: string,
    lang: string = 'en',
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

    // 4. Map records and extract text based on the requested 'lang' parameter
    const data: PackageSummaryResponseDto[] = records.map((pkg: any) => {
      const galleryArray = (pkg.gallery as string[]) || [];
      const heroImage = galleryArray.length > 0 ? galleryArray[0] : null;
      const rawRating = ratingsMap.get(pkg.id) || 0;

      // Helper function to extract text for the specific language with fallback to 'en'
      const getLocalizedField = (fieldObj: Record<string, string> | null) => {
        if (!fieldObj) return '';
        return fieldObj[lang] || fieldObj['en'] || Object.values(fieldObj)[0] || '';
      };

      return {
        id: pkg.id,
        slug: pkg.slug,
        origin: getLocalizedField(pkg.origin),
        price: Number(pkg.price),
        discount: pkg.discount,
        badge: pkg.badge,
        heroImage: heroImage,
        category: getLocalizedField(pkg.category),
        duration: getLocalizedField(pkg.duration),
        likes: pkg.likes ?? 0,
        averageRating: Number(rawRating.toFixed(1)),

        // Resolved Multilingual Text Fields for the requested language
        title: getLocalizedField(pkg.title),
        description: getLocalizedField(pkg.description),
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
  private mapToPackageResponseDto(pkg: any, lang: string = 'en'): PackageResponseDto {
    const getLocalizedField = (fieldObj: Record<string, string> | null) => {
      if (!fieldObj) return '';
      if (typeof fieldObj === 'string') return fieldObj;
      return fieldObj[lang] || fieldObj['en'] || Object.values(fieldObj)[0] || '';
    };

    const getLocalizedArray = (fieldObj: Record<string, string[]> | null) => {
      if (!fieldObj) return [];
      if (Array.isArray(fieldObj)) return fieldObj;
      return fieldObj[lang] || fieldObj['en'] || Object.values(fieldObj)[0] || [];
    };

    return {
      id: pkg.id,
      slug: pkg.slug,
      type: pkg.type as PackageType,
      category: getLocalizedField(pkg.category) as any,
      origin: getLocalizedField(pkg.origin) as any,
      duration: getLocalizedField(pkg.duration) as any,
      badge: getLocalizedField(pkg.badge) as any,

      // Localized Multilingual JSONB Text Fields
      title: getLocalizedField(pkg.title) as any,
      titleEmphasis: getLocalizedField(pkg.titleEmphasis) as any,
      leadTitle: getLocalizedField(pkg.leadTitle) as any,
      leadDescription: getLocalizedField(pkg.leadDescription) as any,
      description: getLocalizedField(pkg.description) as any,

      // Localized Multilingual JSONB Arrays
      highlights: getLocalizedArray(pkg.highlights) as any,
      includes: getLocalizedArray(pkg.includes) as any,
      excludes: getLocalizedArray(pkg.excludes) as any,

      // Localized Nested Arrays & Objects
      activityDetails: (pkg.activityDetails || []).map((detail: any) => ({
        title: getLocalizedField(detail.title),
        description: getLocalizedField(detail.description),
      })) as any,

      itinerary: (pkg.itinerary || []).map((item: any) => ({
        day: item.day,
        title: getLocalizedField(item.title),
        description: getLocalizedField(item.description),
        images: item.images || [],
        travelTime: getLocalizedField(item.travelTime),
        locations: getLocalizedArray(item.locations),
        route: getLocalizedArray(item.route),
        details: getLocalizedArray(item.details),
        scenicStops: getLocalizedArray(item.scenicStops),
        activities: getLocalizedArray(item.activities),
        meals: getLocalizedField(item.meals),
        accommodation: getLocalizedField(item.accommodation),
      })) as any,

      destinations: (pkg.destinations || []).map((dest: any) => ({
        id: dest.id,
        title: getLocalizedField(dest.title),
        slug: dest.slug,
        summary: getLocalizedField(dest.summary),
        heroImage: dest.heroImage,
        coordinates: dest.coordinates,
      })) as any,

      // Shared fields & complex jsonb structures
      price: Number(pkg.price),
      discount: pkg.discount ? Number(pkg.discount) : 0,
      provider: pkg.provider,
      gallery: pkg.gallery || [],
      likes: pkg.likes ?? 0,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
    } as unknown as PackageResponseDto;
  }
}
