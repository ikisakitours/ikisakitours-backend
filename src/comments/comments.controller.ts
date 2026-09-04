import { Controller, Get, Post, Param, Body, Req, UnauthorizedException, UseGuards, Patch } from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { CommentsService } from './comments.service';
import { CommentResponseDto } from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ReplyCommentDto } from './dto/reply-comment.dto';
import { JwtAuthGuard } from '../users/jwt-auth.guard';
import { CommentListResponseDto } from './dto/comment-list-response.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly jwtService: JwtService,
  ) { }

  // 1. Fetch all comments (for Admin Panel view)
  @Get()
  async findAll(): Promise<CommentListResponseDto> {
    return await this.commentsService.findAll();
  }

  // 2. User creates a new comment (JWT extracted automatically)
  /*
  @Post()
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request,
  ): Promise<CommentResponseDto> {
    const token = req.cookies?.access_token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('You must be logged in to comment');
    }

    try {
      const payload = this.jwtService.verify(token);
      return await this.commentsService.createComment(createCommentDto, payload.sub);
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
  */

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request & { user: { sub: string } },
  ): Promise<CommentResponseDto> {

    const userId = req.user.sub;

    return await this.commentsService.createComment(createCommentDto, userId);
  }

  // 3. Admin replies to a specific comment card
  @Post(':id/reply')
  async reply(
    @Param('id') id: string,
    @Body() replyDto: ReplyCommentDto,
  ): Promise<CommentResponseDto> {
    return await this.commentsService.replyToComment(id, replyDto);
  }

  //change visibility
  @Patch(':id/visibility')
  async updateVisibility(
    @Param('id') id: string,
    @Body() updateVisibilityDto: UpdateVisibilityDto,
  ): Promise<CommentResponseDto> {
    return await this.commentsService.updateVisibility(id, updateVisibilityDto);
  }
}