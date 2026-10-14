export class DestinationResponseDto {
  id!: string;
  title!: string;
  slug!: string;
  summary!: string;
  description!: string;
  province!: string;
  highlights!: string[];
  images!: string[];
  bestTimeToVisit!: string;
  climate!: string;
  primaryLanguage!: string;
  localCurrency!: string;
  coordinates!: {
    lat: number;
    lng: number;
  };
  createdAt!: Date;
  updatedAt!: Date;
}