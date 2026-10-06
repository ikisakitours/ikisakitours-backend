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

  // 2. Show small preview list for card design in frontend
  @Get('preview')
  async findPreviews(): Promise<BlogPreviewResponseDto[]> {
    return await this.blogsService.findPreviews();
  }

  // 3. Detailed version for reading a single post
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BlogResponseDto> {
    return await this.blogsService.findOne(id);
  }

  // 4. Update likes count based on user action ('like' or 'unlike')
  @Patch(':id/like')
  async toggleLike(
    @Param('id') id: string,
    @Body('action') action: 'like' | 'unlike',
  ): Promise<BlogResponseDto> {
    return await this.blogsService.updateLikes(id, action === 'like');
  }

  // 5. Delete route
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return await this.blogsService.remove(id);
  }
}