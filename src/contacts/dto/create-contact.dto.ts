import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName!: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone!: string;

  @IsString()
  @IsNotEmpty({ message: 'Inquiry type is required' })
  inquiryType!: string;

  @IsString()
  @IsNotEmpty({ message: 'Subject is required' })
  subject!: string;

  @IsString()
  @IsNotEmpty({ message: 'Message is required' })
  message!: string;

  @IsOptional()
  @IsString()
  tourInterest?: string;
}