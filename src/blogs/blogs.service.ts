import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc, sql } from 'drizzle-orm';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { CreateBlogDto } from './dto/create-blog.dto';
import { BlogResponseDto } from './dto/blog-response.dto';
import { BlogPreviewResponseDto } from './dto/blog-preview-response.dto';

@Injectable()
export class BlogsService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  // Helper method: Map database row -> BlogResponseDto
  private mapToBlogResponseDto(blog: typeof schema.blogs.$inferSelect): BlogResponseDto {
    return {
      id: blog.id,
      title: blog.title,
      content: blog.blog,
      author: blog.author,
      gallery: blog.images || [],
      likes: blog.likes,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
    };
  }

  // Helper method: Map database row -> BlogPreviewResponseDto
  private mapToBlogPreviewResponseDto(blog: typeof schema.blogs.$inferSelect): BlogPreviewResponseDto {
    return {
      id: blog.id,
      title: blog.title,
      author: blog.author,
      previewImage: blog.images && blog.images.length > 0 ? blog.images[0] : null,
      likes: blog.likes,
      createdAt: blog.createdAt,
    };
  }

  // 1. Create Blog
  async create(dto: CreateBlogDto): Promise<BlogResponseDto> {
    const [newBlog] = await this.db
      .insert(schema.blogs)
      .values({
        title: dto.title,
        blog: dto.blog,
        author: dto.author,
        images: dto.images ?? [],
        likes: 0,
      })
      .returning();

    return this.mapToBlogResponseDto(newBlog);
  }

  // 2. Fetch small previews for card display on frontend
  async findPreviews(): Promise<BlogPreviewResponseDto[]> {
    const records = await this.db.query.blogs.findMany({
      orderBy: [desc(schema.blogs.createdAt)],
    });

    return records.map((b) => this.mapToBlogPreviewResponseDto(b));
  }

  // 3. Fetch single blog post by ID
  async findOne(id: string): Promise<BlogResponseDto> {
    const blog = await this.db.query.blogs.findFirst({
      where: eq(schema.blogs.id, id),
    });

    if (!blog) {
      throw new NotFoundException(`Blog with ID "${id}" not found`);
    }

    return this.mapToBlogResponseDto(blog);
  }

  // 4. Update likes count
  async updateLikes(id: string, increment: boolean): Promise<BlogResponseDto> {
    await this.findOne(id);

    const [updatedBlog] = await this.db
      .update(schema.blogs)
      .set({
        likes: increment
          ? sql`${schema.blogs.likes} + 1`
          : sql`GREATEST(${schema.blogs.likes} - 1, 0)`,
      })
      .where(eq(schema.blogs.id, id))
      .returning();

    return this.mapToBlogResponseDto(updatedBlog);
  }

  // 5. Delete blog post by ID
  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.db.delete(schema.blogs).where(eq(schema.blogs.id, id));

    return { message: `Blog post with ID "${id}" deleted successfully.` };
  }
}