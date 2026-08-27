import { IsString, IsEmail, IsDate } from 'class-validator';

export class UserResponseDto {
  @IsString()
  id!: string;

  @IsString()
  firstname!: string;

  @IsString()
  lastname!: string;

  @IsEmail()
  email!: string;

  @IsString()
  country!: string;

  @IsDate()
  createdAt!: Date;
}