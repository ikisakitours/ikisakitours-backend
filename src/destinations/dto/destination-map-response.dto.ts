export class DestinationMapResponseDto {
  id!: string;
  slug!: string;
  title!: string;
  summary!: string;
  coordinates!: {
    lat: number;
    lng: number;
  };
  heroImage!: string | null;
  language!: string;
}