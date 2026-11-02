import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc, sql, and } from 'drizzle-orm';
import * as schema from '../database/schema';
import { DRIZZLE_DB } from '../database/database.provider';
import { CreateBlogDto } from './dto/create-blog.dto';
import { BlogResponseDto } from './dto/blog-response.dto';
import { BlogPreviewResponseDto } from './dto/blog-preview-response.dto';

@Injectable()
export class BlogsService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase<typeof schema>,
  ) { }

  // Helper method: Generate URL-friendly slug from text
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Helper method: Map database row -> BlogResponseDto with language fallback
  private mapToBlogResponseDto(
    blog: typeof schema.blogs.$inferSelect,
    lang: string = 'en',
  ): BlogResponseDto {
    // Determine the best language to serve (requested -> fallback to 'en' -> first available key)
    const targetLang =
      blog.title && blog.title[lang]
        ? lang
        : (blog.title && blog.title['en']
          ? 'en'
          : (blog.title ? Object.keys(blog.title)[0] || 'en' : 'en'));

    return {
      id: blog.id,
      title: blog.title?.[targetLang] || '',
      slug: blog.slug,
      summary: blog.summary?.[targetLang] || '',
      category: blog.category?.[targetLang] || '',
      readTime: blog.readTime?.[targetLang] || '',
      content: blog.blog?.[targetLang] || '',
      author: blog.author,
      language: targetLang, // Tells the frontend which language version was actually served
      gallery: blog.images || [],
      likes: blog.likes,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
    };
  }

  // Helper method: Map database row -> BlogPreviewResponseDto with language fallback
  private mapToBlogPreviewResponseDto(
    blog: typeof schema.blogs.$inferSelect,
    lang: string = 'en',
  ): BlogPreviewResponseDto {
    // Determine the best language to serve (requested -> fallback to 'en' -> first available key)
    const targetLang =
      blog.title && blog.title[lang]
        ? lang
        : (blog.title && blog.title['en']
          ? 'en'
          : (blog.title ? Object.keys(blog.title)[0] || 'en' : 'en'));

    return {
      id: blog.id,
      title: blog.title?.[targetLang] || '',
      slug: blog.slug,
      summary: blog.summary?.[targetLang] || '',
      category: blog.category?.[targetLang] || '',
      readTime: blog.readTime?.[targetLang] || '',
      author: blog.author,
      language: targetLang, // Returns the active language code served
      previewImage:
        blog.images && blog.images.length > 0 ? blog.images[0] : null,
      likes: blog.likes,
      createdAt: blog.createdAt,
    };
  }

  // 1. Create Blog
  async create(dto: CreateBlogDto): Promise<BlogResponseDto> {
    // Extract a string from the title object to generate the slug (defaults to English or first available)
    const titleText = dto.title['en'] || Object.values(dto.title)[0] || '';

    // Generate slug from custom DTO slug or fallback to title text
    const slug = (dto.slug?.trim() || this.slugify(titleText)) || `blog-${Date.now()}`;

    const [newBlog] = await this.db
      .insert(schema.blogs)
      .values({
        title: dto.title,
        slug: slug,
        summary: dto.summary,
        category: dto.category,
        readTime: dto.readTime,
        blog: dto.blog,
        author: dto.author,
        images: dto.images ?? [],
        likes: 0,
      })
      .returning();

    return this.mapToBlogResponseDto(newBlog, 'en');
  }

  // 2. Fetch small previews for card display on frontend
  async findPreviews(lang: string = 'en'): Promise<BlogPreviewResponseDto[]> {
    // Fetch all records sorted by creation date (no language 'where' filter)
    const records = await this.db.query.blogs.findMany({
      orderBy: [desc(schema.blogs.createdAt)],
    });

    // Pass the requested language down into the mapper for JSONB fallback
    return records.map((b) => this.mapToBlogPreviewResponseDto(b, lang));
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

  // 4. Fetch single destination/blog by Slug (for public frontend view)
  async findBySlug(slug: string, lang: string = 'en'): Promise<BlogResponseDto> {
    const blog = await this.db.query.blogs.findFirst({
      where: eq(schema.blogs.slug, slug),
    });

    if (!blog) {
      throw new NotFoundException(`Blog with slug "${slug}" not found`);
    }

    return this.mapToBlogResponseDto(blog, lang);
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

  // 7. Fetch full blog with a user-specific like check
  async findBlogWithUserCheck(
    blogId: string,
    userId?: string,
  ): Promise<BlogResponseDto & { isLiked: boolean }> {
    const blog = await this.findOne(blogId);
    let isLiked = false;

    if (userId) {
      const existingLike = await this.db.query.blogLikes.findFirst({
        where: and(
          eq(schema.blogLikes.blogId, blogId),
          eq(schema.blogLikes.userId, userId),
        ),
      });
      isLiked = !!existingLike;
    }

    return {
      ...blog,
      isLiked,
    };
  }

  // 8. Toggle like/unlike with explicit user tracking via join table
  async toggleLike(
    blogId: string,
    userId: string,
  ): Promise<{ liked: boolean; likesCount: number }> {
    await this.findOne(blogId);

    const existingLike = await this.db.query.blogLikes.findFirst({
      where: and(
        eq(schema.blogLikes.blogId, blogId),
        eq(schema.blogLikes.userId, userId),
      ),
    });

    let isLiked: boolean;

    if (existingLike) {
      // Unlike: Remove row and decrement likes
      await this.db
        .delete(schema.blogLikes)
        .where(eq(schema.blogLikes.id, existingLike.id));

      await this.db
        .update(schema.blogs)
        .set({
          likes: sql`GREATEST(${schema.blogs.likes} - 1, 0)`,
        })
        .where(eq(schema.blogs.id, blogId));

      isLiked = false;
    } else {
      // Like: Insert row and increment likes
      await this.db.insert(schema.blogLikes).values({
        blogId,
        userId,
      });

      await this.db
        .update(schema.blogs)
        .set({
          likes: sql`${schema.blogs.likes} + 1`,
        })
        .where(eq(schema.blogs.id, blogId));

      isLiked = true;
    }

    const updatedBlog = await this.findOne(blogId);

    return {
      liked: isLiked,
      likesCount: updatedBlog.likes,
    };
  }
}