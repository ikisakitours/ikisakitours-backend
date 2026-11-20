import { IsNotEmpty, IsString } from 'class-validator';

export class EnableCustomer2FaDto {
  @IsString()
  @IsNotEmpty({ message: 'TOTP verification code is required' })
  totpCode!: string;
}

export { EnableCustomer2FaDto as Enable2FaDto };
