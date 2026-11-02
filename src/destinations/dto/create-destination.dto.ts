import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsUrl,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CoordinatesDto {
  @IsNumber()
  @IsNotEmpty()
  lat!: number;

  @IsNumber()
  @IsNotEmpty()
  lng!: number;
}

export class CreateDestinationDto {
  // --- Translatable Fields (JSONB: Record<string, string>) ---

  @IsObject()
  @IsNotEmpty()
  title!: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  summary!: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  description!: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  province!: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  bestTimeToVisit!: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  climate!: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  primaryLanguage!: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  localCurrency!: Record<string, string>;

  // Translatable highlights: Record<string, string[]>
  // Example: { "en": ["Highlight 1", "Highlight 2"], "ja": ["ハイライト1", "ハイライト2"] }
  @IsObject()
  @IsNotEmpty()
  highlights!: Record<string, string[]>;

  // --- Shared Metadata Across Languages ---

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @IsObject()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates!: CoordinatesDto;
}