import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateStaffStatusDto {
  @IsBoolean()
  @IsNotEmpty({ message: 'isActive status is required' })
  isActive!: boolean;
}
