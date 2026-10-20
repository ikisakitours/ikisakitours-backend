import { IsString, IsNotEmpty, IsEmail, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TravelersDto } from './travelers.dto';

export class CreateTransferServiceDto {
  @IsString()
  @IsNotEmpty()
  serviceType!: string; // airport pickup, hotel and city, airport drop off

  @IsString()
  @IsNotEmpty()
  vehicleType!: string;

  @IsString()
  @IsNotEmpty()
  pickupLocation!: string;

  @IsString()
  @IsNotEmpty()
  dropOffLocation!: string; // Unique to transfers

  @IsString()
  @IsNotEmpty()
  journeyDate!: string;

  @IsString()
  @IsNotEmpty()
  pickupTime!: string;

  @IsString()
  @IsNotEmpty()
  language!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => TravelersDto)
  travelers!: TravelersDto;

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