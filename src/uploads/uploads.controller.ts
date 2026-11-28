import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import 'multer';
import { UploadsService } from './uploads.service';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { CreatePresignedUrlsDto } from './dto/create-presigned-urls.dto';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  // Single image: POST /uploads/single
  @Post('single')
  @UseInterceptors(FileInterceptor('image'))
  async uploadSingle(@UploadedFile() image: Express.Multer.File) {
    const url = await this.uploadsService.uploadImage(image);
    return { url };
  }

  // Multiple images (your shoe example): POST /uploads/batch
  @Post('batch')
  @UseInterceptors(FilesInterceptor('images', 10))
  async uploadBatch(
    @UploadedFiles() images: Express.Multer.File[],
    @Body('folder') folder?: string,
  ) {
    const urls = await this.uploadsService.uploadMultiple(images, folder);
    return { urls };
  }

  // Generate presigned R2 PUT URLs for direct browser-to-R2 uploads (bypasses Vercel 4.5MB limit)
  @Post('presigned-urls')
  @UseGuards(AdminAuthGuard)
  async createPresignedUrls(@Body() dto: CreatePresignedUrlsDto) {
    const uploads = await this.uploadsService.generatePresignedUrls(dto.files);
    return { uploads };
  }
}
