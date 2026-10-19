import { IsBoolean, IsNotEmpty, IsObject, IsUUID } from 'class-validator';

export class ConsentPreferencesDto {
  @IsBoolean()
  strictlyNecessary!: boolean;

  @IsBoolean()
  performance!: boolean;

  @IsBoolean()
  functional!: boolean;

  @IsBoolean()
  targetingAndMarketing!: boolean;
}

export class SaveConsentDto {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsObject()
  @IsNotEmpty()
  preferences!: ConsentPreferencesDto;
}