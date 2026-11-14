import { IsString, IsObject, IsOptional, IsIn } from 'class-validator';

export class UpdateServicePricingDto {
  @IsString()
  @IsOptional()
  @IsIn(['charter', 'custom', 'transfer'])
  serviceType?: string;

  @IsObject()
  @IsOptional()
  titleBase?: Record<string, string>;

  @IsObject()
  @IsOptional()
  titleAccent?: Record<string, string>;

  @IsObject()
  @IsOptional()
  subtitleStrong?: Record<string, string>;

  @IsObject()
  @IsOptional()
  subtitle?: Record<string, string>;

  @IsObject()
  @IsOptional()
  popularBadge?: Record<string, string>;

  @IsObject()
  @IsOptional()
  popularTitle?: Record<string, string>;

  @IsObject()
  @IsOptional()
  popularDesc?: Record<string, string>;

  @IsObject()
  @IsOptional()
  notes?: Record<string, string[]>;
}
