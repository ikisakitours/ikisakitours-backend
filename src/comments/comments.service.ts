import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc } from 'drizzle-orm';
import { CommentResponseDto } from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ReplyCommentDto } from './dto/reply-comment.dto';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { CommentListResponseDto } from './dto/comment-list-response.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { CreatePackageReviewDto } from './dto/create-package-review.dto';
import { UploadsService } from '../uploads/uploads.service';
import { PackageReviewSummaryDto } from './dto/package-review-summary.dto';

@Injectable()
export class CommentsService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly uploadsService: UploadsService,
  ) { }

  // Helper to map DB record + Joined User to Response DTO
  private toCommentResponseDto(comment: any): CommentResponseDto {
    return {
      id: comment.id,
      source: comment.type,
      rating: comment.rating ?? null,
      isPubliclyVisible: comment.isPublic ?? true,
      firstName: comment.user?.firstName,
      lastName: comment.user?.lastName,
      authorName: comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : 'Anonymous User',
      country: comment.user?.country || 'Unknown',
      avatarUrl: comment.user?.avatarUrl ?? null,
      isVerified: comment.user?.isVerified ?? false,
      isVip: comment.user?.isVip ?? false,
      hasAccess: comment.user?.hasAccess ?? true,
      content: comment.content,
      adminReply: comment.adminReply || undefined,
      date: new Date(comment.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
  }

  // 1. Fetch all comments with joined author details
  async findAll(): Promise<CommentListResponseDto> {
    const records = await this.db.query.comments.findMany({
      with: {
        user: true, // Relational join with users table
      },
      orderBy: [desc(schema.comments.createdAt)],
    });

    const totalComments = records.length;

    // Filter comments with valid ratings to calculate the overall average
    const ratedComments = records.filter(
      (comment) => comment.rating !== null && comment.rating !== undefined,
    );

    const totalRatingSum = ratedComments.reduce(
      (sum, comment) => sum + (comment.rating || 0),
      0,
    );

    const averageRating =
      ratedComments.length > 0
        ? Number((totalRatingSum / ratedComments.length).toFixed(1))
        : 0;

    return {
      comments: records.map((comment) => this.toCommentResponseDto(comment)),
      totalComments,
      averageRating,
    };
  }

  // 2. Create a comment using authenticated userId from JWT
  async createComment(dto: CreateCommentDto, userId: string): Promise<CommentResponseDto> {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User account not found');
    }

    const [newComment] = await this.db
      .insert(schema.comments)
      .values({
        packageId: dto.packageId,
        content: dto.content,
        type: dto.type,
        rating: dto.rating ?? null,
        isPublic: dto.isPublic ?? true,
        userId: user.id,
      })
      .returning();

    return this.toCommentResponseDto({ ...newComment, user });
  }

  // 3. Admin reply to a specific comment card
  async replyToComment(id: string, dto: ReplyCommentDto): Promise<CommentResponseDto> {
    const [updatedComment] = await this.db
      .update(schema.comments)
      .set({ adminReply: dto.adminReply })
      .where(eq(schema.comments.id, id))
      .returning();

    if (!updatedComment) {
      throw new NotFoundException(`Comment with ID "${id}" not found`);
    }

    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, updatedComment.userId),
    });

    return this.toCommentResponseDto({ ...updatedComment, user });
  }

  // 4. Change visibility on a comment
  async updateVisibility(
    id: string,
    updateVisibilityDto: UpdateVisibilityDto,
  ): Promise<CommentResponseDto> {
    const [updatedComment] = await this.db
      .update(schema.comments)
      .set({ isPublic: updateVisibilityDto.isPubliclyVisible })
      .where(eq(schema.comments.id, id))
      .returning();

    if (!updatedComment) {
      throw new NotFoundException(`Comment with ID "${id}" not found`);
    }

    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, updatedComment.userId),
    });

    return this.toCommentResponseDto({ ...updatedComment, user });
  }

  //Only package reviews
  //--------------------------------------------------------------
  //Create a package review in the dedicated package_reviews table
  async createPackageReview(
    dto: CreatePackageReviewDto,
    images?: Express.Multer.File[],
  ) {
    // 1. Load the user — server-side source of truth for the snapshot
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, dto.userId),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        isVip: true,
        isVerified: true,
        hasAccess: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Upload files
    let imageUrls: string[] = [];
    if (images && images.length > 0) {
      imageUrls = await this.uploadsService.uploadMultiple(images, 'package-reviews');
    }

    // 3. Snapshot (display-safe fields only)
    const userSnapshot = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      isVip: user.isVip,
      isVerified: user.isVerified,
      hasAccess: user.hasAccess,
    };

    // 4. Insert
    const [newReview] = await this.db
      .insert(schema.packageReviews)
      .values({
        packageId: dto.packageId,
        packageName: dto.packageName,
        type: 'PACKAGE',
        userSnapshot,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        rating: dto.rating,
        experience: dto.experience,
        imageUrls,
      })
      .returning();

    return newReview;
  }

  // Fetch all package reviews ordered by newest first
  async findAllPackageReviews() {
    return await this.db.query.packageReviews.findMany({
      orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
    });
  }

  async replyToPackageReview(id: string, adminReply: string) {
    const [updatedReview] = await this.db
      .update(schema.packageReviews)
      .set({ adminReply })
      .where(eq(schema.packageReviews.id, id))
      .returning();

    if (!updatedReview) {
      throw new NotFoundException(`Package review with ID "${id}" not found`);
    }

    return updatedReview;
  }

  // package review summery method
  async getPackageReviewSummary(packageId: string): Promise<PackageReviewSummaryDto> {
    const reviews = await this.db.query.packageReviews.findMany({
      where: eq(schema.packageReviews.packageId, packageId),
      orderBy: (table, { desc }) => [desc(table.rating), desc(table.createdAt)],
    });

    if (!reviews || reviews.length === 0) {
      return {
        packageId,
        packageName: '',
        averageRating: 0,
        totalReviews: 0,
        topReviews: [],
        randomImageSets: [],
      };
    }

    const packageName = reviews[0].packageName;
    const totalReviews = reviews.length;

    const totalRatingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = Number((totalRatingSum / totalReviews).toFixed(1));

    const topReviews = reviews.slice(0, 2).map((r) => ({
      id: r.id,
      userSnapshot: r.userSnapshot,
      fullName: r.fullName,
      rating: r.rating,
      experience: r.experience,
      imageUrls: (r.imageUrls as string[]) || [],
      adminReply: r.adminReply ?? null,
      createdAt: r.createdAt,
    }));

    // Flatten all image URLs, shuffle, chunk into sets of exactly 5, cap at 5 sets
    const pool: string[] = [];
    for (const review of reviews) {
      for (const url of ((review.imageUrls as string[]) || [])) {
        if (typeof url === 'string' && url.length > 0) pool.push(url);
      }
    }

    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const randomImageSets: string[][] = [];
    if (shuffled.length >= 5) {
      randomImageSets.push(shuffled.slice(0, 5));
    }

    return {
      packageId,
      packageName,
      averageRating,
      totalReviews,
      topReviews,
      randomImageSets,
    };
  }

  // Retrieve all package reviews for a given packageId
  async getAllReviewsByPackageId(packageId: string) {
    const reviews = await this.db.query.packageReviews.findMany({
      where: eq(schema.packageReviews.packageId, packageId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });

    return reviews;
  }
}