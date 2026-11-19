import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreatePackageReviewDto } from './dto/create-package-review.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('package-reviews')
export class PackageReviewsController {
  constructor(private readonly commentsService: CommentsService) {}

  // 1. GET /package-reviews: List all tour reviews
  @Get()
  async findAll() {
    return await this.commentsService.findAllPackageReviews();
  }

  // 2. POST /package-reviews: Create package review
  @Post()
  @UseInterceptors(FilesInterceptor('images', 5))
  async create(
    @Body() dto: CreatePackageReviewDto,
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    return await this.commentsService.createPackageReview(dto, images);
  }

  // 3. PATCH /package-reviews/:id/reply: Admin reply
  @Patch(':id/reply')
  async reply(@Param('id') id: string, @Body('adminReply') adminReply: string) {
    return await this.commentsService.replyToPackageReview(id, adminReply);
  }

  // 4. PATCH /package-reviews/:id/visibility: Toggle visibility
  @Patch(':id/visibility')
  async updateVisibility(
    @Param('id') id: string,
    @Body() updateVisibilityDto: UpdateVisibilityDto,
  ) {
    return await this.commentsService.updatePackageReviewVisibility(
      id,
      updateVisibilityDto,
    );
  }

  // 5. DELETE /package-reviews/:id: Delete tour review
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.commentsService.deletePackageReview(id);
  }

  // 6. GET /package-reviews/:packageId/summary: Summary for a package
  @Get(':packageId/summary')
  async getSummary(@Param('packageId') packageId: string) {
    return await this.commentsService.getPackageReviewSummary(packageId);
  }

  // 7. GET /package-reviews/:packageId: Get reviews for a specific package
  @Get(':packageId')
  async getByPackageId(@Param('packageId') packageId: string) {
    return await this.commentsService.getAllReviewsByPackageId(packageId);
  }
}
