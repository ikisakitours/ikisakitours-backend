import { IsString, IsEmail, IsNumber, IsOptional } from 'class-validator';

export class TourResponseDto {
  @IsString()
  id!: string;

  @IsString()
  tourType!: string;

  @IsString()
  status!: string;

  @IsString()
  clientName!: string;

  @IsEmail()
  clientEmail!: string;

  @IsString()
  clientPhone!: string;

  @IsString()
  travelDate!: string;

  @IsNumber()
  groupSize!: number;

  @IsString()
  packageName!: string;

  @IsOptional()
  @IsString()
  clientNotes?: string;
}