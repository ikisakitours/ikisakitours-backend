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
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PackageType {
  ONE_DAY = 'oneday',
  MULTI_DAY = 'multiday',
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
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];
}

// --- CREATE DTO ---

export class CreateAddPackageDto {
  @IsEnum(PackageType)
  type!: PackageType;

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

// --- COMMENT / REVIEW RESPONSE DTO ---

export class PackageCommentResponseDto {
  @IsUUID()
  id!: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  userName!: string;

  @IsOptional()
  @IsString()
  userAvatar?: string;

  @IsString()
  content!: string;

  @IsString()
  type!: string;

  @IsBoolean()
  isPublic!: boolean;

  @IsOptional()
  @IsString()
  adminReply?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @IsDate()
  @Type(() => Date)
  createdAt!: Date;
}

// --- COMPLETE PACKAGE RESPONSE DTO ---

export class PackageResponseDto extends CreateAddPackageDto {
  @IsUUID()
  id!: string;

  @IsNumber()
  @Min(0)
  @Max(5)
  rating!: number;

  @IsNumber()
  @Min(0)
  likeCount!: number;

  @IsNumber()
  @Min(0)
  reviewCount!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageCommentResponseDto)
  comments!: PackageCommentResponseDto[];

  @IsDate()
  @Type(() => Date)
  createdAt!: Date;

  @IsDate()
  @Type(() => Date)
  updatedAt!: Date;
}