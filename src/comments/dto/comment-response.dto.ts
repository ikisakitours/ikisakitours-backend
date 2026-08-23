import { IsString, IsBoolean, IsOptional } from 'class-validator';

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
  date!: string; // e.g., "Aug 18, 2026"

  @IsOptional()
  @IsString()
  adminReply?: string;
}