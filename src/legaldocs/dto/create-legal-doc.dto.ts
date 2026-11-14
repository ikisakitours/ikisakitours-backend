import { IsString, IsNotEmpty, IsObject, IsOptional, IsArray } from 'class-validator';

export class CreateLegalDocDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsObject()
  @IsNotEmpty()
  title!: Record<string, string>;

  @IsObject()
  @IsOptional()
  eyebrow?: Record<string, string>;

  @IsString()
  @IsOptional()
  accent?: string;

  @IsString()
  @IsNotEmpty()
  lastUpdated!: string;

  @IsArray()
  @IsNotEmpty()
  sections!: any[];
}
