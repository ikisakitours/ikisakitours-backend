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
  IsObject,
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
  @IsObject()
  title!: Record<string, string>;

  @IsObject()
  description!: Record<string, string>;
}

export class ItineraryItemDto {
  @IsNumber()
  day!: number;

  @IsObject()
  title!: Record<string, string>;

  @IsObject()
  description!: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @IsOptional()
  @IsObject()
  travelTime?: Record<string, string>;

  @IsOptional()
  @IsObject()
  locations?: Record<string, string[]>;

  @IsOptional()
  @IsObject()
  route?: Record<string, string[]>;

  @IsOptional()
  @IsObject()
  details?: Record<string, string[]>;

  @IsOptional()
  @IsObject()
  scenicStops?: Record<string, string[]>;

  @IsOptional()
  @IsObject()
  activities?: Record<string, string[]>;

  @IsOptional()
  @IsObject()
  meals?: Record<string, string>;

  @IsOptional()
  @IsObject()
  accommodation?: Record<string, string>;
}

export class DestinationItemDto {
  @IsUUID()
  id!: string;

  @IsObject()
  title!: Record<string, string>;

  @IsString()
  slug!: string;

  @IsObject()
  summary!: Record<string, string>;

  @IsOptional()
  @IsUrl()
  heroImage?: string | null;

  @IsOptional()
  @IsObject()
  coordinates?: { lat: number; lng: number };
}

// --- BASE PACKAGE DTO ---

export class CreateAddPackageDto {
  @IsEnum(PackageType)
  type!: PackageType;

  @IsObject()
  category!: Record<string, string>;

  @IsObject()
  origin!: Record<string, string>;

  @IsObject()
  duration!: Record<string, string>;

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

  // ── Multilingual JSONB Text Fields ──
  @IsObject()
  title!: Record<string, string>;

  @IsObject()
  titleEmphasis!: Record<string, string>;

  @IsObject()
  leadTitle!: Record<string, string>;

  @IsObject()
  leadDescription!: Record<string, string>;

  @IsObject()
  description!: Record<string, string>;

  // ── Multilingual JSONB Arrays ──
  @IsObject()
  highlights!: Record<string, string[]>;

  @IsObject()
  includes!: Record<string, string[]>;

  @IsObject()
  excludes!: Record<string, string[]>;
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