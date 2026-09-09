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
import { Type, Transform } from 'class-transformer'; // ADDED: Transform imported from class-transformer

export enum PackageType {
  ONE_DAY = 'oneday',
  MULTI_DAY = 'multiday',
}

// ADDED: Helper function to safely parse JSON strings sent via FormData
const parseJson = (value: any) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

// --- SUB DTOs DEFINED FIRST ---

export class ActivityDetailDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;
}

export class ItineraryItemDto {
  @Type(() => Number) // ADDED: Converts string "1" from FormData into number 1 for sub-item validation
  @IsNumber()
  day!: number;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @Transform(({ value }) => parseJson(value)) // ADDED: Parses nested JSON string arrays if passed inside FormData
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
  @Transform(({ value }) => parseJson(value)) // ADDED: Parses nested JSON string arrays if passed inside FormData
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

  @Type(() => Number) // ADDED: Converts FormData string "450" to numeric 450 before @IsNumber check
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @Type(() => Number) // ADDED: Converts FormData string "10" to numeric 10 before @IsNumber check
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
  @Transform(({ value }) => parseJson(value)) // ADDED: Parses stringified JSON array into native Array
  @IsArray()
  @IsUrl({}, { each: true })
  gallery?: string[];

  @Transform(({ value }) => parseJson(value)) // ADDED: Parses JSON string before @IsArray & @ValidateNested run
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityDetailDto)
  activityDetails!: ActivityDetailDto[];

  @Transform(({ value }) => parseJson(value)) // ADDED: Parses JSON string into native string[] array
  @IsArray()
  @IsString({ each: true })
  highlights!: string[];

  @IsString()
  description!: string;

  @Transform(({ value }) => parseJson(value)) // ADDED: Parses JSON string before @IsArray & @ValidateNested run
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryItemDto)
  itinerary!: ItineraryItemDto[];

  @Transform(({ value }) => parseJson(value)) // ADDED: Parses JSON string before @IsArray & @ValidateNested run
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DestinationItemDto)
  destinations!: DestinationItemDto[];

  @Transform(({ value }) => parseJson(value)) // ADDED: Parses JSON string into native string[] array
  @IsArray()
  @IsString({ each: true })
  includes!: string[];

  @Transform(({ value }) => parseJson(value)) // ADDED: Parses JSON string into native string[] array
  @IsArray()
  @IsString({ each: true })
  excludes!: string[];
}