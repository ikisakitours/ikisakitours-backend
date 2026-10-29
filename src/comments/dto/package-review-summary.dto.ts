export class PackageReviewSummaryDto {
  packageId!: string;
  packageName!: string;
  averageRating!: number;
  totalReviews!: number;
  topReviews!: Array<{
    id: string;
    fullName: string;
    rating: number;
    experience: string;
    imageUrls: string[];
    adminReply?: string | null;
    createdAt: string;
  }>;
  randomImageSets!: string[][];
}