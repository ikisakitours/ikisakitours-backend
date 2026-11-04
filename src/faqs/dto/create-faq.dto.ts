import { IsObject } from 'class-validator';

export class CreateFaqDto {
  @IsObject()
  category!: Record<string, string>;

  @IsObject()
  question!: Record<string, string>;

  @IsObject()
  answer!: Record<string, string>;
}