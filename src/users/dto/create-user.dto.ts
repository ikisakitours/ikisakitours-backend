import { IsBoolean, IsEmail, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

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

  @IsOptional()
  @IsUrl({}, { message: 'avatarUrl must be a valid URL string' })
  avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  isVip?: boolean;

  @IsOptional()
  @IsBoolean()
  hasAccess?: boolean;
}