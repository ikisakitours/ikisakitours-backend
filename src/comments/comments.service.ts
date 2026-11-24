import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc, and } from 'drizzle-orm';
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
import {
  generateFeedbackReferenceId,
  generateReviewReferenceId,
} from '../common/utils/reference-id.util';

@Injectable()
export class CommentsService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly uploadsService: UploadsService,
  ) {}

  private async ensureCommentReferenceId(comment: any): Promise<any> {
    if (comment.referenceId) {
      return comment;
    }
    const referenceId = generateFeedbackReferenceId();
    try {
      const [updated] = await this.db
        .update(schema.comments)
        .set({ referenceId })
        .where(eq(schema.comments.id, comment.id))
        .returning();
      return updated
        ? { ...comment, referenceId: updated.referenceId }
        : { ...comment, referenceId };
    } catch {
      return { ...comment, referenceId };
    }
  }

  private async ensurePackageReviewReferenceId(
    review: typeof schema.packageReviews.$inferSelect,
  ): Promise<typeof schema.packageReviews.$inferSelect> {
    if (review.referenceId) {
      return review;
    }
    const referenceId = generateReviewReferenceId();
    try {
      const [updated] = await this.db
        .update(schema.packageReviews)
        .set({ referenceId })
        .where(eq(schema.packageReviews.id, review.id))
        .returning();
      return updated || { ...review, referenceId };
    } catch {
      return { ...review, referenceId };
    }
  }

  // Helper to map DB record + Joined User to Response DTO
  private toCommentResponseDto(comment: any): CommentResponseDto {
    return {
      id: comment.id,
      source: comment.type,
      rating: comment.rating ?? null,
      isPubliclyVisible: comment.isPublic ?? true,
      firstName: comment.user?.firstName,
      lastName: comment.user?.lastName,
      authorName: comment.user
        ? `${comment.user.firstName} ${comment.user.lastName}`
        : 'Anonymous User',
      country: comment.user?.country || 'Unknown',
      avatarUrl: comment.user?.avatarUrl ?? null,
      isVerified: comment.user?.isVerified ?? false,
      isVip: comment.user?.isVip ?? false,
      hasAccess: comment.user?.hasAccess ?? true,
      customerReferenceId: comment.user?.customerReferenceId ?? null,
      referenceId: comment.referenceId || generateFeedbackReferenceId(),
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

    const ensuredRecords = await Promise.all(
      records.map((c) => this.ensureCommentReferenceId(c)),
    );

    const totalComments = ensuredRecords.length;

    // Filter comments with valid ratings to calculate the overall average
    const ratedComments = ensuredRecords.filter(
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
      comments: ensuredRecords.map((comment) =>
        this.toCommentResponseDto(comment),
      ),
      totalComments,
      averageRating,
    };
  }

  // Fetches from the view (automatically filters out isPublic = false)
  async findPublicComments(): Promise<CommentListResponseDto> {
    // Query the VIEW directly, joined with the users table
    const records = await this.db
      .select({
        id: schema.publicComments.id,
        content: schema.publicComments.content,
        type: schema.publicComments.type,
        isPublic: schema.publicComments.isPublic,
        adminReply: schema.publicComments.adminReply,
        rating: schema.publicComments.rating,
        createdAt: schema.publicComments.createdAt,
        // Map user fields so your helper method's comment.user?.xxx checks work correctly
        user: {
          id: schema.users.id,
          customerReferenceId: schema.users.customerReferenceId,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          country: schema.users.country,
          avatarUrl: schema.users.avatarUrl,
          isVerified: schema.users.isVerified,
          isVip: schema.users.isVip,
          hasAccess: schema.users.hasAccess,
        },
      })
      .from(schema.publicComments)
      .leftJoin(schema.users, eq(schema.publicComments.userId, schema.users.id))
      .orderBy(desc(schema.publicComments.createdAt));

    // 1. Total public comments count
    const totalComments = records.length;

    // 2. Filter out comments with valid ratings
    const ratedComments = records.filter(
      (comment) => comment.rating !== null && comment.rating !== undefined,
    );

    // 3. Total sum of ratings
    const totalRatingSum = ratedComments.reduce(
      (sum, comment) => sum + (comment.rating || 0),
      0,
    );

    // 4. Calculate average rating safely
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
  async createComment(
    dto: CreateCommentDto,
    userId: string,
  ): Promise<CommentResponseDto> {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User account not found');
    }

    if (!user.hasAccess) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account access has been restricted by administration.',
        user: {
          id: user.id,
          customerReferenceId: user.customerReferenceId,
          email: user.email,
          firstname: user.firstName,
          lastname: user.lastName,
          hasAccess: false,
        },
      });
    }

    const [newComment] = await this.db
      .insert(schema.comments)
      .values({
        referenceId: generateFeedbackReferenceId(),
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
  async replyToComment(
    id: string,
    dto: ReplyCommentDto,
  ): Promise<CommentResponseDto> {
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

  // Delete a comment
  async deleteComment(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const [deleted] = await this.db
      .delete(schema.comments)
      .where(eq(schema.comments.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`Comment with ID "${id}" not found`);
    }

    return {
      success: true,
      message: `Comment with ID "${id}" successfully deleted.`,
    };
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
        customerReferenceId: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        isVip: true,
        isVerified: true,
        hasAccess: true,
        country: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.hasAccess) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account access has been restricted by administration.',
        user: {
          id: user.id,
          customerReferenceId: user.customerReferenceId,
          email: user.email,
          firstname: user.firstName,
          lastname: user.lastName,
          hasAccess: false,
        },
      });
    }

    // 2. Upload files
    let imageUrls: string[] = [];
    if (images && images.length > 0) {
      imageUrls = await this.uploadsService.uploadMultiple(
        images,
        'package-reviews',
      );
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
      country: user.country,
    };

    // 4. Insert
    const [newReview] = await this.db
      .insert(schema.packageReviews)
      .values({
        referenceId: generateReviewReferenceId(),
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
    const reviews = await this.db.query.packageReviews.findMany({
      orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
    });

    return await Promise.all(
      reviews.map((r) => this.ensurePackageReviewReferenceId(r)),
    );
  }

  async replyToPackageReview(id: string, adminReply: string) {
    const [updatedReview] = await this.db
      .update(schema.packageReviews)
      .set({
        adminReply,
        adminReplyAt: new Date().toISOString(),
      })
      .where(eq(schema.packageReviews.id, id))
      .returning();

    if (!updatedReview) {
      throw new NotFoundException(`Package review with ID "${id}" not found`);
    }

    return updatedReview;
  }

  async deletePackageReview(id: string) {
    const [deleted] = await this.db
      .delete(schema.packageReviews)
      .where(eq(schema.packageReviews.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`Package review with ID "${id}" not found`);
    }

    return {
      success: true,
      message: `Package review with ID "${id}" deleted.`,
    };
  }

  // package review summery method
  async getPackageReviewSummary(
    packageId: string,
  ): Promise<PackageReviewSummaryDto> {
    const reviews = await this.db.query.packageReviews.findMany({
      where: and(
        eq(schema.packageReviews.packageId, packageId),
        eq(schema.packageReviews.isPublic, true),
      ),
      orderBy: (table, { desc }) => [desc(table.rating), desc(table.createdAt)],
    });

    if (!reviews || reviews.length === 0) {
      return {
        packageId,
        packageName: '',
        averageRating: 0,
        totalReviews: 0,
        totalImages: 0,
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
      referenceId: r.referenceId || generateReviewReferenceId(),
      userSnapshot: r.userSnapshot,
      fullName: r.fullName,
      rating: r.rating,
      experience: r.experience,
      imageUrls: (r.imageUrls as string[]) || [],
      adminReply: r.adminReply ?? null,
      createdAt: r.createdAt,
    }));

    // Flatten all image URLs, shuffle, take a single random set of 5
    const pool: string[] = [];
    for (const review of reviews) {
      for (const url of (review.imageUrls as string[]) || []) {
        if (typeof url === 'string' && url.length > 0) pool.push(url);
      }
    }

    const totalImages = pool.length;

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
      totalImages,
      topReviews,
      randomImageSets,
    };
  }

  // Retrieve all package reviews for a given packageId
  async getAllReviewsByPackageId(packageId: string) {
    const reviews = await this.db.query.packageReviews.findMany({
      where: and(
        eq(schema.packageReviews.packageId, packageId),
        eq(schema.packageReviews.isPublic, true),
      ),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });

    return await Promise.all(
      reviews.map((r) => this.ensurePackageReviewReferenceId(r)),
    );
  }

  //update visibility on a package
  async updatePackageReviewVisibility(
    id: string,
    updateVisibilityDto: UpdateVisibilityDto,
  ) {
    const updatedReview = await this.db
      .update(schema.packageReviews)
      .set({ isPublic: updateVisibilityDto.isPubliclyVisible })
      .where(eq(schema.packageReviews.id, id))
      .returning();

    if (!updatedReview || updatedReview.length === 0) {
      throw new NotFoundException(`Package review with ID ${id} not found.`);
    }

    return {
      success: true,
      review: updatedReview[0],
    };
  }
}
