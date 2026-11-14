export class ClientServicePricingResponseDto {
  id!: string;
  serviceType!: string;
  language!: string;
  titleBase!: string;
  titleAccent!: string;
  subtitleStrong!: string;
  subtitle!: string;
  popularBadge!: string;
  popularTitle!: string;
  popularDesc!: string;
  notes!: string[];
  createdAt!: Date;
  updatedAt!: Date;
}

export interface ClientServicePricingAllResponseDto {
  charter: ClientServicePricingResponseDto | null;
  custom: ClientServicePricingResponseDto | null;
  transfer: ClientServicePricingResponseDto | null;
}
