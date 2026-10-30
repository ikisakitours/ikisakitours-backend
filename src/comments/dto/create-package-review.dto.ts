import { IsString, IsNotEmpty, IsEmail, IsInt, Min, Max, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum CommentType {
    WEBSITE = 'WEBSITE',
    PACKAGE = 'PACKAGE',
}

export class CreatePackageReviewDto {
    userId!: string;
    
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

    // Transforms string "5" from FormData into integer 5 before validation runs
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @Min(1)
    @Max(5)
    rating!: number;

    @IsString()
    @IsNotEmpty()
    experience!: string;

    @IsString()
    @IsOptional()
    adminReply?: string;
}