import { IsString, IsEmail, IsNumber, IsOptional } from 'class-validator';

export class TourServiceResponseDto {
  @IsString()
  id!: string;

  @IsString()
  serviceType!: string

  @IsString()
  status!: string;

  @IsString()
  clientName!: string;

  @IsEmail()
  clientEmail!: string;

  @IsString()
  clientPhone!: string;

  @IsString()
  dates!: string;

  @IsNumber()
  groupSize!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}