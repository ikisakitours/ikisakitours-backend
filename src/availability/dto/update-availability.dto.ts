import { IsArray, IsString } from 'class-validator';

export class UpdateAvailabilityDto {
  @IsArray()
  @IsString({ each: true })
  apiClosedDates!: string[];
}