import { IsString, IsOptional, IsObject } from 'class-validator';

export class ServiceResponseDto {
  @IsString()
  id!: string;

  @IsString()
  referenceId!: string;

  @IsString()
  serviceCategory!: string;

  @IsOptional()
  @IsString()
  transferServiceType?: string | null;

  @IsString()
  vehicleType!: string;

  @IsOptional()
  @IsString()
  tourPackageType?: string | null;

  @IsString()
  pickupLocation!: string;

  @IsOptional()
  @IsString()
  dropOffLocation?: string | null;

  @IsString()
  language!: string;

  @IsString()
  journeyDate!: string;

  @IsString()
  pickupTime!: string;

  @IsObject()
  travelers!: {
    adults: number;
    couples: number;
    children: number;
    infants: number;
  };

  @IsOptional()
  @IsString()
  tourDuration?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  startingPrice?: string | null;

  @IsOptional()
  @IsString()
  selectedPrice?: string | null;

  @IsString()
  fullName!: string;

  @IsString()
  email!: string;

  @IsString()
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  specialRequests?: string | null;

  @IsString()
  status!: string;

  createdAt!: Date;
  updatedAt!: Date;
}
