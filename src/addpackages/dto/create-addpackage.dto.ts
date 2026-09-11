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
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum PackageType {
  ONE_DAY = 'oneday',
  MULTI_DAY = 'multiday',
}

// Helper to safely parse JSON strings and preserve plain object properties
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

// --- SUB DTOs ---

export class ActivityDetailDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;
}

export class ItineraryItemDto {
  @Type(() => Number)
  @IsNumber()
  day!: number;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @Transform(({ value }) => parseJsonArray(value))
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];
}

export class DestinationItemDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => parseJsonArray(value))
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];
}

// --- MAIN DTO ---

export class CreateAddPackageDto {
  @IsEnum(PackageType)
  type!: PackageType;

  @IsString()
  slug!: string;

  @IsString()
  titleEmphasis!: string;

  @IsString()
  title!: string;

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

  @IsString()
  leadTitle!: string;

  @IsString()
  leadDescription!: string;

  @IsOptional()
  @Transform(({ value }) => parseJsonArray(value))
  @IsArray()
  @IsUrl({}, { each: true })
  gallery?: string[];

  // FIX: Maps parsed JSON to ActivityDetailDto instances with all keys preserved
  @Transform(({ value }) => parseAndMap(value, ActivityDetailDto))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityDetailDto)
  activityDetails!: ActivityDetailDto[];

  @Transform(({ value }) => parseJsonArray(value))
  @IsArray()
  @IsString({ each: true })
  highlights!: string[];

  @IsString()
  description!: string;

  // FIX: Maps parsed JSON to ItineraryItemDto instances with all keys preserved
  @Transform(({ value }) => parseAndMap(value, ItineraryItemDto))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryItemDto)
  itinerary!: ItineraryItemDto[];

  // FIX: Maps parsed JSON to DestinationItemDto instances with all keys preserved
  @Transform(({ value }) => parseAndMap(value, DestinationItemDto))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DestinationItemDto)
  destinations!: DestinationItemDto[];

  @Transform(({ value }) => parseJsonArray(value))
  @IsArray()
  @IsString({ each: true })
  includes!: string[];

  @Transform(({ value }) => parseJsonArray(value))
  @IsArray()
  @IsString({ each: true })
  excludes!: string[];
}