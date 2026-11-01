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

// Helpers
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
  titleEn!: string;

  @IsString()
  descriptionEn!: string;

  @IsOptional()
  @IsString()
  titleJa?: string;

  @IsOptional()
  @IsString()
  descriptionJa?: string;
}

export class ItineraryItemDto {
  @Type(() => Number)
  @IsNumber()
  day!: number;

  @IsString()
  travelTime!: string;

  @IsString()
  titleEn!: string;

  @IsArray()
  @IsString({ each: true })
  locationsEn!: string[];

  @IsArray()
  @IsString({ each: true })
  routeEn!: string[];

  @IsArray()
  @IsString({ each: true })
  detailsEn!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scenicStopsEn?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activitiesEn?: string[];

  @IsArray()
  @IsString({ each: true })
  mealsEn!: string[];

  @IsArray()
  @IsString({ each: true })
  accommodationEn!: string[];

  // ── Japanese additions ──
  @IsOptional() @IsString() titleJa?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) locationsJa?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) routeJa?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) detailsJa?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) scenicStopsJa?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) activitiesJa?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) mealsJa?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) accommodationJa?: string[];
}

export class DestinationItemDto {
  @IsUUID()
  id!: string;

  @IsString()
  slug!: string;
}

// --- MAIN DTO ---

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

  @Transform(({ value }) => parseAndMap(value, DestinationItemDto))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DestinationItemDto)
  destinations!: DestinationItemDto[];

  // ═══════════════════════════════════════════════════════════
  // Localized Fields
  // ═══════════════════════════════════════════════════════════

  // ── English (Required) ──
  @IsString() titleEn!: string;
  @IsString() titleEmphasisEn!: string;
  @IsString() leadTitleEn!: string;
  @IsString() leadDescriptionEn!: string;
  @IsString() descriptionEn!: string;

  @Transform(({ value }) => parseJsonArray(value))
  @IsArray()
  @IsString({ each: true })
  highlightsEn!: string[];

  @Transform(({ value }) => parseJsonArray(value))
  @IsArray()
  @IsString({ each: true })
  includesEn!: string[];

  @Transform(({ value }) => parseJsonArray(value))
  @IsArray()
  @IsString({ each: true })
  excludesEn!: string[];

  // ── Japanese (Optional) ──
  @IsOptional() @IsString() titleJa?: string;
  @IsOptional() @IsString() titleEmphasisJa?: string;
  @IsOptional() @IsString() leadTitleJa?: string;
  @IsOptional() @IsString() leadDescriptionJa?: string;
  @IsOptional() @IsString() descriptionJa?: string;

  @IsOptional()
  @Transform(({ value }) => parseJsonArray(value))
  @IsArray()
  @IsString({ each: true })
  highlightsJa?: string[];

  @IsOptional()
  @Transform(({ value }) => parseJsonArray(value))
  @IsArray()
  @IsString({ each: true })
  includesJa?: string[];

  @IsOptional()
  @Transform(({ value }) => parseJsonArray(value))
  @IsArray()
  @IsString({ each: true })
  excludesJa?: string[];
}