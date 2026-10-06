export class BlogPreviewResponseDto {
  id!: string;
  title!: string;
  author!: string;
  previewImage!: string | null;
  likes!: number;
  createdAt!: Date;
}