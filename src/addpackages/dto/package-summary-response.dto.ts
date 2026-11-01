import { IsString, IsNumber, IsOptional } from 'class-validator';

export class PackageSummaryResponseDto {
  @IsString()
  id!: string;

  @IsString()
  title!: string;

  @IsString()
  origin!: string;

  @IsNumber()
  price!: number;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  discount!: string | null;

  @IsOptional()
  @IsString()
  badge!: string | null;

  @IsString()
  description!: string;

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

  // ── ADDED ──
  // Tells the frontend which language this summary is in. 
  // Useful if you want to show an "EN" tag when a user is on the 
  // Japanese site but the package hasn't been translated yet.
  @IsOptional()
  @IsString()
  locale?: string;
}