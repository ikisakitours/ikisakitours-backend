import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key-change-this-in-production',
    }),
    UploadsModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}