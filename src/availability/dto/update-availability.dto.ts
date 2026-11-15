import { IsArray, IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateAvailabilityDto {
  @IsArray()
  @IsString({ each: true })
  apiClosedDates!: string[];

  @IsOptional()
  @IsObject()
  dateDetails?: Record<string, any>;

  @IsOptional()
  @IsArray()
  closedDateDetails?: any[];
}
