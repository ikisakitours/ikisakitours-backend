import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsInt, Min, Max } from 'class-validator';

export enum CommentType {
    WEBSITE = 'WEBSITE',
    PACKAGE = 'PACKAGE',
}

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    content!: string;

    @IsEnum(CommentType)
    @IsNotEmpty()
    type!: CommentType;

    @IsOptional()
    @IsBoolean()
    isPublic?: boolean;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    rating?: number;
}