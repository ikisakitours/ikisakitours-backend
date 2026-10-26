import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteAccountDto {
 @IsString()
  @IsIn(['password', 'text'], { message: 'deleteMethod must be either password or text' })
  deleteMethod!: 'password' | 'text';

  @IsString()
  @IsNotEmpty({ message: 'Value is required to confirm deletion' })
  value!: string;
}
