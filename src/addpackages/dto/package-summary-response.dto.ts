import { IsString, IsNumber, IsOptional } from 'class-validator';

export class PackageSummaryResponseDto {
  @IsString()
  id!: string;

  @IsString()
  slug!: string;

  @IsString()
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

  @IsString()
  category!: string;

  @IsString()
  duration!: string;

  @IsNumber()
  likes!: number;

  @IsNumber()
  averageRating!: number;

  // ── Localized English Fields ──
  @IsString()
  titleEn!: string;

  @IsString()
  descriptionEn!: string;

  // ── Localized Japanese Fields ──
  @IsOptional()
  @IsString()
  titleJa?: string | null;

  @IsOptional()
  @IsString()
  descriptionJa?: string | null;
}