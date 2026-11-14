export class ServicePricingResponseDto {
  id?: string;
  serviceType!: string;
  titleBase!: Record<string, string>;
  titleAccent!: Record<string, string>;
  subtitleStrong!: Record<string, string>;
  subtitle!: Record<string, string>;
  popularBadge!: Record<string, string>;
  popularTitle!: Record<string, string>;
  popularDesc!: Record<string, string>;
  notes!: Record<string, string[]>;
  createdAt?: Date;
  updatedAt?: Date;
}
