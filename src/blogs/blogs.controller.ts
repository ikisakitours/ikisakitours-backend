import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
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

  // 2. Show small preview list for card design in frontend (MUST be above :id)
  @Get('previews')
  async findPreviews(): Promise<BlogPreviewResponseDto[]> {
    return await this.blogsService.findPreviews();
  }

  // 3. Fetch blog post by Slug (for frontend reader page, MUST be above :id)
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<BlogResponseDto> {
    return await this.blogsService.findBySlug(slug);
  }

  // 4. Detailed version for reading a single post by ID (Dynamic route MUST be last)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BlogResponseDto> {
    return await this.blogsService.findOne(id);
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