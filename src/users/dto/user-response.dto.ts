import { IsString, IsEmail } from 'class-validator';

export class UserResponseDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  role!: string;

  @IsString()
  createdAt!: string;
}