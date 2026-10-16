import { IsArray, IsNotEmpty, IsOptional, IsString, IsObject, IsUrl } from 'class-validator';

export class CreateDestinationDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @IsNotEmpty()
  summary!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  province!: string;

  @IsArray()
  @IsString({ each: true })
  highlights!: string[];

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @IsString()
  @IsNotEmpty()
  bestTimeToVisit!: string;

  @IsString()
  @IsNotEmpty()
  climate!: string;

  @IsString()
  @IsNotEmpty()
  primaryLanguage!: string;

  @IsString()
  @IsNotEmpty()
  localCurrency!: string;

  @IsObject()
  coordinates!: {
    lat: number;
    lng: number;
  };
}