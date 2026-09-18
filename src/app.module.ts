import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ToursModule } from './tours/tours.module';
import { TourServicesModule } from './tour-services/tour-services.module';
import { CommentsModule } from './comments/comments.module';
import { ContactsModule } from './contacts/contacts.module';
import { AddpackagesModule } from './addpackages/addpackages.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { CronController } from './cron/cron.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule, 
    ToursModule, 
    TourServicesModule,
    CommentsModule,
    ContactsModule,
    AddpackagesModule,
    DatabaseModule
  ],
  controllers: [AppController, CronController],
  providers: [AppService],
})
export class AppModule {}