import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ToursModule } from './tours/tours.module';

@Module({
  imports: [UsersModule, ToursModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
