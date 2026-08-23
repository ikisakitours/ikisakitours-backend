import {
  IsString,
  IsNumber,
  IsUrl,
  IsArray,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreateAddPackageDto {
  // Basic Details
  @IsString()
  title!: string; // e.g., "Ancient Kingdom Sigiriya"

  @IsString()
  subtitle!: string; // e.g., "Royal Palace Exploration"

  @IsString()
  slug!: string; // e.g., "ancient-kingdom-sigiriya"

  @IsString()
  summary!: string; // Short Lead Summary

  // Package Image Reference
  @IsUrl()
  imageUrl!: string; // e.g., "https://your-media-db.com/images/sigiriya-hero.jpg"

  // Category & Location
  @IsString()
  tourType!: string; // e.g., "Multi-Day Tour"

  @IsString()
  category!: string; // e.g., "Cultural"

  @IsString()
  startingOrigin!: string; // e.g., "From Colombo"

  // Pricing & Badges
  @IsNumber()
  @Min(0)
  price!: number; // e.g., 299

  @IsNumber()
  @Min(0)
  @Max(100)
  discount!: number; // e.g., 0 (percentage)

  @IsString()
  duration!: string; // e.g., "3 Days"

  @IsOptional()
  @IsString()
  badge?: string; // e.g., "No Badge", "Popular", "Bestseller"

  // Package Highlights & Description
  @IsArray()
  @IsString({ each: true })
  highlights!: string[]; // Array of highlight points

  @IsString()
  description!: string; // Full narrative description
}