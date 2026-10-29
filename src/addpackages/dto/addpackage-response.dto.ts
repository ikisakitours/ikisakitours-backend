import { IsString, IsUUID, IsDate, IsNumber, Min } from 'class-validator';
import { CreateAddPackageDto } from './create-addpackage.dto';
import { Type } from 'class-transformer';

export class AddPackageResponseDto extends CreateAddPackageDto {
  @IsUUID()
  id!: string;

  @IsNumber()
  @Min(0)
  likes!: number;

  @IsDate()
  @Type(() => Date)
  createdAt!: Date;

  @IsDate()
  @Type(() => Date)
  updatedAt!: Date;
}