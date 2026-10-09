export class BlogResponseDto {
  id!: string;
  title!: string;
  slug!: string;
  summary!: string;
  category!: string;
  readTime!: string;
  content!: string;
  author!: string;
  gallery!: string[];
  likes!: number;
  createdAt!: Date;
  updatedAt!: Date;
}