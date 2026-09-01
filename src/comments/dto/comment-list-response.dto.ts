import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CommentResponseDto } from './comment-response.dto';

export class CommentListResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommentResponseDto)
  comments!: CommentResponseDto[];

  @IsNumber()
  totalComments!: number;

  @IsNumber()
  averageRating!: number;
}