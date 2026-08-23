import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentResponseDto } from './dto/comment-response.dto';
import { ReplyCommentDto } from './dto/reply-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  async findAll(): Promise<CommentResponseDto[]> {
    return await this.commentsService.findAll();
  }

  @Post(':id/reply')
  async reply(
    @Param('id') id: string,
    @Body() replyDto: ReplyCommentDto,
  ): Promise<CommentResponseDto> {
    return await this.commentsService.replyToComment(id, replyDto);
  }
}