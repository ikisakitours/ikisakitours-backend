import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
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

  // 2. Show small preview list for card design in frontend (MUST be above :id)
  @Get('previews')
  async findPreviews(
    @Query('lang') lang?: string,
  ): Promise<BlogPreviewResponseDto[]> {
    return await this.blogsService.findPreviews(lang);
  }

  // 3. Fetch blog post by Slug (for frontend reader page, MUST be above :id)
  @Get('slug/:slug')
  async findBySlug(
    @Param('slug') slug: string,
    @Query('lang') lang: string = 'en',
  ): Promise<BlogResponseDto> {
    return await this.blogsService.findBySlug(slug, lang);
  }

  //-----------------------------------------------
  // test routes for like button
  @Post('view')
  async getBlogWithUserCheck(
    @Body() body: { blogId: string; userId?: string },
  ) {
    return await this.blogsService.findBlogWithUserCheck(body.blogId, body.userId);
  }

  @Post('like')
  async toggleLikeWithUser(
    @Body() body: { blogId: string; userId: string },
  ) {
    return await this.blogsService.toggleLike(body.blogId, body.userId);
  }
  //------------------------------------------------

  // 4. Detailed version for reading a single post by ID (Dynamic route MUST be last among GETs)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BlogResponseDto> {
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