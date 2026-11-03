import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

export class PackageSummaryResponseDto {
  @IsString()
  id!: string;

  @IsString()
  slug!: string;

  @IsObject()
  origin!: string;

  @IsNumber()
  price!: number;

  @IsOptional()
  @IsString()
  discount!: string | null;

  @IsOptional()
  @IsString()
  badge!: string | null;

  @IsOptional()
  @IsString()
  heroImage!: string | null;

  @IsObject()
  category!: string;

  @IsObject()
  duration!: string;

  @IsNumber()
  likes!: number;

  @IsNumber()
  averageRating!: number;

  // ── Multilingual JSONB Text Fields ──
  @IsObject()
  title!: string;

  @IsObject()
  description!: string;
}