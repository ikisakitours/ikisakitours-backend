import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc, count } from 'drizzle-orm';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { AddPackageResponseDto } from './dto/addpackage-response.dto'; import { CreateAddPackageDto } from './dto/create-addpackage.dto';
import { PackageResponseDto, PackageType } from './dto/PackageResponse.dto';
import { UploadsService } from '../uploads/uploads.service';

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
    // Upload all images first, get back the array of URLs
    const gallery = await this.uploadsService.uploadMultiple(images, 'package-images');

    const [newPackage] = await this.db
      .insert(schema.packages)
      .values({
        type: dto.type,
        slug: dto.slug,
        titleEmphasis: dto.titleEmphasis,
        title: dto.title,
        price: dto.price.toString(),
        discount: dto.discount ? dto.discount.toString() : '0',
        provider: dto.provider,
        leadTitle: dto.leadTitle,
        leadDescription: dto.leadDescription,
        gallery: gallery,
        activityDetails: dto.activityDetails,
        highlights: dto.highlights,
        description: dto.description,
        itinerary: dto.itinerary,
        destinations: dto.destinations,
        includes: dto.includes,
        excludes: dto.excludes,
      })
      .returning();

    return {
      ...dto,
      gallery: gallery,
      id: newPackage.id,
      createdAt: newPackage.createdAt,
    };
  }

  // --- GET /addpackages -> Returns PackageResponseDto[] ---
  async findAllPaginated(page: number = 1, limit: number = 5) {
    const offset = (page - 1) * limit;

    // 1. Fetch total count of packages
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(schema.packages);

    const totalCount = Number(total);

    // 2. Fetch paginated records using Drizzle
    const records = await this.db.query.packages.findMany({
      limit: limit,
      offset: offset,
      with: {
        comments: {
          with: { user: true },
        },
      },
      orderBy: [desc(schema.packages.createdAt)],
    });

    const data = records.map((pkg) => this.mapToPackageResponseDto(pkg));

    return {
      data,
      totalCount,
      hasMore: offset + data.length < totalCount,
    };
  }

  // --- GET /addpackages/:id -> Returns PackageResponseDto ---
  async findOne(id: string): Promise<PackageResponseDto> {
    const pkg = await this.db.query.packages.findFirst({
      where: eq(schema.packages.id, id),
      with: {
        comments: {
          with: {
            user: true,
          },
        },
      },
    });

    if (!pkg) {
      throw new NotFoundException(`Package with ID "${id}" not found`);
    }

    return this.mapToPackageResponseDto(pkg);
  }

  // Helper method for GET requests mapping database values to PackageResponseDto
  private mapToPackageResponseDto(pkg: any): PackageResponseDto {
    const rawComments = pkg.comments || [];
    const visibleComments = rawComments.filter((c: any) => c.isPublic ?? true);

    const ratedComments = visibleComments.filter(
      (c: any) => c.rating !== null && c.rating !== undefined,
    );

    const totalRatingSum = ratedComments.reduce(
      (sum: number, c: any) => sum + Number(c.rating || 0),
      0,
    );

    const averageRating =
      ratedComments.length > 0
        ? Number((totalRatingSum / ratedComments.length).toFixed(1))
        : 0;

    return {
      id: pkg.id,
      slug: pkg.slug,
      type: pkg.type as PackageType,
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
      rating: averageRating,
      likeCount: visibleComments.filter((c: any) => c.type === 'like').length,
      reviewCount: ratedComments.length,
      comments: visibleComments.map((comment: any) => ({
        id: comment.id,
        userId: comment.userId || undefined,
        userName: comment.user
          ? `${comment.user.firstName} ${comment.user.lastName}`
          : comment.userName || 'Anonymous User',
        userAvatar: comment.user?.avatarUrl ?? comment.userAvatar ?? undefined,
        content: comment.content,
        type: comment.type,
        isPublic: comment.isPublic ?? true,
        adminReply: comment.adminReply || undefined,
        rating: comment.rating ? Number(comment.rating) : undefined,
        images: comment.images || [],
        createdAt: comment.createdAt,
      })),
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
    };
  }
}