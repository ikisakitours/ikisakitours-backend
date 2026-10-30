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

  @IsString()
  titleEmphasis!: string;

  @IsString()
  title!: string;

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

  @IsString()
  leadTitle!: string;

  @IsString()
  leadDescription!: string;

  @IsArray()
  @IsUrl({}, { each: true })
  gallery!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityDetailDto)
  activityDetails!: ActivityDetailDto[];

  @IsArray()
  @IsString({ each: true })
  highlights!: string[];

  @IsString()
  description!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryItemDto)
  itinerary!: ItineraryItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DestinationItemDto)
  destinations!: DestinationItemDto[];

  @IsArray()
  @IsString({ each: true })
  includes!: string[];

  @IsArray()
  @IsString({ each: true })
  excludes!: string[];
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