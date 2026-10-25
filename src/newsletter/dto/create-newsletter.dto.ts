import { IsEmail, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateNewsletterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsOptional()
  @IsUUID('4', { message: 'Invalid user ID format' })
  userId?: string;
}