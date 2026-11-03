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
  driverOption!: string;

  @IsObject()
  @IsNotEmpty()
  notes!: Record<string, string[]>;
}