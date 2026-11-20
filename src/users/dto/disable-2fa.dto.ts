import { IsOptional, IsString } from 'class-validator';

export class DisableCustomer2FaDto {
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  totpCode?: string;
}

export { DisableCustomer2FaDto as Disable2FaDto };
