export class PackageReviewSummaryDto {
  packageId!: string;
  packageName!: string;
  averageRating!: number;
  totalReviews!: number;
  totalImages!: number;
  topReviews!: Array<{
    id: string;
    userSnapshot: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl: string | null;
      isVip: boolean;
      isVerified: boolean;
      hasAccess: boolean;
      country?: string;
    };
    fullName: string;
    rating: number;
    experience: string;
    imageUrls: string[];
    adminReply?: string | null;
    createdAt: string;
  }>;
  randomImageSets!: string[][];
}
