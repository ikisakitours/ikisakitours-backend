import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateFaqDto {
  @IsString()
  @IsNotEmpty()
  topic!: string;

  @IsObject()
  @IsNotEmpty()
  question!: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  answer!: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsUUID()
  missedQuestionId?: string;
}