import { IsString, IsNotEmpty, IsObject, IsIn } from 'class-validator';

export class CreateServicePricingDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['charter', 'custom', 'transfer'])
  serviceType!: string;

  @IsObject()
  @IsNotEmpty()
  titleBase!: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  titleAccent!: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  subtitleStrong!: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  subtitle!: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  popularBadge!: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  popularTitle!: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  popularDesc!: Record<string, string>;

  @IsObject()
  @IsNotEmpty()
  notes!: Record<string, string[]>;
}
