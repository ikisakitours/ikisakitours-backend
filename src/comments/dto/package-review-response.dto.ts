import { IsString, IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class PackageReviewResponseDto {
  @IsString()
  id!: string;

  @IsString()
  referenceId!: string;

  @IsString()
  packageId!: string;

  @IsString()
  packageName!: string;

  @IsString()
  type!: string;

  userSnapshot!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    country: string;
    avatarUrl: string | null;
    isVip: boolean;
    isVerified: boolean;
    hasAccess: boolean;
  };

  @IsString()
  fullName!: string;

  @IsString()
  email!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  experience!: string;

  imageUrls?: string[] | null;

  @IsOptional()
  @IsString()
  adminReply?: string | null;

  @IsOptional()
  adminReplyAt?: string | null;

  @IsBoolean()
  isPublic!: boolean;

  createdAt!: string;
}
