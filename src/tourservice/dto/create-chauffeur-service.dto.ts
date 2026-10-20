import { IsString, IsNotEmpty, IsEmail, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TravelersDto } from './travelers.dto';

export class CreateChauffeurServiceDto {
  @IsString()
  @IsNotEmpty()
  vehicleType!: string;

  @IsString()
  @IsNotEmpty()
  tourPackageType!: string;

  @IsString()
  @IsNotEmpty()
  pickupLocation!: string;

  @IsString()
  @IsNotEmpty()
  language!: string;

  @IsString()
  @IsNotEmpty()
  journeyDate!: string;

  @IsString()
  @IsNotEmpty()
  pickupTime!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => TravelersDto)
  travelers!: TravelersDto;

  @IsString()
  @IsNotEmpty()
  tourDuration!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsString()
  @IsOptional()
  specialRequests?: string;
}