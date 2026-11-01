import { IsUUID, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class AddPackageResponseDto {
  @IsUUID()
  id!: string;

  @IsString()
  slug!: string;

  @IsString()
  message!: string;

  @IsDate()
  @Type(() => Date)
  createdAt!: Date;
}