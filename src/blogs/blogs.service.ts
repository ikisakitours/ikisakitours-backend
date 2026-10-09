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

  // Helper method: Generate URL-friendly slug from text
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Helper method: Map database row -> BlogResponseDto
  private mapToBlogResponseDto(
    blog: typeof schema.blogs.$inferSelect,
  ): BlogResponseDto {
    return {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      summary: blog.summary,
      category: blog.category,
      readTime: blog.readTime,
      content: blog.blog,
      author: blog.author,
      gallery: blog.images || [],
      likes: blog.likes,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
    };
  }

  // Helper method: Map database row -> BlogPreviewResponseDto
  private mapToBlogPreviewResponseDto(
    blog: typeof schema.blogs.$inferSelect,
  ): BlogPreviewResponseDto {
    return {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      summary: blog.summary,
      category: blog.category,
      readTime: blog.readTime,
      author: blog.author,
      previewImage:
        blog.images && blog.images.length > 0 ? blog.images[0] : null,
      likes: blog.likes,
      createdAt: blog.createdAt,
    };
  }

  // 1. Create Blog
  async create(dto: CreateBlogDto): Promise<BlogResponseDto> {
    // Generate slug from custom DTO slug or fallback to title
    const generatedSlug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.title);

    const [newBlog] = await this.db
      .insert(schema.blogs)
      .values({
        title: dto.title,
        slug: generatedSlug,
        summary: dto.summary,
        category: dto.category,
        readTime: dto.readTime,
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

  // 4. Fetch single blog post by Slug (for frontend public route)
  async findBySlug(slug: string): Promise<BlogResponseDto> {
    const blog = await this.db.query.blogs.findFirst({
      where: eq(schema.blogs.slug, slug),
    });

    if (!blog) {
      throw new NotFoundException(`Blog with slug "${slug}" not found`);
    }

    return this.mapToBlogResponseDto(blog);
  }

  // 5. Update likes count
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

  // 6. Delete blog post by ID
  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.db.delete(schema.blogs).where(eq(schema.blogs.id, id));

    return { message: `Blog post with ID "${id}" deleted successfully.` };
  }
}