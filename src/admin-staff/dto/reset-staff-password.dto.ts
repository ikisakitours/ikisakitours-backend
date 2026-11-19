import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetStaffPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword!: string;
}
