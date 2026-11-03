import { IsString, IsNotEmpty, IsObject } from 'class-validator';

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
  @IsNotEmpty()
  withDriverPrice!: string;

  @IsString()
  @IsNotEmpty()
  withGuidePrice!: string;

  @IsString()
  @IsNotEmpty()
  withDriverAndGuidePrice!: string;

  @IsObject()
  @IsNotEmpty()
  notes!: Record<string, string[]>;
}