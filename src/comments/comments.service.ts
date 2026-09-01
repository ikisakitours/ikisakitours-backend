import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc } from 'drizzle-orm';
import { CommentResponseDto } from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ReplyCommentDto } from './dto/reply-comment.dto';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { CommentListResponseDto } from './dto/comment-list-response.dto';

@Injectable()
export class CommentsService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) { }

  // Helper to map DB record + Joined User to Response DTO
  private toCommentResponseDto(comment: any): CommentResponseDto {
    return {
      id: comment.id,
      source: comment.type,
      rating: comment.rating ?? null,
      isPubliclyVisible: comment.isPublic ?? true,
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
      .set({ adminReply: dto.reply })
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
}