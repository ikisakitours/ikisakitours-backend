import { IsString, IsNotEmpty, IsEmail, IsInt, Min, Max, IsArray, IsOptional, ArrayMaxSize, IsEnum } from 'class-validator';

export enum CommentType {
    WEBSITE = 'WEBSITE',
    PACKAGE = 'PACKAGE',
}

export class CreatePackageReviewDto {
    @IsString()
    @IsNotEmpty()
    packageId!: string;

    @IsString()
    @IsNotEmpty()
    packageName!: string;

    @IsEnum(CommentType)
    @IsOptional()
    type: CommentType = CommentType.PACKAGE;

    @IsString()
    @IsNotEmpty()
    fullName!: string;

    @IsEmail()
    email!: string;

    @IsInt()
    @Min(1)
    @Max(5)
    rating!: number;

    @IsString()
    @IsNotEmpty()
    experience!: string;

    @IsArray()
    @IsOptional()
    @ArrayMaxSize(5, { message: 'You can upload a maximum of 5 images' })
    @IsString({ each: true })
    imageUrls?: string[];
}