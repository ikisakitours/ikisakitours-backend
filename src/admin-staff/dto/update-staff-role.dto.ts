import { IsEnum, IsNotEmpty } from 'class-validator';
import { AdminRole } from '../../admin-auth/roles.enum';

export class UpdateStaffRoleDto {
  @IsEnum(AdminRole, {
    message: `Role must be one of: ${Object.values(AdminRole).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Role is required' })
  role!: AdminRole;
}
