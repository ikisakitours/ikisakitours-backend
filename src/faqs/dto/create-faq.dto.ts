import { IsString, IsNotEmpty } from 'class-validator';

export class CreateFaqDto {
  @IsString()
  @IsNotEmpty({ message: 'Category is required' })
  category!: string;

  @IsString()
  @IsNotEmpty({ message: 'Question is required' })
  question!: string;

  @IsString()
  @IsNotEmpty({ message: 'Answer is required' })
  answer!: string;
}