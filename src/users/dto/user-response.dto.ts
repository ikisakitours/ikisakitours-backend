import { IsString, IsEmail, IsDate, IsBoolean, IsOptional } from 'class-validator';

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

  @IsOptional()
  @IsString()
  avatarUrl!: string | null;

  @IsBoolean()
  isVerified!: boolean;

  @IsBoolean()
  isVip!: boolean;

  @IsBoolean()
  hasAccess!: boolean;

  @IsDate()
  createdAt!: Date;
}