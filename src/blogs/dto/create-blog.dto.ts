import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export enum BlogLanguage {
  ENGLISH = 'en',
  JAPANESE = 'ja',
  FRENCH = 'fr',
}

export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @IsNotEmpty()
  summary!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsNotEmpty()
  readTime!: string;

  @IsString()
  @IsNotEmpty()
  blog!: string;

  @IsString()
  @IsNotEmpty()
  author!: string;

  @IsEnum(BlogLanguage)
  @IsNotEmpty()
  language!: BlogLanguage;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];
}