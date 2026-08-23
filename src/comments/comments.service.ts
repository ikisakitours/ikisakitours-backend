import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentResponseDto } from './dto/comment-response.dto';
import { ReplyCommentDto } from './dto/reply-comment.dto';

@Injectable()
export class CommentsService {
  private comments: CommentResponseDto[] = [
    {
      id: 'cmt_01',
      source: 'Tour: Bali Tropical Paradise Gateway 7-Day Tour',
      isPubliclyVisible: true,
      authorName: 'Sarah Jenkins',
      authorAvatarUrl: 'https://i.pravatar.cc/150?img=5',
      content:
        "Are hotel transfers included if my arrival flight lands at midnight? The booking description lists shuttle times but doesn't mention late hour options.",
      date: 'Aug 18, 2026',
    },
    {
      id: 'cmt_02',
      source: 'Tour: Sigiriya Day Tour',
      isPubliclyVisible: false,
      authorName: 'John Doe',
      content: 'Is there a vegetarian food option provided for lunch?',
      date: 'Aug 17, 2026',
    },
  ];

  async findAll(): Promise<CommentResponseDto[]> {
    return this.comments;
  }

  async replyToComment(
    id: string,
    dto: ReplyCommentDto,
  ): Promise<CommentResponseDto> {
    const comment = this.comments.find((item) => item.id === id);

    if (!comment) {
      throw new NotFoundException(`Comment with ID "${id}" not found`);
    }

    comment.adminReply = dto.reply;
    return comment;
  }
}