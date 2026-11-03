import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

export class PackageSummaryResponseDto {
  @IsString()
  id!: string;

  @IsString()
  slug!: string;

  @IsObject()
  origin!: Record<string, string>;

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
  category!: Record<string, string>;

  @IsObject()
  duration!: Record<string, string>;

  @IsNumber()
  likes!: number;

  @IsNumber()
  averageRating!: number;

  // ── Multilingual JSONB Text Fields ──
  @IsObject()
  title!: Record<string, string>;

  @IsObject()
  description!: Record<string, string>;
}