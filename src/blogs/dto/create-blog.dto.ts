import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export enum BlogLanguage {
  ENGLISH = 'en',
  JAPANESE = 'ja',
  RUSSIAN = 'ru',
  FRENCH = 'fr',
}

export class CreateBlogDto {
  @IsString()
  @IsOptional()
  slug?: string;

  // Since title, summary, readTime, and blog are now JSONB objects 
  @IsObject()
  @IsNotEmpty()
  title!: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  summary!: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  category!: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  readTime!: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  blog!: Record<string, string>;

  @IsString()
  @IsNotEmpty()
  author!: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];
}