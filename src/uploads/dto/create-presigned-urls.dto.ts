import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PresignedFileItemDto {
  @IsString()
  filename!: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsString()
  folder?: string;
}

export class CreatePresignedUrlsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Please provide at least one file to upload.' })
  @ArrayMaxSize(20, {
    message: 'You can upload a maximum of 20 images at once.',
  })
  @ValidateNested({ each: true })
  @Type(() => PresignedFileItemDto)
  files!: PresignedFileItemDto[];
}
