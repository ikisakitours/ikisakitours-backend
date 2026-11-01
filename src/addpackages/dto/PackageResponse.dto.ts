import {
  IsString,
  IsNumber,
  IsUrl,
  IsArray,
  IsOptional,
  IsEnum,
  Min,
  Max,
  ValidateNested,
  IsUUID,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PackageType {
  ONE_DAY = 'oneday',
  MULTI_DAY = 'multiday',
}

// Badge enum
export enum PackageBadge {
  NEW_ARRIVAL = 'new_arrival',
  DISCOUNTED = 'discounted',
  POPULAR = 'popular',
  FEATURED = 'featured',
}

// --- SUB DTOs ---

export class ActivityDetailDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  // ── Localized additions ──
  @IsOptional()
  @IsString()
  titleJa?: string;

  @IsOptional()
  @IsString()
  descriptionJa?: string;
}

export class ItineraryItemDto {
  @IsNumber()
  day!: number;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  // ── Localized additions ──
  @IsOptional()
  @IsString()
  titleJa?: string;

  @IsOptional()
  @IsString()
  descriptionJa?: string;
}

export class DestinationItemDto {
  @IsUUID()
  id!: string;

  @IsString()
  slug!: string;
}

// --- BASE PACKAGE DTO ---

export class CreateAddPackageDto {
  @IsEnum(PackageType)
  type!: PackageType;

  @IsString()
  category!: string;

  @IsString()
  origin!: string;

  @IsString()
  duration!: string;

  @IsOptional()
  @IsEnum(PackageBadge)
  badge?: PackageBadge;

  @IsString()
  slug!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;

  @IsString()
  provider!: string;

  @IsArray()
  @IsUrl({}, { each: true })
  gallery!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityDetailDto)
  activityDetails!: ActivityDetailDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryItemDto)
  itinerary!: ItineraryItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DestinationItemDto)
  destinations!: DestinationItemDto[];

  // ── Localized English Fields (Required) ──
  
  @IsString()
  titleEn!: string;

  @IsString()
  titleEmphasisEn!: string;

  @IsString()
  leadTitleEn!: string;

  @IsString()
  leadDescriptionEn!: string;

  @IsString()
  descriptionEn!: string;

  @IsArray()
  @IsString({ each: true })
  highlightsEn!: string[];

  @IsArray()
  @IsString({ each: true })
  includesEn!: string[];

  @IsArray()
  @IsString({ each: true })
  excludesEn!: string[];

  // ── Localized Japanese Fields (Optional) ──

  @IsOptional() @IsString() titleJa?: string;
  @IsOptional() @IsString() titleEmphasisJa?: string;
  @IsOptional() @IsString() leadTitleJa?: string;
  @IsOptional() @IsString() leadDescriptionJa?: string;
  @IsOptional() @IsString() descriptionJa?: string;

  @IsOptional() @IsArray() @IsString({ each: true }) highlightsJa?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) includesJa?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) excludesJa?: string[];
}

// --- ULTIMATE SINGLE PACKAGE RESPONSE DTO ---

export class PackageResponseDto extends CreateAddPackageDto {
  @IsUUID()
  id!: string;

  @IsNumber()
  @Min(0)
  likes!: number;

  @IsDate()
  @Type(() => Date)
  createdAt!: Date;

  @IsDate()
  @Type(() => Date)
  updatedAt!: Date;
}