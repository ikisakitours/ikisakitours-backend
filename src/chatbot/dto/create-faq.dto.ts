import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class LocalizedTextDto {
  @IsString()
  @IsNotEmpty()
  en!: string;

  @IsOptional()
  @IsString()
  ja?: string;
}

export class CreateFaqDto {
  @IsString()
  @IsNotEmpty()
  topic!: string;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  question!: LocalizedTextDto;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  answer!: LocalizedTextDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsUUID()
  missedQuestionId?: string;
}