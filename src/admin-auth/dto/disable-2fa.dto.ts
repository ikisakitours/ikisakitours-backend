import { IsNotEmpty, IsString } from 'class-validator';

export class Disable2FaDto {
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword!: string;
}
