import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateServiceNotesDto {
  @IsString()
  @IsOptional()
  serviceType?: string;

  @IsString()
  @IsOptional()
  vehicleType?: string;

  @IsString()
  @IsOptional()
  startingPrice?: string;

  @IsString()
  @IsOptional()
  vehicleCapacity?: string;

  @IsString()
  @IsOptional()
  luggages?: string;

  @IsString()
  @IsOptional()
  withDriverPrice?: string;

  @IsString()
  @IsOptional()
  withGuidePrice?: string;

  @IsString()
  @IsOptional()
  withDriverAndGuidePrice?: string;

  @IsObject()
  @IsOptional()
  notes?: Record<string, string[]>;
}