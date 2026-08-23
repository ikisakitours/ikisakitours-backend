import { CreateAddPackageDto } from './create-addpackage.dto';

export class AddPackageResponseDto extends CreateAddPackageDto {
  id!: string; // e.g., "pkg_101"
  createdAt!: string; // Timestamp
}