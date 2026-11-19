import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateContactStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: string;
}
