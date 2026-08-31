import { IsString, IsBoolean, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CommentResponseDto {
  @IsString()
  id!: string;

  @IsString()
  source!: string;

  @IsBoolean()
  isPubliclyVisible!: boolean;

  @IsString()
  authorName!: string;

  @IsOptional()
  @IsString()
  authorAvatarUrl?: string;

  @IsString()
  content!: string;

  @IsString()
  date!: string;

  @IsOptional()
  @IsString()
  adminReply?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}