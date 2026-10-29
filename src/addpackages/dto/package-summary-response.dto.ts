export class PackageSummaryResponseDto {
  id!: string;
  slug!: string;
  discount!: string | null;
  badge!: string | null;
  description!: string;
  heroImage!: string | null;
  category!: string;
  duration!: string;
  likes!: number;
}