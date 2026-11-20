import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyTotpChallengeDto {
  @IsString()
  @IsNotEmpty({ message: 'Verification ticket is required' })
  ticket!: string;

  @IsString()
  @IsNotEmpty({ message: 'TOTP verification code is required' })
  totpCode!: string;

  @IsOptional()
  @IsBoolean()
  staySignedIn?: boolean;
}
