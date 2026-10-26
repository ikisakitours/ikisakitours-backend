import { IsString, IsEmail, IsOptional } from 'class-validator';

export class ContactResponseDto {
  @IsString()
  id!: string;

  @IsString()
  inquiryType!: string;

  @IsString()
  date!: string;

  @IsString()
  status!: string;

  @IsString()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  subject!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  tourInterest?: string;
}