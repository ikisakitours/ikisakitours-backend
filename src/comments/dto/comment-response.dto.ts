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

  @IsString()
  country!: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @IsBoolean()
  isVerified!: boolean;

  @IsBoolean()
  isVip!: boolean;

  @IsBoolean()
  hasAccess!: boolean;

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