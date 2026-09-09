import { IsString, IsUUID, IsDate } from 'class-validator';
import { CreateAddPackageDto } from './create-addpackage.dto';

export class AddPackageResponseDto extends CreateAddPackageDto {
  @IsUUID()
  id!: string;

  @IsDate()
  createdAt!: Date;
}