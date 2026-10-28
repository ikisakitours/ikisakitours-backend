import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserStatusDto {
  @IsOptional()
  @IsBoolean()
  isVip?: boolean;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  hasAccess?: boolean;
}