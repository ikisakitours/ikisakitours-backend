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
  IsObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum PackageType {
  ONE_DAY = 'oneday',
  MULTI_DAY = 'multiday',
}

export enum PackageBadge {
  NEW_ARRIVAL = 'new_arrival',
  DISCOUNTED = 'discounted',
  POPULAR = 'popular',
  FEATURED = 'featured',
}

// Helpers for parsing form-data strings or JSON objects
const parseJsonRecord = (value: any): Record<string, any> => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return typeof value === 'object' && value !== null ? value : {};
};

const parseJsonArray = (value: any) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return Array.isArray(value) ? value : [];
};

const parseAndMap = <T extends object>(value: any, dtoClass: new () => T): T[] => {
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) => Object.assign(new dtoClass(), item));
};

// --- SUB DTOs ---

export class ActivityDetailDto {
  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  title!: Record<string, string>;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  description!: Record<string, string>;
}

export class ItineraryItemDto {
  @Type(() => Number)
  @IsNumber()
  day!: number;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  travelTime!: Record<string, string>;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  title!: Record<string, string>;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  locations!: Record<string, string[]>;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  route!: Record<string, string[]>;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  details!: Record<string, string[]>;

  @IsOptional()
  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  scenicStops?: Record<string, string[]>;

  @IsOptional()
  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  activities?: Record<string, string[]>;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  meals!: Record<string, string>;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  accommodation!: Record<string, string>;
}

export class DestinationItemDto {
  @IsUUID()
  id!: string;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  title!: Record<string, string>;

  @IsString()
  slug!: string;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  summary!: Record<string, string>;

  @IsOptional()
  @IsUrl()
  heroImage?: string | null;

  @IsOptional()
  @IsObject()
  coordinates?: { lat: number; lng: number };
}

// --- MAIN DTO ---

export class CreateAddPackageDto {
  @IsEnum(PackageType)
  type!: PackageType;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  category!: Record<string, string>;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  origin!: Record<string, string>;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  duration!: Record<string, string>;

  @IsOptional()
  @IsEnum(PackageBadge)
  badge?: PackageBadge;

  @IsString()
  slug!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;

  @IsString()
  provider!: string;

  @IsOptional()
  @Transform(({ value }) => parseJsonArray(value))
  @IsArray()
  @IsUrl({}, { each: true })
  gallery?: string[];

  // ═══════════════════════════════════════════════════════════
  // Multilingual JSONB Text Fields & Arrays
  // ═══════════════════════════════════════════════════════════

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  title!: Record<string, string>;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  titleEmphasis!: Record<string, string>;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  leadTitle!: Record<string, string>;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  leadDescription!: Record<string, string>;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  description!: Record<string, string>;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  highlights!: Record<string, string[]>;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  includes!: Record<string, string[]>;

  @Transform(({ value }) => parseJsonRecord(value))
  @IsObject()
  excludes!: Record<string, string[]>;

  // ═══════════════════════════════════════════════════════════
  // Complex Sub-Structures (Destinations, Activities, Itinerary)
  // ═══════════════════════════════════════════════════════════

  @Transform(({ value }) => parseAndMap(value, DestinationItemDto))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DestinationItemDto)
  destinations!: DestinationItemDto[];

  @Transform(({ value }) => parseAndMap(value, ActivityDetailDto))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityDetailDto)
  activityDetails!: ActivityDetailDto[];

  @Transform(({ value }) => parseAndMap(value, ItineraryItemDto))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryItemDto)
  itinerary!: ItineraryItemDto[];
}