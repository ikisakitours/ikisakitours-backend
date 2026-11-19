import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { AdminRole } from '../../admin-auth/roles.enum';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName!: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @IsEnum(AdminRole, {
    message: `Role must be one of: ${Object.values(AdminRole).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Role is required' })
  role!: AdminRole;
}
