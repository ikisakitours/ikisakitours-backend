import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogPreviewResponseDto } from './dto/blog-preview-response.dto';
import { BlogResponseDto } from './dto/blog-response.dto';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  // 1. Create a blog (Admin) - Receives JSON with R2 image URLs
  @Post()
  async create(@Body() createDto: CreateBlogDto): Promise<BlogResponseDto> {
    return await this.blogsService.create(createDto);
  }

  // ADMIN 1: Fetch all raw multilingual blogs for the admin list view (MUST be above :id)
  @Get('admin')
  async findAllAdmin() {
    return await this.blogsService.findAllAdmin();
  }

  // ADMIN 2: Fetch a single raw multilingual blog by ID to pre-fill the edit form (MUST be above :id)
  @Get('admin/:id')
  async findOneAdmin(@Param('id') id: string) {
    return await this.blogsService.findOneAdmin(id);
  }

  // 2. Show small preview list for card design in frontend (Live only)
  @Get('previews')
  async findPreviews(
    @Query('lang') lang?: string,
  ): Promise<BlogPreviewResponseDto[]> {
    return await this.blogsService.findPreviews(lang, true);
  }

  // Public GET /blogs (Live only)
  @Get()
  async findAll(
    @Query('lang') lang?: string,
  ): Promise<BlogPreviewResponseDto[]> {
    return await this.blogsService.findPreviews(lang, true);
  }

  // 3. Fetch blog post by Slug (for frontend reader page, MUST be above :id)
  @Get('slug/:slug')
  async findBySlug(
    @Param('slug') slug: string,
    @Query('lang') lang: string = 'en',
    @Headers('x-admin-key') adminKey?: string,
    @Req() req?: Request,
  ): Promise<BlogResponseDto> {
    const isAdmin = Boolean(
      (adminKey &&
        process.env.ADMIN_API_KEY &&
        adminKey === process.env.ADMIN_API_KEY) ||
      req?.cookies?.['admin_session'],
    );
    return await this.blogsService.findBySlug(slug, lang, isAdmin);
  }

  // Visibility toggle
  @Patch(':id/visibility')
  async updateVisibility(
    @Param('id') id: string,
    @Body('isLive') isLive: boolean,
  ) {
    return await this.blogsService.updateVisibility(id, isLive);
  }

  //-----------------------------------------------
  // test routes for like button
  @Post('view')
  async getBlogWithUserCheck(
    @Body() body: { blogId: string; userId?: string },
  ) {
    return await this.blogsService.findBlogWithUserCheck(
      body.blogId,
      body.userId,
    );
  }

  @Post('like')
  async toggleLikeWithUser(@Body() body: { blogId: string; userId: string }) {
    return await this.blogsService.toggleLike(body.blogId, body.userId);
  }
  //------------------------------------------------

  // 4. Detailed version for reading a single post by ID or Slug (Dynamic route MUST be last among GETs)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('lang') lang: string = 'en',
    @Headers('x-admin-key') adminKey?: string,
    @Req() req?: Request,
  ): Promise<BlogResponseDto> {
    const isAdmin = Boolean(
      (adminKey &&
        process.env.ADMIN_API_KEY &&
        adminKey === process.env.ADMIN_API_KEY) ||
      req?.cookies?.['admin_session'],
    );
    // If id looks like a slug (non-UUID), check slug
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );
    if (!isUuid) {
      return await this.blogsService.findBySlug(id, lang, isAdmin);
    }
    return await this.blogsService.findOne(id);
  }

  // ADMIN 3: Update an existing blog post by ID
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBlogDto,
  ) {
    return await this.blogsService.update(id, updateDto);
  }

  // 5. Update likes count based on user action ('like' or 'unlike')
  @Patch(':id/like')
  async toggleLike(
    @Param('id') id: string,
    @Body('action') action: 'like' | 'unlike',
  ): Promise<BlogResponseDto> {
    return await this.blogsService.updateLikes(id, action === 'like');
  }

  // 6. Delete route
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return await this.blogsService.remove(id);
  }
}
