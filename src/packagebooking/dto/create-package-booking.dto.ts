import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsEmail,
  IsOptional,
  IsNumber,
  IsArray,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TravelersDto } from './travelers.dto';

export class CreatePackageBookingDto {
  @IsString()
  @IsNotEmpty()
  packageId!: string;

  @IsOptional()
  @IsString()
  packageSlug?: string;

  @IsNotEmpty()
  packageName!: string | Record<string, string>;

  @IsOptional()
  @IsString()
  packageType?: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsNotEmpty()
  journeyDate!: string;

  @ValidateNested()
  @Type(() => TravelersDto)
  travelers!: TravelersDto;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalPax?: number;

  @IsOptional()
  @IsArray()
  selectedOptions?: any[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  basePrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  optionsTotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsObject()
  pricingSummary?: Record<string, any>;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  firstname!: string;

  @IsString()
  @IsNotEmpty()
  lastname!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  country!: string;
}