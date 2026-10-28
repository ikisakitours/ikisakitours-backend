import { IsString, IsNotEmpty, IsDateString, ValidateNested, IsEmail, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TravelersDto } from './travelers.dto';
import { PackageType } from './package-type.enum';

export class CreatePackageBookingDto {
  @IsString()
  @IsNotEmpty()
  packageId!: string;

  @IsString()
  @IsNotEmpty()
  packageName!: string;

  @IsDateString()
  journeyDate!: string;

  @ValidateNested()
  @Type(() => TravelersDto)
  travelers!: TravelersDto;

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

  @IsEnum(PackageType)
  type!: PackageType;
}