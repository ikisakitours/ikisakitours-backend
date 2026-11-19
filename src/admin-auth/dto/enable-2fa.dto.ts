import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class Enable2FaDto {
  @IsString()
  @IsNotEmpty({ message: 'TOTP code is required' })
  totpCode!: string;

  @IsString()
  @IsOptional()
  secret?: string;
}
