import { IsOptional, IsString } from 'class-validator';

export class UpdateAdminProfileDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  oldAvatarUrl?: string;
}
