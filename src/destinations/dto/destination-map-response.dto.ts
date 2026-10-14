export class DestinationMapResponseDto {
  id!: string;
  title!: string;
  slug!: string;
  coordinates!: {
    lat: number;
    lng: number;
  };
  heroImage!: string | null;
}