export class BlogResponseDto {
  id!: string;
  title!: string;
  content!: string;
  author!: string;
  gallery!: string[];
  likes!: number;
  createdAt!: Date;
  updatedAt!: Date;
}