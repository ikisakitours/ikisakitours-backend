import { IsString, IsObject, IsOptional, IsArray } from 'class-validator';

export class UpdateLegalDocDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsObject()
  @IsOptional()
  title?: Record<string, string>;

  @IsObject()
  @IsOptional()
  eyebrow?: Record<string, string>;

  @IsString()
  @IsOptional()
  accent?: string;

  @IsString()
  @IsOptional()
  lastUpdated?: string;

  @IsArray()
  @IsOptional()
  sections?: any[];
}
