import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  blog!: string; // Main blog content

  @IsString()
  @IsNotEmpty()
  author!: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[]; // Validates array of Cloudflare R2 URLs
}