import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CommentsController } from './comments.controller';
import { PackageReviewsController } from './package-reviews.controller';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../users/jwt-auth.guard';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    JwtModule.register({
      secret:
        process.env.JWT_SECRET || 'super-secret-key-change-this-in-production',
    }),
    UploadsModule,
  ],
  controllers: [CommentsController, PackageReviewsController],
  providers: [CommentsService, JwtAuthGuard],
  exports: [CommentsService],
})
export class CommentsModule {}
