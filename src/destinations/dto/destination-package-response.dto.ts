export class DestinationPackageResponseDto {
  id!: string;
  title!: string;
  slug!: string;
  summary!: string;
  heroImage!: string | null;
  coordinates!: {
    lat: number;
    lng: number;
  };
}