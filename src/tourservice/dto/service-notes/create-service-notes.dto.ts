import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateServiceNotesDto {
  @IsString()
  @IsNotEmpty()
  serviceType!: string;

  @IsString()
  @IsNotEmpty()
  vehicleType!: string;

  @IsString()
  @IsNotEmpty()
  startingPrice!: string;

  @IsString()
  @IsNotEmpty()
  vehicleCapacity!: string;

  @IsString()
  @IsNotEmpty()
  luggages!: string;

  @IsString()
  @IsOptional()
  withDriverPrice?: string | null;

  @IsString()
  @IsOptional()
  withGuidePrice?: string | null;

  @IsString()
  @IsOptional()
  withDriverAndGuidePrice?: string | null;

  @IsObject()
  @IsNotEmpty()
  notes!: Record<string, string[]>;
}
