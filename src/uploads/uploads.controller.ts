import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import 'multer';
import { UploadsService } from './uploads.service';

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
  @UseInterceptors(FilesInterceptor('images', 4)) // max 4 files
  async uploadBatch(
    @UploadedFiles() images: Express.Multer.File[],
    @Body('folder') folder?: string,
  ) {
    const urls = await this.uploadsService.uploadMultiple(images, folder);
    return { urls };
  }
}