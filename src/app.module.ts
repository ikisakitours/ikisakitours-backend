import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ToursModule } from './tours/tours.module';
import { CommentsModule } from './comments/comments.module';
import { ContactsModule } from './contacts/contacts.module';
import { AddpackagesModule } from './addpackages/addpackages.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { CronController } from './cron/cron.controller';
import { BlogsModule } from './blogs/blogs.module';
import { DestinationsModule } from './destinations/destinations.module';
import { CookiesModule } from './cookies/cookies.module';
import { ServicesModule } from './tourservice/tourservice.module';
import { NewsletterModule } from './newsletter/newsletter.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule, 
    ToursModule, 
    CommentsModule,
    ContactsModule,
    AddpackagesModule,
    DatabaseModule,
    BlogsModule,
    DestinationsModule,
    CookiesModule,
    ServicesModule,
    NewsletterModule
  ],
  controllers: [AppController, CronController],
  providers: [AppService],
})
export class AppModule {}