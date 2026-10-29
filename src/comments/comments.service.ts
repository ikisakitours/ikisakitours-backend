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
  //Create a package review in the dedicated package_reviews table
  async createPackageReview(
    dto: CreatePackageReviewDto,
    images?: Express.Multer.File[]
  ) {
    let imageUrls: string[] = [];

    // 1. Upload files to Cloudflare R2 if present
    if (images && images.length > 0) {
      imageUrls = await this.uploadsService.uploadMultiple(images, 'package-reviews'); // <-- 3. Works now!
    }

    // 2. Save into Supabase DB
    const [newReview] = await this.db
      .insert(schema.packageReviews)
      .values({
        packageId: dto.packageId,
        packageName: dto.packageName,
        type: 'PACKAGE',
        fullName: dto.fullName,
        email: dto.email,
        rating: Number(dto.rating),
        experience: dto.experience,
        imageUrls: imageUrls,
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
  async getPackageReviewSummary(packageId: string) {
    // 1. Fetch all reviews for this specific package
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

    // 2. Calculate Average Rating
    const totalRatingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = Number((totalRatingSum / totalReviews).toFixed(1));

    // 3. Get Top 2 Highest Rating Reviews
    const topReviews = reviews.slice(0, 2);

    // 4. Collect and flatten all image URLs, then pick up to 5 random sets/items
    const allImagesLists: string[][] = reviews
      .map((r) => (r.imageUrls as string[]) || [])
      .filter((imgs) => imgs.length > 0);

    // Shuffle and pick 5 random image sets
    const shuffledImages = [...allImagesLists].sort(() => 0.5 - Math.random());
    const randomImageSets = shuffledImages.slice(0, 5);

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