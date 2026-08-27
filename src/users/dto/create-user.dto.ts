import { IsBoolean, IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  firstname!: string;

  @IsString()
  lastname!: string;

  @IsEmail()
  email!: string;

  @IsString()
  country!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsBoolean()
  terms!: boolean;
}