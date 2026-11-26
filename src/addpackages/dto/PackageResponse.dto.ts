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
import type { PricingConfig, PricingNoteItem } from '../../database/schema';

export enum PackageType {
  ONE_DAY = 'oneday',
  MULTI_DAY = 'multiday',
}

// Badge enum
export enum PackageBadge {
  BEST_SELLER = 'best_seller',
  TOP_RATED = 'top_rated',
  POPULAR = 'popular',
  FEATURED = 'featured',
  NEW_ARRIVAL = 'new_arrival',
  EXCLUSIVE = 'exclusive',
  LIMITED_AVAILABILITY = 'limited_availability',
  LIKELY_TO_SELL_OUT = 'likely_to_sell_out',
  INSTANT_CONFIRMATION = 'instant_confirmation',
  BUCKET_LIST = 'bucket_list',
  ALL_INCLUSIVE = 'all_inclusive',
  FAMILY_FRIENDLY = 'family_friendly',
  HONEYMOON_SPECIAL = 'honeymoon_special',
  UNESCO_HERITAGE = 'unesco_heritage',
  PRIVATE_TOUR = 'private_tour',
  SEASONAL = 'seasonal',
  ECO_FRIENDLY = 'eco_friendly',
  DISCOUNTED = 'discounted',
  NONE = 'none',
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
  meals?: Record<string, string[] | string> | string[];

  @IsOptional()
  accommodation?: Record<string, string[] | string> | string[];
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
  @IsString()
  badge?: string;

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

  // ── Unified Dynamic Group Pricing & Custom Add-ons ──
  @IsOptional()
  @IsObject()
  pricingConfig?: PricingConfig | null;

  @IsOptional()
  @IsArray()
  pricingNotes?: PricingNoteItem[];
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
