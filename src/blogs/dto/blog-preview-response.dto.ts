export class BlogPreviewResponseDto {
  id!: string;
  title!: string;
  slug!: string;
  summary!: string;
  category!: string;
  readTime!: string;
  author!: string;
  previewImage!: string | null;
  likes!: number;
  createdAt!: Date;
}
