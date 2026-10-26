import { IsString } from 'class-validator';

export class FaqResponseDto {
  @IsString()
  id!: string;

  @IsString()
  category!: string;

  @IsString()
  question!: string;

  @IsString()
  answer!: string;
}