export class PackageSummaryResponseDto {
  id!: string;
  title!: string;
  origin!: string;
  price!: number;
  slug!: string;
  discount!: string | null;
  badge!: string | null;
  description!: string;
  heroImage!: string | null;
  category!: string;
  duration!: string;
  likes!: number;
  averageRating!: number;
}